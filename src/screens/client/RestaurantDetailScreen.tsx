"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  type ImageStyle,
  Alert,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, Badge } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import {
  getRestaurant,
  getRestaurantMenu,
  clearCurrentRestaurant,
} from "../../redux/slices/restaurantSlice"
import { addToCart } from "../../redux/slices/cartSlice"
import type { Product, Category } from "../../types"
import { getFullImageUrl } from "../../utils/imageUtils"

const RestaurantDetailScreen: React.FC<any> = ({ navigation, route }) => {
  const { id } = route.params
  const dispatch = useAppDispatch()

  const { currentRestaurant, menu, isLoading } = useAppSelector(
    (state) => state.restaurant
  )
  const { items: cartItems } = useAppSelector((state) => state.cart)

  const [selectedCategory, setSelectedCategory] = useState("all")
  const [addingItemId, setAddingItemId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(getRestaurant(id))
    dispatch(getRestaurantMenu(id))

    return () => {
      dispatch(clearCurrentRestaurant())
    }
  }, [dispatch, id])

  // Helper function to get full image URL
  const getImageUrl = (path: string | undefined | null): string | null => {
    return getFullImageUrl(path)
  }

  const getCategoryName = (category: string | Category | undefined): string => {
    if (!category) return "Autres"
    return typeof category === "string" ? category : category.name || "Autres"
  }

  const categories = ["all", ...new Set(menu.map((item) => getCategoryName(item.category)))]

  const filteredItems =
    selectedCategory === "all"
      ? menu
      : menu.filter((i) => getCategoryName(i.category) === selectedCategory)

  const handleAddToCart = (item: Product) => {
    setAddingItemId(item.id)

    dispatch(
      addToCart({
        product: item,
        quantity: 1,
        sourceId: id,
        sourceType: "restaurant",
      })
    )

    setTimeout(() => {
      setAddingItemId(null)
      Alert.alert("Ajouté !", `${item.name} a été ajouté au panier.`, [{ text: "OK" }])
    }, 300)
  }

  if (isLoading && !currentRestaurant) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  const renderMenuItem = ({ item }: { item: Product }) => {
    const isAdding = addingItemId === item.id
    const cartQuantity =
      cartItems.find((cartItem) => String(cartItem.product.id) === String(item.id))?.quantity || 0

    const imageUrl = getImageUrl(item.image)

    return (
      <Card style={styles.menuItem}>
        <View style={styles.menuItemContent}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.menuItemImage as ImageStyle}
              resizeMode="cover"
              onError={(e) => console.log("Image error:", e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="fastfood" size={30} color={COLORS.gray} />
            </View>
          )}

          {/* Conteneur principal du texte avec protection du nom */}
          <View style={styles.menuItemInfo}>
            <Text
              style={styles.menuItemName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name || "Produit sans nom"}
            </Text>

            <Text
              style={styles.menuItemDesc}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description || "Aucune description disponible"}
            </Text>

            <Text style={styles.menuItemPrice}>
              {typeof item.price === "number" ? item.price.toFixed(2) : item.price} €
            </Text>

            {cartQuantity > 0 && (
              <View style={styles.cartQuantityContainer}>
                <MaterialIcons name="shopping-cart" size={14} color={COLORS.white} />
                <Text style={styles.cartQuantity}>x{cartQuantity} dans le panier</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.addButtonLoading]}
            onPress={() => handleAddToCart(item)}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <MaterialIcons name="add" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </Card>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title={currentRestaurant?.commercial_name || "Restaurant"}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bannière - Image Cover du restaurant */}
        <View style={styles.bannerContainer}>
          {(() => {
            const coverImageUrl = getImageUrl(currentRestaurant?.cover_image)
            const logoImageUrl = getImageUrl(currentRestaurant?.logo)
            
            // Log de débogage en mode développement
            if (__DEV__) {
              console.log('[RestaurantDetailScreen] Données restaurant:', {
                id: currentRestaurant?.id,
                commercial_name: currentRestaurant?.commercial_name,
                cover_image: currentRestaurant?.cover_image,
                coverImageUrl,
                logo: currentRestaurant?.logo,
                logoImageUrl
              })
            }
            
            // Priorité 1: Image cover
            if (coverImageUrl) {
              return (
                <Image
                  source={{ uri: coverImageUrl }}
                  style={styles.bannerImage as ImageStyle}
                  resizeMode="cover"
                  onError={(e) => {
                    console.log('[RestaurantDetailScreen] Erreur chargement cover:', e.nativeEvent.error)
                  }}
                />
              )
            }
            
            // Priorité 2: Logo si pas de cover
            if (logoImageUrl) {
              return (
                <Image
                  source={{ uri: logoImageUrl }}
                  style={styles.bannerImage as ImageStyle}
                  resizeMode="cover"
                  onError={(e) => {
                    console.log('[RestaurantDetailScreen] Erreur chargement logo:', e.nativeEvent.error)
                  }}
                />
              )
            }
            
            // Priorité 3: Placeholder par défaut
            return (
              <View style={styles.bannerPlaceholder}>
                <MaterialIcons name="restaurant" size={60} color={COLORS.gray} />
              </View>
            )
          })()}
        </View>

        {/* Infos restaurant */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View>
              <Text style={styles.restaurantTitle}>
                {currentRestaurant?.commercial_name || "Restaurant"}
              </Text>
              <View style={styles.infoRow}>
                <Badge
                  text={String(currentRestaurant?.average_rating ?? "N/A")}
                  variant="primary"
                />
                <Text style={styles.infoText}>{currentRestaurant?.cuisine_type}</Text>
                <Text style={styles.infoText}>
                  🕐 {currentRestaurant?.avg_preparation_time || 25}-
                  {(currentRestaurant?.avg_preparation_time || 25) + 10} min
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>
            {currentRestaurant?.description || "Aucune description disponible."}
          </Text>

          {currentRestaurant?.full_address && (
            <Text style={styles.address}>📍 {currentRestaurant.full_address}</Text>
          )}
        </View>

        {/* Catégories */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item && { backgroundColor: COLORS.primary },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item && { color: COLORS.white },
                  ]}
                >
                  {item === "all" ? "Tout" : item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          />
        </View>

        {/* Liste des produits */}
        <View style={styles.menuSection}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <View key={item.id}>{renderMenuItem({ item })}</View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun produit disponible dans cette catégorie.</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Voir le panier"
          onPress={() => navigation.navigate("Cart")}
          color={COLORS.primary}
        />
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
  },
  bannerPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
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
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemInfo: {
    flex: 1,
    minWidth: 0,           // ← très important pour empêcher l'écrasement
  },
  menuItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    marginBottom: 2,
    color: COLORS.dark,
  },
  menuItemDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  menuItemPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    color: COLORS.primary,
    marginTop: 2,
  },
  cartQuantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  cartQuantity: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonLoading: {
    backgroundColor: COLORS.primary + "80",
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
    fontSize: TYPOGRAPHY.fontSize.base,
  },
})

export default RestaurantDetailScreen