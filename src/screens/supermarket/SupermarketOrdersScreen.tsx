"use client"

import React from "react"
import { useState } from "react"
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { listOrders } from "../../redux/slices/orderSlice"
import type { SupermarchéStackParamList } from "../../navigation/SupermarchéNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import type { Order } from "../../types"

type Props = NativeStackScreenProps<SupermarchéStackParamList, "SupermarketOrders">

// Mock data pour les commandes de supermarket
const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-SUP-001",
    user: {
      id: "user-1",
      email: "alice@example.com",
      phone_number: "+1234567890",
      first_name: "Alice",
      last_name: "Johnson",
      user_type: "client",
      is_approved: true,
      is_verified: true,
      date_joined: "2024-01-15",
    },
    items: [
      {
        id: "item-1",
        product: {
          id: "prod-1",
          name: "Organic Apples",
          price: 5.99,
          category: "Fruits",
          in_stock: true,
          supermarket_id: "sup-1",
        },
        quantity: 3,
        price: 17.97,
      },
      {
        id: "item-2",
        product: {
          id: "prod-2",
          name: "Whole Milk",
          price: 3.49,
          category: "Dairy",
          in_stock: true,
          supermarket_id: "sup-1",
        },
        quantity: 2,
        price: 6.98,
      },
    ],
    supermarket_id: "sup-1",
    delivery_address: {
      id: "addr-1",
      user_id: "user-1",
      address_line: "123 Main St",
      city: "City",
      province: "State",
      postal_code: "12345",
      latitude: 0,
      longitude: 0,
      is_primary: true,
      created_at: "2024-01-15",
    },
    total_price: 156.75,
    delivery_fee: 5.99,
    status: "pending",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "ORD-SUP-002",
    user: {
      id: "user-2",
      email: "bob@example.com",
      phone_number: "+1234567891",
      first_name: "Bob",
      last_name: "Smith",
      user_type: "client",
      is_approved: true,
      is_verified: true,
      date_joined: "2024-01-16",
    },
    items: [
      {
        id: "item-3",
        product: {
          id: "prod-3",
          name: "Fresh Bread",
          price: 4.50,
          category: "Bakery",
          in_stock: true,
          supermarket_id: "sup-1",
        },
        quantity: 1,
        price: 4.50,
      },
    ],
    supermarket_id: "sup-1",
    delivery_address: {
      id: "addr-2",
      user_id: "user-2",
      address_line: "456 Oak Ave",
      city: "City",
      province: "State",
      postal_code: "12346",
      latitude: 0,
      longitude: 0,
      is_primary: true,
      created_at: "2024-01-16",
    },
    total_price: 89.50,
    delivery_fee: 5.99,
    status: "confirmed",
    created_at: "2024-01-16T11:00:00Z",
    updated_at: "2024-01-16T11:00:00Z",
  },
  {
    id: "ORD-SUP-003",
    user: {
      id: "user-3",
      email: "carol@example.com",
      phone_number: "+1234567892",
      first_name: "Carol",
      last_name: "White",
      user_type: "client",
      is_approved: true,
      is_verified: true,
      date_joined: "2024-01-17",
    },
    items: [
      {
        id: "item-4",
        product: {
          id: "prod-4",
          name: "Chicken Breast",
          price: 12.99,
          category: "Meat",
          in_stock: true,
          supermarket_id: "sup-1",
        },
        quantity: 2,
        price: 25.98,
      },
      {
        id: "item-5",
        product: {
          id: "prod-5",
          name: "Rice Bags",
          price: 15.99,
          category: "Grains",
          in_stock: true,
          supermarket_id: "sup-1",
        },
        quantity: 1,
        price: 15.99,
      },
    ],
    supermarket_id: "sup-1",
    delivery_address: {
      id: "addr-3",
      user_id: "user-3",
      address_line: "789 Pine St",
      city: "City",
      province: "State",
      postal_code: "12347",
      latitude: 0,
      longitude: 0,
      is_primary: true,
      created_at: "2024-01-17",
    },
    total_price: 203.25,
    delivery_fee: 5.99,
    status: "preparing",
    created_at: "2024-01-17T12:00:00Z",
    updated_at: "2024-01-17T12:00:00Z",
  },
  {
    id: "ORD-SUP-004",
    user: {
      id: "user-4",
      email: "david@example.com",
      phone_number: "+1234567893",
      first_name: "David",
      last_name: "Brown",
      user_type: "client",
      is_approved: true,
      is_verified: true,
      date_joined: "2024-01-17",
    },
    items: [
      {
        id: "item-6",
        product: {
          id: "prod-6",
          name: "Vegetable Mix",
          price: 8.99,
          category: "Vegetables",
          in_stock: true,
          supermarket_id: "sup-1",
        },
        quantity: 1,
        price: 8.99,
      },
    ],
    supermarket_id: "sup-1",
    delivery_address: {
      id: "addr-4",
      user_id: "user-4",
      address_line: "321 Elm St",
      city: "City",
      province: "State",
      postal_code: "12348",
      latitude: 0,
      longitude: 0,
      is_primary: true,
      created_at: "2024-01-17",
    },
    total_price: 67.99,
    delivery_fee: 5.99,
    status: "ready",
    created_at: "2024-01-17T13:00:00Z",
    updated_at: "2024-01-17T13:00:00Z",
  },
]

const SupermarketOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { orders, isLoading } = useAppSelector((state) => state.order)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  const orderList = MOCK_ORDERS

  const filteredOrders = selectedFilter === "all" 
    ? orderList 
    : orderList.filter((order: Order) => order.status === selectedFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.warning
      case "confirmed":
        return COLORS.primary
      case "preparing":
        return COLORS.secondary
      case "ready":
        return COLORS.success
      case "delivered":
        return COLORS.gray
      case "cancelled":
        return COLORS.danger
      default:
        return COLORS.gray
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getCustomerName = (order: Order) => {
    return `${order.user.first_name} ${order.user.last_name}`
  }

  const getItemCount = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate("SupermarketOrderDetail", { id: item.id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={styles.customerName}>{getCustomerName(item)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.detailValue}>{getItemCount(item)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.totalValue}>${item.total_price.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => navigation.navigate("SupermarketOrderDetail", { id: item.id })}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
        
        {item.status === "ready" && (
          <TouchableOpacity
            style={styles.markDeliveredButton}
            onPress={() => console.log("Mark as delivered")}
          >
            <Text style={styles.markDeliveredText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )

  const filters = ["all", "pending", "confirmed", "preparing", "ready", "delivered"]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Supermarket Orders</Text>
        <Text style={styles.headerSubtitle}>{orderList.length} orders</Text>
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

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate("SupermarketHome")}
              >
                <Text style={styles.browseButtonText}>Back to Dashboard</Text>
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
    backgroundColor: "#F7F7F7",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F1F1F",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#999999",
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
  },
  filterButtonActive: {
    backgroundColor: "#FF6B35",
  },
  filterText: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#1F1F1F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F1F1F",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  detailRow: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F1F1F",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF6B35",
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
  },
  markDeliveredButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#06A77D",
    borderRadius: 8,
  },
  markDeliveredText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 18,
    color: "#999999",
    marginBottom: 16,
  },
  browseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})

export default SupermarketOrdersScreen

