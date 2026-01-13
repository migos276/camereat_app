"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Switch, Alert } from "react-native"
import { useEffect, useCallback } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "../../redux/store"
import { fetchProducts, updateProduct } from "../../redux/slices/productSlice"
import { Header, Card, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import type { Product } from "../../types"
import { formatPrice } from "../../utils/priceFormatter"

export const RestaurantMenuScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { products, isLoading, error } = useSelector((state: RootState) => state.products)

  const loadProducts = useCallback(() => {
    if (user?.restaurant_id) {
      dispatch(fetchProducts({ restaurant: user.restaurant_id }))
    }
  }, [dispatch, user?.restaurant_id])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Refresh products when returning from AddProduct screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts()
    })
    return unsubscribe
  }, [navigation, loadProducts])

  const toggleAvailability = async (product: Product) => {
    try {
      await dispatch(updateProduct({ id: product.id, data: { available: !product.available } }))
    } catch (error) {
      console.error("Failed to update product availability:", error)
    }
  }

  const renderMenuItem = ({ item }: { item: Product }) => (
    <Card style={styles.menuItemCard}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemCategory}>{typeof item.category === 'string' ? item.category : item.category?.name || "No category"}</Text>
        </View>
        <Text style={styles.menuItemPrice}>${formatPrice(item.price)}</Text>
      </View>

      <View style={styles.menuItemFooter}>
        <View style={styles.availabilityStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.available ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.availabilityText}>{item.available ? "Available" : "Unavailable"}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <Switch
            value={item.available}
            onValueChange={() => toggleAvailability(item)}
            trackColor={{ false: COLORS.gray, true: COLORS.success }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Header
        title="Menu"
        subtitle="Manage your products"
        userType="restaurant"
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={products}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title="Add New Product"
          color={COLORS.primary}
          onPress={() => navigation.navigate("AddProduct")}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  menuItemCard: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "700",
    marginBottom: 2,
    color: COLORS.dark,
  },
  menuItemCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  menuItemPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700",
    color: COLORS.primary,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  availabilityStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.dark,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
})
