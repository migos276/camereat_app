"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import { useAppDispatch } from "../../hooks"
import { cancelOrder as cancelOrderAction } from "../../redux/slices/orderSlice"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { orderService } from "../../services/order-service"
import type { Order } from "../../types"

type Props = NativeStackScreenProps<ClientStackParamList, "OrderDetail">

interface OrderItemType {
  id: string
  produit?: { name?: string }
  product?: { name?: string }
  quantity: number
  line_total: number
}

// Map backend status to frontend status
const statusMapping: Record<string, string> = {
  EN_ATTENTE: "pending",
  ACCEPTEE: "confirmed",
  EN_PREPARATION: "preparing",
  PRETE: "ready",
  LIVREUR_ASSIGNE: "ready",
  EN_ROUTE_COLLECTE: "preparing",
  COLLECTEE: "preparing",
  EN_LIVRAISON: "ready",
  LIVREE: "delivered",
  ANNULEE: "cancelled",
  REFUSEE: "cancelled",
}

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params
  const dispatch = useAppDispatch()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setIsLoading(true)
        const orderData = await orderService.getOrder(id)
        setOrder(orderData)
      } catch (err: any) {
        console.error("Error fetching order detail:", err)
        setError(err.message || "Failed to load order details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetail()
  }, [id])

  const getFrontendStatus = (backendStatus: string): string => {
    return statusMapping[backendStatus] || "pending"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.warning
      case "confirmed":
        return COLORS.primary
      case "preparing":
        return COLORS.primary
      case "ready":
        return COLORS.success
      case "delivered":
        return COLORS.gray
      case "cancelled":
        return COLORS.danger
      default:
        return COLORS.gray
    }
  }

  const getStatusStep = (status: string) => {
    const steps = ["pending", "confirmed", "preparing", "ready", "delivered"]
    return steps.indexOf(status) + 1
  }

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Preparing",
      ready: "Ready",
      delivered: "Delivered",
      cancelled: "Cancelled",
    }
    return statusTexts[status] || status
  }

  const handleCancelOrder = () => {
    if (!order) return
    
    // Only allow cancellation for certain statuses
    if (order.status !== 'EN_ATTENTE' && order.status !== 'ACCEPTEE') {
      Alert.alert("Cannot Cancel", "This order can no longer be cancelled.")
      return
    }

    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true)
              await orderService.cancelOrder(id)
              Alert.alert("Order Cancelled", "Your order has been cancelled successfully.")
              // Refresh order data
              const updatedOrder = await orderService.getOrder(id)
              setOrder(updatedOrder)
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel order")
            } finally {
              setCancelling(false)
            }
          },
        },
      ],
    )
  }

  const handleReorder = () => {
    if (!order || !order.items) return
    
    Alert.alert("Reorder", "Add all items to cart?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          // TODO: Add items to cart functionality
          Alert.alert("Success", "Items added to cart!")
        },
      },
    ])
  }

  const handleTrackOrder = () => {
    navigation.navigate("OrderTracking", { id })
  }

  const renderOrderItem = ({ item, index }: { item: OrderItemType; index: number }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
        <Text style={styles.itemName}>
          {item.produit?.name || item.product?.name || `Product ${index + 1}`}
        </Text>
      </View>
      <Text style={styles.itemPrice}>
        {parseFloat(String(item.line_total || 0)).toFixed(2)} FCFA
      </Text>
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    )
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error || "Order not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const frontendStatus = getFrontendStatus(order.status)
  const statusStep = getStatusStep(frontendStatus)
  const items = order.items || []

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.numero || order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(frontendStatus) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(frontendStatus) }]}>
              {getStatusText(frontendStatus)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          {order.date_created ? new Date(order.date_created).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : ''}
        </Text>
      </View>

      {/* Order Progress */}
      {frontendStatus !== "cancelled" && frontendStatus !== "delivered" && (
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
          {order.estimated_duration_minutes && (
            <Text style={styles.estimatedDelivery}>
              Estimated Delivery: {order.estimated_duration_minutes} minutes
            </Text>
          )}
        </View>
      )}

      {/* Track Order Button */}
      {frontendStatus !== "cancelled" && frontendStatus !== "delivered" && (
        <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
          <MaterialIcons name="local-shipping" size={20} color={COLORS.white} />
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
      )}

      {/* Restaurant Info */}
      {order.restaurant_name && (
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantInfo}>
            <View style={styles.restaurantIcon}>
              <MaterialIcons name="restaurant" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
              <Text style={styles.deliveryAddress}>{order.delivery_address_text}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.length > 0 ? (
          <FlatList
            data={items.map(item => ({
              id: item.id,
              product: item.product,
              quantity: item.quantity,
              line_total: item.line_total,
            }))}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderOrderItem}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noItemsText}>No items available</Text>
        )}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {parseFloat(String(order.products_amount || 0)).toFixed(2)} FCFA
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>
            {parseFloat(String(order.delivery_fee || 0)).toFixed(2)} FCFA
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {parseFloat(String(order.total_amount || 0)).toFixed(2)} FCFA
          </Text>
        </View>
      </View>

      {/* Delivery Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <View style={styles.deliveryInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>{order.delivery_address_text || "Address not specified"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="payment" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              {order.payment_mode === 'ESPECES' ? 'Cash' : 
               order.payment_mode === 'CARTE' ? 'Card' : 
               order.payment_mode === 'MOBILE_MONEY' ? 'Mobile Money' : order.payment_mode}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="verified" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              Payment Status: {order.payment_status === 'PAYE' ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Special Instructions */}
      {order.special_instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.specialInstructions}>{order.special_instructions}</Text>
        </View>
      )}

      {/* Action Buttons */}
      {(frontendStatus === "pending" || frontendStatus === "confirmed") && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {frontendStatus === "delivered" && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.danger,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "600",
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
    fontWeight: "700",
    color: COLORS.dark,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.primary,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.md,
    gap: SPACING.sm,
  },
  trackButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.white,
  },
  restaurantCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
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
    marginBottom: 0,
    padding: SPACING.md,
    borderRadius: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.primary,
    width: 30,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "500",
    color: COLORS.dark,
  },
  noItemsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
    textAlign: "center",
    paddingVertical: SPACING.md,
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
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
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
    fontWeight: "700",
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700",
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
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  specialInstructions: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    fontStyle: "italic",
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
    borderColor: COLORS.danger,
    borderRadius: SPACING.md,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.danger,
  },
  reorderButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.md,
  },
  reorderButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
})

export default OrderDetailScreen

