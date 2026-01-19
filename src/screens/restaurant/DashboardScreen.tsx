"use client"

import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Badge } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/config"
import { restaurantService } from "../../services/restaurant-service"
import type { Restaurant, RestaurantDashboardStats, RestaurantOrder } from "../../types"
import { useAppSelector } from "../../hooks"

export const RestaurantDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAppSelector((state) => state.auth)
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [stats, setStats] = useState<RestaurantDashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RestaurantOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setError(null)
      
      // Load restaurant profile
      try {
        const restaurantData = await restaurantService.getMyRestaurant()
        setRestaurant(restaurantData)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Profil restaurant non trouvé. Veuillez compléter votre inscription.")
        } else {
          throw err
        }
      }

      // Load dashboard stats
      try {
        const statsData = await restaurantService.getDashboardStats()
        setStats(statsData)
      } catch (err) {
        console.error("Error loading stats:", err)
        setStats({
          today_orders: 0,
          pending_orders: 0,
          revenue: 0,
          avg_preparation_time: 30,
          restaurant_name: "",
        })
      }

      // Load recent orders
      try {
        const ordersData = await restaurantService.getRecentOrders()
        setRecentOrders(ordersData)
      } catch (err) {
        console.error("Error loading orders:", err)
        setRecentOrders([])
      }
    } catch (err: any) {
      console.error("Error loading dashboard data:", err)
      setError(err.response?.data?.message || "Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleToggleStatus = () => {
    if (!restaurant) return
    const newStatus = !restaurant.is_open
    setRestaurant((prev) => prev ? { ...prev, is_open: newStatus } : null)
  }

  const pendingOrdersCount = stats?.pending_orders || 0
  const todayOrdersCount = stats?.today_orders || 0
  const todayRevenue = stats?.revenue || 0
  const rating = restaurant?.average_rating || 0
  const restaurantName = stats?.restaurant_name || restaurant?.commercial_name || "Mon Restaurant"

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Dashboard" subtitle="Chargement..." userType="restaurant" rightIcon="notifications" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.RESTAURANT_PRIMARY} />
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </View>
    )
  }

  if (error && !restaurant) {
    return (
      <View style={styles.container}>
        <Header title="Dashboard" subtitle="Erreur" userType="restaurant" rightIcon="notifications" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Dashboard" 
        subtitle={restaurantName} 
        userType="restaurant" 
        rightIcon="notifications" 
      />

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.RESTAURANT_PRIMARY]} />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="warning" size={20} color={COLORS.WARNING} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View>
              <Text style={styles.statusLabel}>Statut du Restaurant</Text>
              <Badge 
                text={restaurant?.is_open ? "Ouvert" : "Fermé"} 
                variant={restaurant?.is_open ? "success" : "error"} 
              />
            </View>
            <TouchableOpacity 
              style={styles.statusToggle} 
              onPress={handleToggleStatus}
              disabled={!restaurant}
            >
              <MaterialIcons 
                name={restaurant?.is_open ? "toggle-on" : "toggle-off"} 
                size={40} 
                color={restaurant?.is_open ? COLORS.RESTAURANT_PRIMARY : COLORS.gray} 
              />
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <MaterialIcons name="shopping-cart" size={28} color={COLORS.RESTAURANT_PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>{pendingOrdersCount}</Text>
            <Text style={styles.statLabel}>Commandes en attente</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="check-circle" size={28} color={COLORS.SUCCESS} style={styles.statIcon} />
            <Text style={styles.statValue}>{todayOrdersCount}</Text>
            <Text style={styles.statLabel}>Commandes aujourd'hui</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="attach-money" size={28} color={COLORS.RESTAURANT_PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>{todayRevenue.toLocaleString()} CFA</Text>
            <Text style={styles.statLabel}>Revenus aujourd'hui</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="star" size={28} color={COLORS.WARNING} style={styles.statIcon} />
            <Text style={styles.statValue}>{typeof rating === 'number' ? rating.toFixed(1) : rating}</Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </Card>
        </View>

        {pendingOrdersCount > 0 && (
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.jumpTo("OrdersStack")}>
            <MaterialIcons name="shopping-cart" size={24} color={COLORS.WHITE} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Voir les commandes en attente</Text>
            <Badge text={String(pendingOrdersCount)} variant="error" />
          </TouchableOpacity>
        )}

        {recentOrders.length > 0 && (
          <Card style={styles.recentOrdersCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Commandes récentes</Text>
              <TouchableOpacity onPress={() => navigation.jumpTo("OrdersStack")}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.slice(0, 3).map((order, index) => (
              <View key={order.id || index} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Commande #{order.id?.slice(-6) || order.id}</Text>
                  <Text style={styles.orderTime}>
                    {order.date_created ? new Date(order.date_created).toLocaleTimeString() : ''}
                  </Text>
                </View>
                <View style={styles.orderStatus}>
                  <Text style={styles.orderTotal}>{order.total_amount?.toLocaleString()} CFA</Text>
                  <Badge 
                    text={order.status === 'completed' ? 'Terminé' : order.status === 'cancelled' ? 'Annulé' : 'En attente'} 
                    variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'} 
                  />
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Actions rapides</Text>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("MenuStack" as any)}>
            <MaterialIcons name="restaurant-menu" size={20} color={COLORS.RESTAURANT_PRIMARY} />
            <Text style={styles.quickActionText}>Gérer le menu</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("OrdersStack" as any)}>
            <MaterialIcons name="receipt-long" size={20} color={COLORS.RESTAURANT_PRIMARY} />
            <Text style={styles.quickActionText}>Voir toutes les commandes</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("Statistics" as any)}>
            <MaterialIcons name="analytics" size={20} color={COLORS.RESTAURANT_PRIMARY} />
            <Text style={styles.quickActionText}>Voir les statistiques</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("RestaurantProfile" as any)}>
            <MaterialIcons name="store" size={20} color={COLORS.RESTAURANT_PRIMARY} />
            <Text style={styles.quickActionText}>Modifier le profil</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
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
  },
  loadingText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.danger,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.RESTAURANT_PRIMARY,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
    marginTop: SPACING.md,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.WARNING,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING["2xl"],
  },
  statusCard: {
    marginBottom: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  statusToggle: {
    marginLeft: SPACING.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  statIcon: {
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.RESTAURANT_PRIMARY,
    borderRadius: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  buttonIcon: {
    flex: 0,
  },
  buttonText: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.WHITE,
    fontWeight: "700",
    flex: 1,
  },
  recentOrdersCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  seeAllText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.RESTAURANT_PRIMARY,
    fontWeight: "600",
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  orderTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  orderStatus: {
    alignItems: "flex-end",
  },
  orderTotal: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 4,
  },
  quickActionsCard: {
    marginBottom: SPACING.md,
  },
  quickActionsTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  quickActionText: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    flex: 1,
  },
})

