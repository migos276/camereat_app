"use client"

import React, { useEffect, useState, useCallback } from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { restaurantService } from "../../services/restaurant-service"
import type { RestaurantDashboardStats, RestaurantOrder } from "../../types"

type Props = NativeStackScreenProps<RestaurantStackParamList, "RestaurantHome">

const RestaurantHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [stats, setStats] = useState<RestaurantDashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)
      const [statsData, ordersData] = await Promise.all([
        restaurantService.getDashboardStats(),
        restaurantService.getRecentOrders(),
      ])
      setStats(statsData)
      setRecentOrders(ordersData)
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err)
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }, [fetchDashboardData])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
      case "pending":
        return COLORS.warning
      case "ACCEPTEE":
      case "preparing":
        return COLORS.primary
      case "EN_PREPARATION":
        return COLORS.secondary
      case "PRETE":
      case "ready":
        return COLORS.success
      case "LIVREE":
        return "#10B981"
      case "ANNULEE":
      case "REFUSEE":
        return "#EF4444"
      default:
        return COLORS.gray
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      EN_ATTENTE: "En attente",
      ACCEPTEE: "Acceptée",
      EN_PREPARATION: "En préparation",
      PRETE: "Prête",
      LIVREE: "Livrée",
      ANNULEE: "Annulée",
    }
    return statusMap[status] || status
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Restaurant Dashboard</Text>
          <Text style={styles.headerSubtitle}>Loading...</Text>
        </View>
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      </View>
    )
  }

  if (error && !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Restaurant Dashboard</Text>
          <Text style={styles.headerSubtitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const displayStats = stats || {
    today_orders: 0,
    pending_orders: 0,
    revenue: 0,
    avg_preparation_time: 0,
    restaurant_name: "Restaurant",
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{displayStats.restaurant_name || "Restaurant Dashboard"}</Text>
        <Text style={styles.headerSubtitle}>Manage your orders</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="shopping-cart" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{displayStats.today_orders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="pending-actions" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{displayStats.pending_orders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>${displayStats.revenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="timer" size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{displayStats.avg_preparation_time}m</Text>
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

          {recentOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No recent orders</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate("OrderDetail", { id: order.id })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Order #{order.numero}</Text>
                  <Text style={styles.orderTime}>{formatTimeAgo(order.date_created)}</Text>
                </View>
                <View style={styles.orderCustomer}>
                  <Text style={styles.customerName}>
                    {order.client_name || `Client #${order.id.slice(-4)}`}
                  </Text>
                  <Text style={styles.itemsCount}>
                    ${order.total_amount.toFixed(2)}
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("MenuStack" as any)}
          >
            <MaterialIcons name="restaurant-menu" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Manage Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("OrdersStack" as any)}
          >
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
  content: { padding: SPACING.md, paddingBottom: SPACING["2xl"] },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  loadingText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.gray },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  errorText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.danger, textAlign: "center" },
  retryButton: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: SPACING.sm },
  retryButtonText: { color: COLORS.white, fontWeight: "600" as any },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { width: "48%", backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, alignItems: "center", shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.dark, marginTop: SPACING.sm },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, marginTop: SPACING.xs, textAlign: "center" },
  section: { marginBottom: SPACING.md },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "600" as any, color: COLORS.dark },
  viewAll: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontWeight: "500" as any },
  emptyContainer: { alignItems: "center", paddingVertical: SPACING.xl },
  emptyText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.gray },
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

