"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Linking, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { orderService } from "../../services/order-service"
import type { Order } from "../../types"

interface RouteParams {
  id?: string
  orderId?: string
}

interface TrackingData {
  numero: string
  status: string
  estimated_duration_minutes: number
  distance_km: number
  livreur: string | null
  livreur_phone: string | null
}

interface OrderItemType {
  id: string
  produit?: { name?: string }
  product?: { name?: string }
  quantity: number
  line_total: number
}

export const OrderTrackingScreen: React.FC<{ navigation: any; route: { params?: RouteParams } }> = ({ navigation, route }) => {
  const orderId = route.params?.id || route.params?.orderId
  
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError("Order ID not found")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // Fetch order details
        const orderData = await orderService.getOrder(orderId)
        setOrder(orderData)

        // Fetch tracking info
        const trackingData = await orderService.trackOrder(orderId)
        setTracking(trackingData)
      } catch (err: any) {
        console.error("Error fetching order data:", err)
        setError(err.message || "Failed to load order data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId])

  // Map backend status to frontend status
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; completed: boolean; current: boolean }> = {
      EN_ATTENTE: { label: "Order Confirmed", color: COLORS.warning, completed: true, current: false },
      ACCEPTEE: { label: "Order Accepted", color: COLORS.primary, completed: true, current: false },
      EN_PREPARATION: { label: "Preparing", color: COLORS.primary, completed: true, current: true },
      PRETE: { label: "Ready for Pickup", color: COLORS.success, completed: true, current: true },
      LIVREUR_ASSIGNE: { label: "Driver Assigned", color: COLORS.success, completed: true, current: true },
      EN_ROUTE_COLLECTE: { label: "Driver on the way", color: COLORS.success, completed: true, current: true },
      COLLECTEE: { label: "Order Collected", color: COLORS.success, completed: true, current: true },
      EN_LIVRAISON: { label: "Out for Delivery", color: COLORS.success, completed: true, current: true },
      LIVREE: { label: "Delivered", color: COLORS.success, completed: true, current: false },
      ANNULEE: { label: "Cancelled", color: COLORS.danger, completed: false, current: false },
      REFUSEE: { label: "Refused", color: COLORS.danger, completed: false, current: false },
    }
    return statusMap[status] || { label: status, color: COLORS.gray, completed: false, current: false }
  }

  // Get progress steps based on status
  const getProgressSteps = (status: string) => {
    const steps = [
      { key: "confirmed", label: "Order Confirmed", status: "completed" },
      { key: "preparing", label: "Restaurant Preparing", status: "pending" },
      { key: "ready", label: "Ready for Pickup", status: "pending" },
      { key: "delivered", label: "Delivered", status: "pending" },
    ]

    const statusOrder = [
      "EN_ATTENTE",
      "ACCEPTEE",
      "EN_PREPARATION",
      "PRETE",
      "LIVREUR_ASSIGNE",
      "EN_ROUTE_COLLECTE",
      "COLLECTEE",
      "EN_LIVRAISON",
      "LIVREE",
    ]

    const currentIndex = statusOrder.indexOf(status)

    if (status === "ANNULEE" || status === "REFUSEE") {
      return steps.map((step) => ({ ...step, status: "cancelled" }))
    }

    if (currentIndex === -1) return steps

    return steps.map((step, index) => {
      if (index < currentIndex) return { ...step, status: "completed" }
      if (index === currentIndex) return { ...step, status: "current" }
      return { ...step, status: "pending" }
    })
  }

  const handleCallDriver = () => {
    if (tracking?.livreur_phone) {
      Linking.openURL(`tel:${tracking.livreur_phone}`)
    } else {
      Alert.alert("Info", "Driver phone number not available")
    }
  }

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return COLORS.success
      case "current":
        return COLORS.primary
      case "cancelled":
        return COLORS.danger
      default:
        return COLORS.lightGray
    }
  }

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return "check"
      case "current":
        return "access-time"
      case "cancelled":
        return "close"
      default:
        return "radio-button-unchecked"
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    )
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error || "Order not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const progressSteps = getProgressSteps(order.status)
  const items = order.items || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.numero || order.id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
              <MaterialIcons name={statusInfo.completed && order.status === "LIVREE" ? "check-circle" : "access-time"} size={32} color={COLORS.white} />
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>{statusInfo.label}</Text>
              <Text style={styles.statusTime}>
                {order.date_created ? new Date(order.date_created).toLocaleString('fr-FR') : 'Just now'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          {progressSteps.map((step, index) => (
            <View key={step.key}>
              <View style={styles.progressItem}>
                <View style={[styles.progressDot, { backgroundColor: getStepColor(step.status) }]}>
                  {step.status === "completed" && <MaterialIcons name="check" size={10} color={COLORS.white} />}
                  {step.status === "current" && <View style={styles.currentDot} />}
                </View>
                <View style={styles.progressContent}>
                  <Text style={[styles.progressLabel, step.status === "current" && styles.progressLabelCurrent]}>
                    {step.label}
                  </Text>
                  {step.status === "current" && (
                    <Text style={styles.progressTime}>In progress...</Text>
                  )}
                  {step.status === "completed" && order.date_accepted && step.key === "confirmed" && (
                    <Text style={styles.progressTime}>
                      {new Date(order.date_accepted).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <MaterialIcons name={getStepIcon(step.status) as any} size={20} color={getStepColor(step.status)} />
              </View>
              {index < progressSteps.length - 1 && (
                <View style={[styles.progressLine, { backgroundColor: step.status === "completed" ? getStepColor(step.status) : COLORS.lightGray }]} />
              )}
            </View>
          ))}
        </View>

        {/* Delivery Info Card */}
        <View style={styles.deliveryCard}>
          <Text style={styles.deliveryTitle}>Delivery Information</Text>
          {tracking?.estimated_duration_minutes != null && (
            <View style={styles.deliveryTimeRow}>
              <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
              <Text style={styles.deliveryTimeText}>
                Estimated delivery in {tracking.estimated_duration_minutes} minutes
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryDetail}>
              <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
              <View style={styles.deliveryDetailContent}>
                <Text style={styles.deliveryLabel}>Delivery Location</Text>
                <Text style={styles.deliveryValue}>{order.delivery_address_text || "Address not specified"}</Text>
              </View>
            </View>
            {tracking?.distance_km != null && (
              <View style={styles.deliveryDetail}>
                <MaterialIcons name="directions-car" size={20} color={COLORS.primary} />
                <View style={styles.deliveryDetailContent}>
                  <Text style={styles.deliveryLabel}>Distance</Text>
                  <Text style={styles.deliveryValue}>{tracking.distance_km} km away</Text>
                </View>
              </View>
            )}
            {order.restaurant_name && (
              <View style={styles.deliveryDetail}>
                <MaterialIcons name="store" size={20} color={COLORS.primary} />
                <View style={styles.deliveryDetailContent}>
                  <Text style={styles.deliveryLabel}>Restaurant</Text>
                  <Text style={styles.deliveryValue}>{order.restaurant_name}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Driver Card - Show when driver is assigned */}
        {tracking?.livreur && (
          <View style={styles.driverCard}>
            <Text style={styles.driverTitle}>Your Delivery Driver</Text>
            <View style={styles.driverContent}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitials}>
                  {tracking.livreur.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{tracking.livreur}</Text>
              </View>
              {tracking.livreur_phone && (
                <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                  <MaterialIcons name="call" size={24} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Order Items Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>Order Items</Text>
          {items.length > 0 ? (
            items.map((item: OrderItemType, idx: number) => (
              <View key={item.id || idx} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.itemName}>{item.produit?.name || item.product?.name || `Product ${idx + 1}`}</Text>
                  <Text style={styles.itemQtyPrice}>
                    x{item.quantity} • {parseFloat(String(item.line_total || 0)).toFixed(2)} FCFA
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items available</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.orderTotal}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{parseFloat(String(order.total_amount || 0)).toFixed(2)} FCFA</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Payment Information</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Mode</Text>
            <Text style={styles.paymentValue}>
              {order.payment_mode === 'ESPECES' ? 'Cash' : order.payment_mode === 'CARTE' ? 'Card' : 'Mobile Money'}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <View style={[styles.paymentStatusBadge, { backgroundColor: order.payment_status === 'PAYE' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
              <Text style={[styles.paymentStatusText, { color: order.payment_status === 'PAYE' ? COLORS.success : COLORS.warning }]}>
                {order.payment_status === 'PAYE' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700" as const,
    color: COLORS.dark,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.danger,
    textAlign: 'center',
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
    fontWeight: "600" as const,
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.dark,
  },
  statusTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  progressCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  progressContent: {
    flex: 1,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.gray,
  },
  progressLabelCurrent: {
    color: COLORS.dark,
  },
  progressTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  progressLine: {
    width: 2,
    height: 24,
    marginLeft: 11,
  },
  deliveryCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  deliveryTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.dark,
    marginBottom: 12,
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deliveryTimeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
  deliveryInfo: {
    gap: 12,
  },
  deliveryDetail: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  deliveryDetailContent: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginBottom: 2,
  },
  deliveryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.dark,
  },
  driverCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  driverTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.dark,
    marginBottom: 12,
  },
  driverContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  driverInitials: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.dark,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  orderCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  orderTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.dark,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderItemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.dark,
  },
  itemQtyPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  noItemsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 12,
  },
  orderTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.primary,
  },
  paymentCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  paymentTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700" as const,
    color: COLORS.dark,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  paymentValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.dark,
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as const,
  },
})
