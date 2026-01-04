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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{delivery.restaurant?.name || "Restaurant"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={styles.infoSubtext}>{delivery.pickup_address || "Pickup Address"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{delivery.customer?.name || "Customer"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={styles.infoSubtext}>{delivery.delivery_address || "Delivery Address"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.infoCard}>
          {delivery.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${delivery.total.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalValue}>${delivery.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Earnings</Text>
            <Text style={styles.grandTotalValue}>${(delivery.total + delivery.deliveryFee).toFixed(2)}</Text>
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
