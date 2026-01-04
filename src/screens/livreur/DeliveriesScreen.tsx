"use client"

import React, { useEffect } from "react"
import { View, StyleSheet, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { LivreurStackParamList } from "../../navigation/LivreurNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getAvailableDeliveries, acceptDelivery } from "../../redux/slices/livreurSlice"
import type { Delivery } from "../../types"

type Props = NativeStackScreenProps<LivreurStackParamList, "Deliveries">

const DeliveriesScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { availableDeliveries, isLoading } = useAppSelector((state) => state.livreur)

  useEffect(() => {
    dispatch(getAvailableDeliveries())
  }, [dispatch])

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
          <Text style={styles.restaurantName}>{item.restaurant?.name || "Restaurant"}</Text>
        </View>
        <Text style={styles.deliveryTime}>{item.created_at || "Just now"}</Text>
      </View>

      <View style={styles.deliveryBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>{item.customer?.name || "Customer"}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>{item.delivery_address || "Address"}</Text>
        </View>
        {item.distance && (
          <View style={styles.infoRow}>
            <MaterialIcons name="local-shipping" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>{item.distance} km</Text>
          </View>
        )}
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsText}>${item.delivery_fee?.toFixed(2) || "0.00"}</Text>
        </View>
        {item.items_count && (
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
