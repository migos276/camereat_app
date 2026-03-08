"use client"

import type React from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { LivreurStackParamList } from "../../navigation/LivreurNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { acceptDelivery } from "../../redux/slices/livreurSlice"

type Props = NativeStackScreenProps<LivreurStackParamList, "DeliveryDetail">

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getClientName = (delivery: any): string =>
  delivery?.client_name || delivery?.customer?.name || delivery?.order?.client_name || "Client"

const getDeliveryAddress = (delivery: any): string => {
  const rawAddress =
    delivery?.client_delivery_address ||
    delivery?.delivery_address_text ||
    delivery?.delivery_address ||
    delivery?.order?.client_delivery_address ||
    delivery?.order?.delivery_address_text

  if (!rawAddress) return "Adresse non disponible"
  if (typeof rawAddress === "string") return rawAddress
  if (typeof rawAddress === "object") {
    return rawAddress.street || rawAddress.label || rawAddress.address || "Adresse non disponible"
  }
  return "Adresse non disponible"
}

const getRestaurantAddress = (delivery: any): string => {
  const rawAddress =
    delivery?.restaurant_address ||
    delivery?.pickup_address ||
    delivery?.restaurant?.full_address ||
    delivery?.restaurant?.address

  if (!rawAddress) return "Adresse du restaurant non disponible"
  if (typeof rawAddress === "string") return rawAddress
  if (typeof rawAddress === "object") {
    return rawAddress.street || rawAddress.label || rawAddress.address || "Adresse du restaurant non disponible"
  }
  return "Adresse du restaurant non disponible"
}

const getRestaurantName = (delivery: any): string =>
  delivery?.restaurant_name ||
  delivery?.restaurant?.commercial_name ||
  delivery?.restaurant?.name ||
  "Restaurant"

const DeliveryDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params
  const dispatch = useAppDispatch()
  const { availableDeliveries, isLoading } = useAppSelector((state) => state.livreur)

  const delivery = availableDeliveries.find((d) => d.id === id)

  const handleAccept = async () => {
    try {
      await dispatch(acceptDelivery(id)).unwrap()
      navigation.navigate("ActiveDelivery", { id })
    } catch (error) {
      Alert.alert("Error", "Could not accept this delivery. It might have been taken by another driver.")
    }
  }

  if (!delivery) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={TYPOGRAPHY.body1}>Delivery not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const subtotal = toNumber((delivery as any).total ?? (delivery as any).products_amount)
  const deliveryFee = toNumber((delivery as any).deliveryFee ?? (delivery as any).delivery_fee)
  const clientName = getClientName(delivery)
  const deliveryAddress = getDeliveryAddress(delivery)
  const restaurantName = getRestaurantName(delivery)
  const restaurantAddress = getRestaurantAddress(delivery)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{restaurantName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={styles.infoSubtext}>{restaurantAddress}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{clientName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={styles.infoSubtext}>{deliveryAddress}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.infoCard}>
          {delivery.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{toNumber((item as any).quantity, 1)}x</Text>
              <Text style={styles.itemName}>{(item as any).name || (item as any).produit?.name || "Article"}</Text>
              <Text style={styles.itemPrice}>
                {toNumber((item as any).line_total, toNumber((item as any).price) * toNumber((item as any).quantity, 1)).toFixed(2)} FCFA
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalValue}>{deliveryFee.toFixed(2)} FCFA</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Earnings</Text>
            <Text style={styles.grandTotalValue}>{(subtotal + deliveryFee).toFixed(2)} FCFA</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="map" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{delivery.distance}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="timer" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{delivery.estimatedTime}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.declineButton} onPress={() => navigation.goBack()}>
          <Text style={styles.declineButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Delivery</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  section: { padding: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as any,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
  },
  infoCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  infoText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark },
  infoSubtext: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  itemQuantity: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.primary, width: 30 },
  itemName: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  itemPrice: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" as any, color: COLORS.dark },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.xs },
  totalLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  totalValue: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  grandTotalLabel: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.dark },
  grandTotalValue: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "bold" as any, color: COLORS.success },
  actions: { flexDirection: "row", padding: SPACING.md, gap: SPACING.sm },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
  },
  acceptButtonText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
  },
  declineButtonText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },
})

export default DeliveryDetailScreen
