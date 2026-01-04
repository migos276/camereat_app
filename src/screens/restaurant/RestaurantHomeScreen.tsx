"use client"

import React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"

type Props = NativeStackScreenProps<RestaurantStackParamList, "RestaurantHome">

const RestaurantHomeScreen: React.FC<Props> = ({ navigation }) => {
  const stats = {
    todayOrders: 24,
    pendingOrders: 5,
    revenue: 856.50,
    avgPreparationTime: 18,
  }

  const recentOrders = [
    { id: "1", customer: "Alice Johnson", items: 3, total: 42.50, status: "pending", time: "2 min ago" },
    { id: "2", customer: "Bob Smith", items: 2, total: 28.00, status: "preparing", time: "5 min ago" },
    { id: "3", customer: "Carol White", items: 4, total: 56.50, status: "ready", time: "8 min ago" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return COLORS.warning
      case "preparing": return COLORS.primary
      case "ready": return COLORS.success
      default: return COLORS.gray
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your orders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
<MaterialIcons name="shopping-cart" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.todayOrders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="pending-actions" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>${stats.revenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="timer" size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{stats.avgPreparationTime}m</Text>
            <Text style={styles.statLabel}>Avg Prep Time</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate("OrdersStack" as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate("OrderDetail", { id: order.id })}
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <Text style={styles.orderTime}>{order.time}</Text>
              </View>
              <View style={styles.orderCustomer}>
                <Text style={styles.customerName}>{order.customer}</Text>
                <Text style={styles.itemsCount}>{order.items} items - ${order.total.toFixed(2)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("MenuStack" as any)}>
            <MaterialIcons name="restaurant-menu" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Manage Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("OrdersStack" as any)}>
            <MaterialIcons name="list-alt" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, paddingTop: SPACING["2xl"] },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  headerSubtitle: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  content: { padding: SPACING.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { width: "48%", backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, alignItems: "center", shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.dark, marginTop: SPACING.sm },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, marginTop: SPACING.xs },
  section: { marginBottom: SPACING.md },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "600" as any, color: COLORS.dark },
  viewAll: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontWeight: "500" as any },
  orderCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  orderInfo: { marginRight: SPACING.sm },
  orderId: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.gray },
  orderTime: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.gray },
  orderCustomer: { flex: 1 },
  customerName: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark },
  itemsCount: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.xs },
  statusText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" as any },
  quickActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, borderRadius: SPACING.sm, padding: SPACING.md, gap: SPACING.sm },
  actionButtonText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.white },
})

export default RestaurantHomeScreen
