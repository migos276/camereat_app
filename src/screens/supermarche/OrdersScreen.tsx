"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Badge, EmptyState } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface Order {
  id: string
  customerName: string
  itemCount: number
  total: number
  status: "new" | "accepted" | "ready" | "pickup"
  orderTime: string
}

export const SupermarcheOrdersScreen: React.FC<any> = ({ navigation }) => {
  const orders: Order[] = [
    { id: "1", customerName: "Sarah Johnson", itemCount: 8, total: 52.5, status: "new", orderTime: "5 min ago" },
    { id: "2", customerName: "Mike Davis", itemCount: 5, total: 38.0, status: "accepted", orderTime: "12 min ago" },
    { id: "3", customerName: "Lisa Brown", itemCount: 3, total: 22.5, status: "ready", orderTime: "18 min ago" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return COLORS.ERROR
      case "accepted":
        return COLORS.WARNING
      case "ready":
        return COLORS.SUCCESS
      case "pickup":
        return COLORS.SUPERMARCHE_PRIMARY
      default:
        return COLORS.TEXT_SECONDARY
    }
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => navigation.navigate("SupermarketOrderDetail", { id: item.id })}>
      <Card style={[styles.orderCard, { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 }]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{item.id}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          <Badge
            text={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            variant={item.status === "ready" ? "success" : item.status === "accepted" ? "warning" : "error"}
          />
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="shopping-bag" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.detailText}>{item.itemCount} items</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.detailText}>{item.orderTime}</Text>
          </View>
          <Text style={styles.price}>${item.total.toFixed(2)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Header
        title="Orders"
        subtitle="Manage incoming orders"
        userType="supermarche"
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="shopping-bag"
            title="No Orders"
            description="Orders will appear here when customers place them"
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  price: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.SUPERMARCHE_PRIMARY,
  },
})
