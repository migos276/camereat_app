"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, FlatList } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, EmptyState } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export const CartScreen: React.FC<any> = ({ navigation }) => {
  const items: CartItem[] = [
    { id: "1", name: "Margherita Pizza", price: 12.99, quantity: 1 },
    { id: "2", name: "Carbonara Pasta", price: 14.99, quantity: 2 },
  ]

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 2.5
  const total = subtotal + deliveryFee

  const renderItem = ({ item }: { item: CartItem }) => (
    <Card style={styles.cartItem}>
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.quantityButton}>
            <MaterialIcons name="remove" size={18} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity style={styles.quantityButton}>
            <MaterialIcons name="add" size={18} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  )

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Cart" onBackPress={() => navigation.goBack()} />
        <EmptyState
          icon="shopping-cart"
          title="Your cart is empty"
          description="Add items from restaurants to get started"
          actionText="Browse Restaurants"
          onAction={() => navigation.navigate("RestaurantList")}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Your Cart" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.itemsList}
        />

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </Card>

        <Card style={styles.promoCard}>
          <MaterialIcons name="local-offer" size={24} color={COLORS.CLIENT_PRIMARY} style={styles.promoIcon} />
          <View style={styles.promoContent}>
            <Text style={styles.promoLabel}>Have a promo code?</Text>
            <TouchableOpacity>
              <Text style={styles.promoLink}>Enter code</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Checkout • $${total.toFixed(2)}`}
          onPress={() => navigation.navigate("Checkout")}
          color={COLORS.CLIENT_PRIMARY}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemPrice: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    color: COLORS.CLIENT_PRIMARY,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.BACKGROUND,
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
    backgroundColor: COLORS.BORDER,
    marginVertical: 12,
  },
  totalLabel: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  totalValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.CLIENT_PRIMARY,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.CLIENT_PRIMARY,
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
    color: COLORS.CLIENT_PRIMARY,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
})
