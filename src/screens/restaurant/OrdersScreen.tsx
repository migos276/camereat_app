"use client"

import type React from "react"
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { Header, Card, Badge } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { restaurantService } from "../../services/restaurant-service"
import type { RestaurantOrder } from "../../types"

const mapStatus = (status: string) => {
  switch (status) {
    case 'EN_ATTENTE':
      return 'waiting'
    case 'EN_PREPARATION':
      return 'preparing'
    case 'PRETE':
      return 'ready'
    case 'EN_LIVRAISON':
      return 'pickup'
    default:
      return 'waiting'
  }
}

const { width } = Dimensions.get("window")

const RestaurantOrdersScreen: React.FC<any> = ({ navigation }) => {
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await restaurantService.getOrders()
      setOrders(data)
    } catch (err) {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const ordersByStatus = {
    waiting: orders.filter(o => mapStatus(o.status) === 'waiting'),
    preparing: orders.filter(o => mapStatus(o.status) === 'preparing'),
    ready: orders.filter(o => mapStatus(o.status) === 'ready'),
    pickup: orders.filter(o => mapStatus(o.status) === 'pickup'),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return COLORS.danger
      case "preparing":
        return COLORS.warning
      case "ready":
        return COLORS.success
      case "pickup":
        return COLORS.primary
      default:
        return COLORS.gray
    }
  }

  const renderOrderCard = (order: RestaurantOrder, onPress: () => void) => {
    const status = mapStatus(order.status)
    return (
      <TouchableOpacity onPress={onPress} key={order.id}>
        <Card style={{ ...styles.orderCard, borderLeftColor: getStatusColor(status), borderLeftWidth: 4 }}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>Order #{order.numero}</Text>
              <Text style={styles.customerName}>{order.client_name}</Text>
            </View>
            <Badge
              text={status.charAt(0).toUpperCase() + status.slice(1)}
              variant={status === "ready" ? "success" : status === "preparing" ? "warning" : "error"}
            />
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="shopping-cart" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>{order.items_count || 0} items</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>{new Date(order.date_created).toLocaleString()}</Text>
            </View>
            <Text style={styles.price}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  const cardWidth = width - 32
  const scrollViewWidth = cardWidth + 16

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Orders" subtitle="Manage incoming orders" userType="restaurant" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading orders...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Orders" subtitle="Manage incoming orders" userType="restaurant" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{error}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Orders" subtitle="Manage incoming orders" userType="restaurant" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {["waiting", "preparing", "ready", "pickup"].map((statusType) => (
          <View key={statusType} style={[styles.statusColumn, { width: cardWidth }]}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{statusType.charAt(0).toUpperCase() + statusType.slice(1)}</Text>
              <Badge text={ordersByStatus[statusType as keyof typeof ordersByStatus].length.toString()} />
            </View>

            {ordersByStatus[statusType as keyof typeof ordersByStatus].map((order) =>
              renderOrderCard(order, () => navigation.navigate("OrderDetail", { id: order.id })),
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  statusColumn: {
    paddingRight: 16,
    paddingVertical: 16,
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  columnTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginBottom: 2,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "700",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    color: COLORS.primary,
  },
})

export default RestaurantOrdersScreen
