"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Badge, EmptyState } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { listOrders } from "../../redux/slices/orderSlice"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"

interface Order {
  id: string
  restaurant_name?: string
  date_created: string
  total_amount: number
  status: string
  itemCount: number
}

// Mapping from backend status to frontend status
const statusMapping: Record<string, string> = {
  EN_ATTENTE: "pending",
  ACCEPTEE: "pending",
  EN_PREPARATION: "pending",
  PRETE: "pending",
  LIVREUR_ASSIGNE: "pending",
  EN_ROUTE_COLLECTE: "pending",
  COLLECTEE: "pending",
  EN_LIVRAISON: "pending",
  LIVREE: "delivered",
  ANNULEE: "pending",
  REFUSEE: "pending",
}

export const OrderHistoryScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { orders, isLoading } = useAppSelector((state) => state.order)

  const fetchOrders = useCallback(() => {
    dispatch(listOrders({ page: 1 }))
  }, [dispatch])

  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [fetchOrders]),
  )

  const getFrontendStatus = (backendStatus: string): string => {
    return statusMapping[backendStatus] || "pending"
  }

  const renderOrder = ({ item }: { item: any }) => {
    const frontendStatus = getFrontendStatus(item.status)
    const formattedDate = item.date_created 
      ? new Date(item.date_created).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      : ''

    return (
      <TouchableOpacity onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}>
        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.restaurantName}>{item.restaurant_name || 'Restaurant'}</Text>
              <Text style={styles.orderDate}>{formattedDate}</Text>
            </View>
            <Badge
              text={frontendStatus === "delivered" ? "Delivered" : "Pending"}
              variant={frontendStatus === "delivered" ? "success" : "info"}
            />
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.itemInfo}>
              <MaterialIcons name="shopping-cart" size={16} color={COLORS.gray} />
              <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
            </View>
            <Text style={styles.totalPrice}>{parseFloat(item.total_amount || 0).toFixed(2)} XOF</Text>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Order History" onBackPress={() => navigation.goBack()} />

      {isLoading && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="history" title="No Orders Yet" description="Your past orders will appear here" />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  totalPrice: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    color: COLORS.primary,
  },
})
