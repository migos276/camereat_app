"use client"

import React, { useEffect, useCallback } from "react"
import { View, StyleSheet, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from "react-native"
import * as Location from "expo-location"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { LivreurStackParamList } from "../../navigation/LivreurNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getAvailableDeliveries, acceptDelivery, updatePosition, clearError } from "../../redux/slices/livreurSlice"
import type { Delivery } from "../../types"

type Props = NativeStackScreenProps<LivreurStackParamList, "Deliveries">

const toCurrencyNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getDisplayPrice = (item: any): number =>
  toCurrencyNumber(
    item?.estimated_pay ??
      item?.total_amount ??
      item?.amount ??
      item?.delivery_fee ??
      item?.products_amount
  )

const hasPositiveValue = (value: unknown): boolean => toCurrencyNumber(value) > 0

const getClientName = (item: any): string =>
  item?.client_name || item?.customer?.name || item?.order?.client_name || "Client"

const getDeliveryAddress = (item: any): string => {
  const rawAddress =
    item?.client_delivery_address ||
    item?.delivery_address_text ||
    item?.delivery_address ||
    item?.order?.client_delivery_address ||
    item?.order?.delivery_address_text

  if (!rawAddress) return "Adresse non disponible"
  if (typeof rawAddress === "string") return rawAddress
  if (typeof rawAddress === "object") {
    return rawAddress.street || rawAddress.label || rawAddress.address || "Adresse non disponible"
  }
  return "Adresse non disponible"
}

const DeliveriesScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { availableDeliveries, isLoading, error } = useAppSelector((state) => state.livreur)

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Vous devez autoriser l'accès à votre position GPS pour voir les commandes disponibles."
        )
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const { latitude, longitude } = location.coords
      await dispatch(updatePosition({ latitude, longitude })).unwrap()

      setTimeout(() => {
        dispatch(getAvailableDeliveries())
      }, 500)
      
    } catch (err: any) {
      console.error("Error getting location:", err)
      Alert.alert(
        "Erreur de localisation",
        "Impossible d'obtenir votre position. Veuillez vérifier que GPS est activé."
      )
    }
  }, [dispatch])

  const handleError = (errorData: any) => {
    const detail = errorData?.detail || "Une erreur est survenue"
    const code = errorData?.code || errorData?.error

    if (code === "position_not_set" || code === "POSITION_NOT_SET") {
      Alert.alert(
        "Position GPS requise",
        "Vous devez définir votre position GPS pour voir les commandes disponibles.",
        [
          { 
            text: "Mettre à jour la position", 
            onPress: () => requestLocation()
          },
          { 
            text: "Annuler", 
            style: "cancel" 
          }
        ]
      )
    }
  }

  const loadDeliveries = useCallback(async () => {
    // First try to get location and update position before fetching deliveries
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        const { latitude, longitude } = location.coords
        
        // Update position in Redux
        await dispatch(updatePosition({ latitude, longitude }))
      }
    } catch (err: any) {
      console.log("Could not get location, will try without it:", err)
    }
    
    await dispatch(getAvailableDeliveries())
  }, [dispatch])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  useEffect(() => {
    if (error) {
      handleError(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const onRefresh = () => {
    dispatch(getAvailableDeliveries())
  }

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      await dispatch(acceptDelivery(deliveryId)).unwrap()
      navigation.navigate("ActiveDelivery", { id: deliveryId })
    } catch (error) {
      console.error("[v0] Failed to accept delivery:", error)
    }
  }

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate("DeliveryDetail", { id: item.id })}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.restaurantInfo}>
          <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
          <Text style={styles.restaurantName}>{(item as any).restaurant_name || item.restaurant?.name || "Restaurant"}</Text>
        </View>
        <Text style={styles.deliveryTime}>{item.created_at || "Just now"}</Text>
      </View>

      <View style={styles.deliveryBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>{getClientName(item)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>{getDeliveryAddress(item)}</Text>
        </View>
        {hasPositiveValue((item as any).distance) && (
          <View style={styles.infoRow}>
            <MaterialIcons name="local-shipping" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>{item.distance} km</Text>
          </View>
        )}
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsText}>{getDisplayPrice(item).toFixed(2)} FCFA</Text>
        </View>
        {hasPositiveValue((item as any).items_count) && (
          <View style={styles.itemsBadge}>
            <Text style={styles.itemsText}>{item.items_count} items</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Orders</Text>
        <Text style={styles.headerSubtitle}>{availableDeliveries.length} orders nearby</Text>
      </View>

      {isLoading && availableDeliveries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={availableDeliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderDeliveryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="local-shipping" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No available orders</Text>
              <Text style={styles.emptySubtext}>Check back later for new deliveries</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, paddingTop: SPACING["2xl"] },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  headerSubtitle: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  listContent: { padding: SPACING.md },
  deliveryCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  deliveryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  restaurantInfo: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  restaurantName: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.dark },
  deliveryTime: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  deliveryBody: { marginBottom: SPACING.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginBottom: SPACING.xs },
  infoText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  deliveryFooter: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  earningsBadge: { backgroundColor: COLORS.success + "20", paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.xs },
  earningsText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.success },
  itemsBadge: { backgroundColor: COLORS.lightGray, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.xs },
  itemsText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  acceptButton: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, borderRadius: SPACING.sm, alignItems: "center" },
  acceptButtonText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.white },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: SPACING["2xl"] },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "600" as any, color: COLORS.dark, marginTop: SPACING.md },
  emptySubtext: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, marginTop: SPACING.xs },
})

export default DeliveriesScreen
