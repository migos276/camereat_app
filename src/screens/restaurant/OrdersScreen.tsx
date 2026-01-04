"use client"

import type React from "react"
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Badge } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface Order {
  id: string
  customerName: string
  itemCount: number
  total: number
  status: "waiting" | "preparing" | "ready" | "pickup"
  orderTime: string
}

const ORDERS_BY_STATUS = {
  waiting: [
    {
      id: "1",
      customerName: "Alice Johnson",
      itemCount: 3,
      total: 42.5,
      status: "waiting" as const,
      orderTime: "2 min ago",
    },
    {
      id: "2",
      customerName: "Bob Smith",
      itemCount: 2,
      total: 28.0,
      status: "waiting" as const,
      orderTime: "5 min ago",
    },
  ],
  preparing: [
    {
      id: "3",
      customerName: "Carol White",
      itemCount: 4,
      total: 56.5,
      status: "preparing" as const,
      orderTime: "8 min ago",
    },
    {
      id: "4",
      customerName: "David Brown",
      itemCount: 1,
      total: 15.99,
      status: "preparing" as const,
      orderTime: "12 min ago",
    },
  ],
  ready: [
    { id: "5", customerName: "Eve Davis", itemCount: 2, total: 35.0, status: "ready" as const, orderTime: "3 min ago" },
  ],
  pickup: [
    {
      id: "6",
      customerName: "Frank Miller",
      itemCount: 5,
      total: 78.5,
      status: "pickup" as const,
      orderTime: "1 min ago",
    },
  ],
}

const { width } = Dimensions.get("window")

const RestaurantOrdersScreen: React.FC<any> = ({ navigation }) => {
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

  const renderOrderCard = (order: Order, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} key={order.id}>
      <Card style={{ ...styles.orderCard, borderLeftColor: getStatusColor(order.status), borderLeftWidth: 4 }}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{order.id}</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
          </View>
          <Badge
            text={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            variant={order.status === "ready" ? "success" : order.status === "preparing" ? "warning" : "error"}
          />
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="shopping-cart" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{order.itemCount} items</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{order.orderTime}</Text>
          </View>
          <Text style={styles.price}>${order.total.toFixed(2)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  )

  const cardWidth = width - 32
  const scrollViewWidth = cardWidth + 16

  return (
    <View style={styles.container}>
      <Header title="Orders" subtitle="Manage incoming orders" userType="restaurant" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {["waiting", "preparing", "ready", "pickup"].map((statusType) => (
          <View key={statusType} style={[styles.statusColumn, { width: cardWidth }]}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{statusType.charAt(0).toUpperCase() + statusType.slice(1)}</Text>
              <Badge text={ORDERS_BY_STATUS[statusType as keyof typeof ORDERS_BY_STATUS].length.toString()} />
            </View>

            {ORDERS_BY_STATUS[statusType as keyof typeof ORDERS_BY_STATUS].map((order) =>
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
