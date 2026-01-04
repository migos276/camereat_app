"use client"

import React from "react"
import { useState } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { MaterialIcons } from "@expo/vector-icons"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { cancelOrder } from "../../redux/slices/orderSlice"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"

type Props = NativeStackScreenProps<ClientStackParamList, "OrderDetail">

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
}

interface OrderDetail {
  id: string
  restaurantName: string
  restaurantImage: string
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  deliveryAddress: string
  estimatedDelivery: string
  orderDate: string
  paymentMethod: string
}

const MOCK_ORDER_DETAIL: OrderDetail = {
  id: "ORD-001",
  restaurantName: "Burger Palace",
  restaurantImage: "https://example.com/burger-palace.jpg",
  status: "preparing",
  items: [
    { id: "1", name: "Classic Burger", quantity: 2, price: 12.99, image: undefined },
    { id: "2", name: "French Fries", quantity: 1, price: 4.99, image: undefined },
    { id: "3", name: "Coca Cola", quantity: 2, price: 2.50, image: undefined },
  ],
  subtotal: 35.47,
  deliveryFee: 3.99,
  tax: 3.18,
  total: 42.64,
  deliveryAddress: "123 Main St, Apt 4B, City, State 12345",
  estimatedDelivery: "45 min",
  orderDate: "2024-01-15 14:30",
  paymentMethod: "Credit Card ****4242",
}

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [order, setOrder] = useState<OrderDetail | null>(MOCK_ORDER_DETAIL)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.warning
      case "confirmed":
        return COLORS.info
      case "preparing":
        return COLORS.primary
      case "ready":
        return COLORS.success
      case "delivered":
        return COLORS.gray
      case "cancelled":
        return COLORS.error
      default:
        return COLORS.gray
    }
  }

  const getStatusStep = (status: string) => {
    const steps = ["pending", "confirmed", "preparing", "ready", "delivered"]
    return steps.indexOf(status) + 1
  }

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: () => {
            // dispatch(cancelOrder(id))
            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.")
            navigation.goBack()
          },
        },
      ],
    )
  }

  const handleReorder = () => {
    Alert.alert("Reorder", "Add all items to cart?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          // Add items to cart
          Alert.alert("Success", "Items added to cart!")
        },
      },
    ])
  }

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  )

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text>Order not found</Text>
      </View>
    )
  }

  const statusStep = getStatusStep(order.status)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{order.orderDate}</Text>
      </View>

      {/* Order Progress */}
      {order.status !== "cancelled" && order.status !== "delivered" && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Order Progress</Text>
          <View style={styles.progressSteps}>
            {["Confirmed", "Preparing", "Ready", "Delivered"].map((step, index) => (
              <View key={index} style={styles.progressStep}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor:
                        statusStep > index + 1 || statusStep === 5
                          ? COLORS.primary
                          : statusStep === index + 1
                          ? COLORS.primary
                          : COLORS.lightGray,
                    },
                  ]}
                >
                  {statusStep > index + 1 || statusStep === 5 ? (
                    <MaterialIcons name="check" size={14} color={COLORS.white} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    { color: statusStep >= index + 1 ? COLORS.dark : COLORS.gray },
                  ]}
                >
                  {step}
                </Text>
                {index < 3 && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor:
                          statusStep > index + 1 ? COLORS.primary : COLORS.lightGray,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          {order.estimatedDelivery && (
            <Text style={styles.estimatedDelivery}>
              Estimated Delivery: {order.estimatedDelivery}
            </Text>
          )}
        </View>
      )}

      {/* Restaurant Info */}
      <View style={styles.restaurantCard}>
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantIcon}>
            <MaterialIcons name="restaurant" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{order.restaurantName}</Text>
            <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <FlatList
          data={order.items}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          scrollEnabled={false}
        />
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>${order.deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Delivery Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <View style={styles.deliveryInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>{order.deliveryAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="payment" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>{order.paymentMethod}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {order.status !== "cancelled" && order.status !== "delivered" && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "delivered" && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.reorderButton} onPress={handleReorder}>
            <Text style={styles.reorderButtonText}>Order Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Support */}
      <TouchableOpacity style={styles.supportButton}>
        <MaterialIcons name="support-agent" size={20} color={COLORS.primary} />
        <Text style={styles.supportButtonText}>Contact Support</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  orderId: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: SPACING.md,
  },
  progressTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepLine: {
    position: "absolute",
    top: 14,
    left: "50%",
    width: "100%",
    height: 2,
    zIndex: -1,
  },
  stepText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  estimatedDelivery: {
    textAlign: "center",
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  restaurantCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: SPACING.md,
  },
  restaurantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  deliveryAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemQuantity: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    width: 30,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.dark,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.dark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.dark,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  deliveryInfo: {
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.dark,
  },
  actions: {
    flexDirection: "row",
    margin: SPACING.md,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: SPACING.md,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
  },
  reorderButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.md,
  },
  reorderButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: SPACING.md,
    padding: SPACING.md,
  },
  supportButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
})

export default OrderDetailScreen
