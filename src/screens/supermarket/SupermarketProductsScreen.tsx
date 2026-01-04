"use client"

import React from "react"
import { useState } from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Switch } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { SupermarchéStackParamList } from "../../navigation/SupermarchéNavigator"
import { Header, Card, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

type Props = NativeStackScreenProps<SupermarchéStackParamList, "SupermarketProducts">

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  available: boolean
  category: string
}

const SupermarketProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Organic Milk", sku: "MLK001", price: 3.99, stock: 45, available: true, category: "Dairy" },
    { id: "2", name: "Whole Wheat Bread", sku: "BRD001", price: 2.99, stock: 23, available: true, category: "Bakery" },
    { id: "3", name: "Fresh Apples", sku: "APL001", price: 4.99, stock: 0, available: false, category: "Produce" },
    { id: "4", name: "Chicken Breast", sku: "CHK001", price: 8.99, stock: 15, available: true, category: "Meat" },
    { id: "5", name: "Orange Juice", sku: "OJR001", price: 5.49, stock: 32, available: true, category: "Beverages" },
    { id: "6", name: "Pasta Sauce", sku: "PSR001", price: 4.29, stock: 18, available: true, category: "Condiments" },
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
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="inventory-2" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.stock} in stock</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailText, item.stock > 0 && { color: COLORS.success }]}>
            {item.stock > 0 ? "In Stock" : "Out of Stock"}
          </Text>
        </View>
      </View>

      <View style={styles.productFooter}>
        <View style={styles.availabilityStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.available ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.availabilityText}>{item.available ? "Available" : "Unavailable"}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="delete" size={18} color={COLORS.danger} />
          </TouchableOpacity>
          <Switch
            value={item.available}
            onValueChange={() => toggleAvailability(item.id)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
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
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{products.filter(p => p.available).length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{products.filter(p => p.stock === 0).length}</Text>
              <Text style={styles.statLabel}>Out of Stock</Text>
            </View>
          </View>
        }
      />

      <View style={styles.footer}>
        <Button
          title="Add New Product"
          color={COLORS.primary}
          onPress={() => navigation.navigate("SupermarketProducts")}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as any,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginTop: 4,
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
    color: COLORS.gray,
  },
  categoryBadge: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
  },
  productPrice: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.primary,
  },
  productDetails: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
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
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
})

export default SupermarketProductsScreen

