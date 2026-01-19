"use client"

import React, { useCallback } from "react"
import { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { listOrders } from "../../redux/slices/orderSlice"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { ScrollView } from "react-native"

type Props = NativeStackScreenProps<ClientStackParamList, "Orders">

// Mapping from backend status to frontend status
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

// Get backend status from frontend filter
const getBackendStatus = (frontendStatus: string): string | undefined => {
  const reverseMapping: Record<string, string> = {
    pending: "EN_ATTENTE",
    confirmed: "ACCEPTEE",
    preparing: "EN_PREPARATION",
    ready: "PRETE",
    delivered: "LIVREE",
    cancelled: "ANNULEE",
  }
  return frontendStatus === "all" ? undefined : reverseMapping[frontendStatus]
}

const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { orders, isLoading, error } = useAppSelector((state) => state.order)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async () => {
    const backendStatus = getBackendStatus(selectedFilter)
    dispatch(listOrders({ page: 1, status: backendStatus }))
  }, [dispatch, selectedFilter])

  // Fetch orders when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [fetchOrders]),
  )

  // Refresh orders when filter changes
  useEffect(() => {
    fetchOrders()
  }, [selectedFilter])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [fetchOrders])

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
        return COLORS.error
      default:
        return COLORS.gray
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderOrderItem = ({ item }: { item: any }) => {
    const frontendStatus = getFrontendStatus(item.status)
    const itemsCount = item.items?.length || 0
    const formattedDate = item.date_created 
      ? new Date(item.date_created).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.numero || item.id}</Text>
            <Text style={styles.restaurantName}>{item.restaurant_name || 'Restaurant'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(frontendStatus) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(frontendStatus) }]}>
              {getStatusText(frontendStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items</Text>
            <Text style={styles.detailValue}>{itemsCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.totalValue}>{parseFloat(item.total_amount || 0).toFixed(2)} XOF</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
          
          {frontendStatus === "ready" && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => navigation.navigate("OrderTracking", { id: item.id })}
            >
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const filters = ["all", "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} orders</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => {
                  // Navigate to Home tab using parent navigator
                  const parent = navigation.getParent()
                  if (parent) {
                    parent.jumpTo("HomeStack")
                  } else {
                    // Fallback: navigate within current stack
                    navigation.navigate("Home")
                  }
                }}
              >
                <Text style={styles.browseButtonText}>Browse Restaurants</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: SPACING.md,
    backgroundColor: COLORS.background,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  orderId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginTop: SPACING.xs,
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
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailRow: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SPACING.sm,
  },
  viewDetailsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  trackButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.sm,
  },
  trackButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: SPACING["2xl"],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  browseButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.sm,
  },
  browseButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
})

export default OrdersScreen
