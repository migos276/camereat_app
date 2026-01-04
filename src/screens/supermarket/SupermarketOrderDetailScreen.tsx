"use client"

import React from "react"
import { useState } from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList, Alert } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { SupermarchéStackParamList } from "../../navigation/SupermarchéNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"

type Props = NativeStackScreenProps<SupermarchéStackParamList, "SupermarketOrderDetail">

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

const SupermarketOrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params
  const [status, setStatus] = useState("new")

  const order = {
    id: id,
    customerName: "Alice Johnson",
    customerPhone: "+1 234 567 8900",
    deliveryAddress: "123 Main St, Apt 4B, City",
    items: [
      { id: "1", name: "Organic Milk", quantity: 2, price: 3.99 },
      { id: "2", name: "Whole Wheat Bread", quantity: 1, price: 2.99 },
      { id: "3", name: "Fresh Apples", quantity: 3, price: 4.99 },
      { id: "4", name: "Chicken Breast", quantity: 2, price: 8.99 },
    ],
    subtotal: 37.93,
    deliveryFee: 5.00,
    total: 42.93,
    orderTime: "2024-01-15 14:30",
    estimatedTime: "30 min",
  }

  const handleUpdateStatus = (newStatus: string) => {
    setStatus(newStatus)
    Alert.alert("Status Updated", `Order status changed to ${newStatus}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return COLORS.danger
      case "accepted": return COLORS.warning
      case "ready": return COLORS.success
      case "pickup": return COLORS.primary
      case "completed": return COLORS.gray
      case "cancelled": return COLORS.danger
      default: return COLORS.gray
    }
  }

  const renderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemQuantity}>{item.quantity}x</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
      </View>
      <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderTime}>{order.orderTime}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.infoCard}>
          <FlatList
            data={order.items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalValue}>${order.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusButtons}>
          {["new", "accepted", "ready", "pickup", "completed"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusButton, { backgroundColor: status === s ? getStatusColor(s) : COLORS.light }]}
              onPress={() => handleUpdateStatus(s)}
            >
              <Text
                style={[styles.statusButtonText, { color: status === s ? COLORS.white : COLORS.dark }]}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {status === "ready" && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.notifyButton} onPress={() => Alert.alert("Notified", "Customer has been notified that order is ready")}>
            <MaterialIcons name="notifications" size={20} color={COLORS.white} />
            <Text style={styles.notifyButtonText}>Notify Customer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estimated Time</Text>
        <Text style={styles.estimatedTime}>{order.estimatedTime}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  header: { backgroundColor: COLORS.SUPERMARCHE_PRIMARY, padding: SPACING.lg, paddingTop: SPACING["2xl"] },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  orderTime: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.xs },
  statusText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.gray, marginBottom: SPACING.sm, textTransform: "uppercase" },
  infoCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  infoText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  itemQuantity: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.primary, width: 30 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  itemNotes: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.gray, fontStyle: "italic" },
  itemPrice: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" as any, color: COLORS.dark },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.xs },
  totalLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  totalValue: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  grandTotalLabel: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.dark },
  grandTotalValue: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "bold" as any, color: COLORS.primary },
  statusButtons: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  statusButton: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.xs },
  statusButtonText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" as any },
  notifyButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.success, padding: SPACING.md, borderRadius: SPACING.sm, gap: SPACING.sm },
  notifyButtonText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },
  estimatedTime: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.primary },
})

export default SupermarketOrderDetailScreen

