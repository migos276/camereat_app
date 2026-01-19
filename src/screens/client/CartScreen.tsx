"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, FlatList, Image, ImageStyle, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, EmptyState } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { removeFromCart, updateQuantity } from "../../redux/slices/cartSlice"
import type { Product } from "../../types"
import { getFullImageUrl } from "../../utils/imageUtils"

interface CartItemDisplay {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
}

export const CartScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { items: cartItems } = useAppSelector((state) => state.cart)

  // Transform cart items from Redux to display format
  const items: CartItemDisplay[] = cartItems.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    description: item.product.description,
    price: parseFloat(String(item.product.price)) || 0,
    quantity: item.quantity,
    image: item.product.image,
  }))

  // Helper function to get full image URL using the centralized utility
  const getImageUrl = (path: string | undefined | null): string | null => {
    return getFullImageUrl(path)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 2.5
  const total = subtotal + deliveryFee

  const handleIncrement = (item: CartItemDisplay) => {
    dispatch(updateQuantity({ productId: item.id, quantity: item.quantity + 1 }))
  }

  const handleDecrement = (item: CartItemDisplay) => {
    if (item.quantity > 1) {
      dispatch(updateQuantity({ productId: item.id, quantity: item.quantity - 1 }))
    } else {
      dispatch(removeFromCart(item.id))
    }
  }

  const renderItem = ({ item }: { item: CartItemDisplay }) => {
    const imageUrl = getImageUrl(item.image)
    
    return (
      <Card style={styles.cartItem}>
        <View style={styles.itemContent}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage as ImageStyle} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image" size={24} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} €</Text>
          </View>
          <View style={styles.quantityControl}>
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={() => handleDecrement(item)}
            >
              <MaterialIcons name="remove" size={18} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={() => handleIncrement(item)}
            >
              <MaterialIcons name="add" size={18} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Panier" onBackPress={() => navigation.goBack()} />
        <EmptyState
          icon="shopping-cart"
          title="Votre panier est vide"
          description="Ajoutez des produits depuis les restaurants pour commencer"
          actionText="Parcourir les restaurants"
          onAction={() => navigation.navigate("RestaurantList")}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Votre Panier" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.itemsList}
        />

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé de la commande</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal.toFixed(2)} €</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)} €</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
          </View>
        </Card>

        <Card style={styles.promoCard}>
          <MaterialIcons name="local-offer" size={24} color={COLORS.primary} style={styles.promoIcon} />
          <View style={styles.promoContent}>
            <Text style={styles.promoLabel}>Vous avez un code promo?</Text>
            <TouchableOpacity>
              <Text style={styles.promoLink}>Entrez le code</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Commander • ${total.toFixed(2)} €`}
          onPress={() => navigation.navigate("Checkout")}
          color={COLORS.primary}
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  itemsList: {},
  cartItem: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginBottom: 4,
  },
  itemPrice: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    color: COLORS.primary,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  quantity: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
  totalLabel: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  totalValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.primary,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  promoIcon: {
    marginRight: 12,
  },
  promoContent: {
    flex: 1,
  },
  promoLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 4,
  },
  promoLink: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
})
