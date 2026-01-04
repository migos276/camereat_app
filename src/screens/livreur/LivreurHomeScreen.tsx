"use client"

import React, { useEffect } from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native"
import { MaterialIcons } from "@expo/vector-icons"
import type { LivreurStackParamList } from "../../navigation/LivreurNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getLivreurProfile, getStatistics, setOnlineStatus } from "../../redux/slices/livreurSlice"

type Props = {
  navigation: CompositeNavigationProp<any, any>
}

const LivreurHomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { profile, statistics, isOnline, isLoading } = useAppSelector((state) => state.livreur)

  useEffect(() => {
    dispatch(getLivreurProfile())
    dispatch(getStatistics())
  }, [dispatch])

  const toggleOnlineStatus = () => {
    dispatch(setOnlineStatus(!isOnline))
  }

  const quickStats = [
    { id: "1", icon: "shopping-cart", value: statistics?.deliveries_today || "0", label: "Deliveries Today" },
    { id: "2", icon: "attach-money", value: `$${statistics?.earnings_today || "0.00"}`, label: "Earned Today" },
    { id: "3", icon: "star", value: profile?.average_rating?.toFixed(1) || "N/A", label: "Your Rating" },
    { id: "4", icon: "timer", value: "N/A", label: "Minutes AVG" },
  ]

  if (isLoading && !profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Welcome back{profile?.user?.first_name ? `, ${profile.user.first_name}` : ""}!</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.gray }]} />
            <Text style={styles.statusText}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Ready to deliver</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.statusCard} onPress={toggleOnlineStatus}>
          <View style={styles.statusContent}>
            <View>
              <Text style={styles.statusLabel}>Your Status</Text>
              <View style={styles.statusBadgeLarge}>
                <View style={[styles.statusIndicator, { backgroundColor: isOnline ? COLORS.success : COLORS.gray }]} />
                <Text style={styles.statusTextLarge}>{isOnline ? "Online" : "Offline"}</Text>
              </View>
            </View>
            <MaterialIcons
              name={isOnline ? "toggle-on" : "toggle-off"}
              size={48}
              color={isOnline ? COLORS.success : COLORS.gray}
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          {quickStats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <MaterialIcons name={stat.icon as any} size={28} color={COLORS.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.jumpTo("DeliveriesStack")}>
            <MaterialIcons name="local-shipping" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Available Orders</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.jumpTo("EarningsStack")}>
            <MaterialIcons name="trending-up" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>View Earnings</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("ActiveDelivery", { id: "active-1" })}>
            <MaterialIcons name="delivery-dining" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Active Delivery</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {statistics?.recent_deliveries && statistics.recent_deliveries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Deliveries</Text>
            <View style={styles.recentDeliveries}>
              {statistics.recent_deliveries.slice(0, 3).map((delivery: any) => (
                <View key={delivery.id} style={styles.deliveryItem}>
                  <View style={styles.deliveryIcon}>
                    <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryOrderId}>{delivery.order_id}</Text>
                    <Text style={styles.deliveryRestaurant}>{delivery.restaurant_name}</Text>
                  </View>
                  <Text style={styles.deliveryAmount}>${delivery.amount?.toFixed(2) || "0.00"}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, paddingTop: SPACING["2xl"] },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  headerSubtitle: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  statusBadge: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white + "20", paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.xs },
  statusText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.white, fontWeight: "medium" as any },
  content: { padding: SPACING.md },
  statusCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statusContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, marginBottom: SPACING.xs },
  statusBadgeLarge: { flexDirection: "row", alignItems: "center" },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.xs },
  statusTextLarge: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "600" as any, color: COLORS.dark },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "600" as any, color: COLORS.dark, marginBottom: SPACING.md, marginTop: SPACING.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { width: "48%", backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, alignItems: "center", shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.dark, marginTop: SPACING.sm },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, marginTop: SPACING.xs },
  quickActions: { gap: SPACING.sm, marginBottom: SPACING.md },
  actionButton: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: SPACING.sm, padding: SPACING.md, gap: SPACING.sm },
  actionButtonText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },
  recentDeliveries: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md, gap: SPACING.sm },
  deliveryItem: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  deliveryIcon: { marginRight: SPACING.sm },
  deliveryInfo: { flex: 1 },
  deliveryOrderId: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.dark },
  deliveryRestaurant: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  deliveryAmount: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.success },
})

export default LivreurHomeScreen
