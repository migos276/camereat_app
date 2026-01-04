"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, ScrollView, StyleSheet, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, ImageStyle } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, Badge } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getRestaurant, getRestaurantMenu, clearCurrentRestaurant } from "../../redux/slices/restaurantSlice"
import { addToCart } from "../../redux/slices/cartSlice"
import type { Product, Category } from "../../types"

const RestaurantDetailScreen: React.FC<any> = ({ navigation, route }) => {
  const { id } = route.params
  const dispatch = useAppDispatch()
  const { currentRestaurant, menu, isLoading } = useAppSelector((state) => state.restaurant)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    dispatch(getRestaurant(id))
    dispatch(getRestaurantMenu(id))

    return () => {
      dispatch(clearCurrentRestaurant())
    }
  }, [dispatch, id])

  const getCategoryName = (category: string | Category | undefined): string => {
    if (!category) return "Other"
    return typeof category === "string" ? category : category.name || "Other"
  }

  const categories = ["all", ...new Set(menu.map((item) => getCategoryName(item.category)))]

  const filteredItems =
    selectedCategory === "all" ? menu : menu.filter((i) => getCategoryName(i.category) === selectedCategory)

  const handleAddToCart = (item: Product) => {
    dispatch(
      addToCart({
        product: item,
        quantity: 1,
        sourceId: id,
        sourceType: "restaurant",
      }),
    )
  }

  if (isLoading && !currentRestaurant) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  const renderMenuItem = ({ item }: { item: Product }) => (
    <Card style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        {item.image && <Image source={{ uri: item.image }} style={styles.menuItemImage as ImageStyle} />}
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDesc}>{item.description}</Text>
          <Text style={styles.menuItemPrice}>{item.price} €</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
          <MaterialIcons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Header title={currentRestaurant?.commercial_name || "Restaurant"} onBackPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          {currentRestaurant?.cover_image ? (
            <Image source={{ uri: currentRestaurant.cover_image }} style={styles.bannerImage as ImageStyle} />
          ) : currentRestaurant?.logo ? (
            <Image source={{ uri: currentRestaurant.logo }} style={styles.bannerImage as ImageStyle} />
          ) : (
            <Text style={styles.bannerPlaceholder}>Restaurant Banner</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View>
              <Text style={styles.restaurantTitle}>{currentRestaurant?.commercial_name}</Text>
              <View style={styles.infoRow}>
                <Badge text={String(currentRestaurant?.average_rating ?? "N/A")} variant="primary" />
                <Text style={styles.infoText}>{currentRestaurant?.cuisine_type}</Text>
                <Text style={styles.infoText}>🕐 {currentRestaurant?.avg_preparation_time || 25}-{(currentRestaurant?.avg_preparation_time || 25) + 10} min</Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>{currentRestaurant?.description || "No description available."}</Text>
          
          {currentRestaurant?.full_address && (
            <Text style={styles.address}>
              📍 {currentRestaurant.full_address}
            </Text>
          )}
        </View>

        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === item && { backgroundColor: COLORS.primary }]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryText, selectedCategory === item && { color: COLORS.white }]}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          />
        </View>

        <View style={styles.menuSection}>
          {filteredItems.length > 0 ? (
            <FlatList
              data={filteredItems}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No items available in this category.</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="View Cart" onPress={() => navigation.navigate("Cart")} color={COLORS.primary} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerContainer: {
    backgroundColor: COLORS.lightGray,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    overflow: "hidden" as const,
  },
  bannerPlaceholder: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  infoSection: {
    padding: SPACING.lg,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  restaurantTitle: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  address: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  categoriesSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  categoriesContent: {
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.dark,
  },
  menuSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  menuItem: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    overflow: "hidden" as const,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  menuItemPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    color: COLORS.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.gray,
    marginTop: SPACING.xl,
  },
})

export default RestaurantDetailScreen

