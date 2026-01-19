"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Switch, Alert, Image } from "react-native"
import { useEffect, useCallback } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "../../redux/store"
import { fetchProducts, updateProduct } from "../../redux/slices/productSlice"
import { Header, Card, Button } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/config"
import type { Product } from "../../types"
import { formatPrice } from "../../utils/priceFormatter"
import { getFullImageUrl } from "../../utils/imageUtils"

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

  // Helper function to get full image URL using the centralized utility
  const getImageUrl = (path: string | undefined | null): string | null => {
    return getFullImageUrl(path)
  }

  const renderMenuItem = ({ item }: { item: Product }) => {
    const imageUrl = getImageUrl(item.image)
    
    return (
      <Card style={styles.menuItemCard}>
        <View style={styles.menuItemContent}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="restaurant" size={32} color={COLORS.gray} />
              </View>
            )}
          </View>

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.menuItemHeader}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.menuItemCategory}>
                  {typeof item.category === 'string' ? item.category : item.category?.name || "No category"}
                </Text>
                {item.description && (
                  <Text style={styles.menuItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Text style={styles.menuItemPrice}>${formatPrice(item.price)}</Text>
            </View>

            <View style={styles.menuItemFooter}>
              <View style={styles.availabilityStatus}>
                <View style={[styles.statusDot, { backgroundColor: item.available ? COLORS.success : COLORS.danger }]} />
                <Text style={styles.availabilityText}>
                  {item.available ? "Available" : "Unavailable"}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("EditProduct", { productId: item.id })}
                >
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
          </View>
        </View>
      </Card>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title="Menu"
        subtitle="Manage your products"
        userType="restaurant"
        onBackPress={() => navigation.goBack()}
      />

      {isLoading && products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="restaurant-menu" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="restaurant-menu" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>No products yet</Text>
          <Text style={styles.emptySubtext}>Add your first product to get started</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    padding: 0,
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.light,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
  },
  detailsContainer: {
    flex: 1,
    padding: 12,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 8,
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
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginTop: 4,
    lineHeight: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
})