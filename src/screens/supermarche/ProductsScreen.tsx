"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Switch } from "react-native"
import { useState } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  available: boolean
  category: string
}

export const SupermarcheProductsScreen: React.FC<any> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Organic Milk", sku: "MLK001", price: 3.99, stock: 45, available: true, category: "Dairy" },
    { id: "2", name: "Whole Wheat Bread", sku: "BRD001", price: 2.99, stock: 23, available: true, category: "Bakery" },
    { id: "3", name: "Fresh Apples", sku: "APL001", price: 4.99, stock: 0, available: false, category: "Produce" },
    { id: "4", name: "Chicken Breast", sku: "CHK001", price: 8.99, stock: 15, available: true, category: "Meat" },
  ])

  const toggleAvailability = (id: string) => {
    setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku}</Text>
        </View>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="inventory-2" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.detailText}>{item.stock} in stock</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailText, item.stock > 0 && { color: COLORS.SUCCESS }]}>
            {item.stock > 0 ? "In Stock" : "Out of Stock"}
          </Text>
        </View>
      </View>

      <View style={styles.productFooter}>
        <View style={styles.availabilityStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.available ? COLORS.SUCCESS : COLORS.ERROR }]} />
          <Text style={styles.availabilityText}>{item.available ? "Available" : "Unavailable"}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={18} color={COLORS.SUPERMARCHE_PRIMARY} />
          </TouchableOpacity>
          <Switch
            value={item.available}
            onValueChange={() => toggleAvailability(item.id)}
            trackColor={{ false: COLORS.BORDER, true: COLORS.SUCCESS }}
            thumbColor={COLORS.WHITE}
          />
        </View>
      </View>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Header
        title="Products"
        subtitle="Manage your inventory"
        userType="supermarche"
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title="Add New Product"
          color={COLORS.SUPERMARCHE_PRIMARY}
          onPress={() => navigation.navigate("AddProduct")}
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    marginBottom: 2,
  },
  productSku: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  productPrice: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.SUPERMARCHE_PRIMARY,
  },
  productDetails: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
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
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
})
