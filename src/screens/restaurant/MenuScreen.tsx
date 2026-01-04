"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Switch } from "react-native"
import { useState } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface MenuItem {
  id: string
  name: string
  price: number
  available: boolean
  category: string
}

export const RestaurantMenuScreen: React.FC<any> = ({ navigation }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: "1", name: "Margherita Pizza", price: 12.99, available: true, category: "Pizzas" },
    { id: "2", name: "Pepperoni Pizza", price: 14.99, available: true, category: "Pizzas" },
    { id: "3", name: "Carbonara Pasta", price: 14.99, available: false, category: "Pasta" },
    { id: "4", name: "Fettuccine Alfredo", price: 13.99, available: true, category: "Pasta" },
  ])

  const toggleAvailability = (id: string) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
  }

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <Card style={styles.menuItemCard}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemCategory}>{item.category}</Text>
        </View>
        <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.menuItemFooter}>
        <View style={styles.availabilityStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.available ? COLORS.SUCCESS : COLORS.ERROR }]} />
          <Text style={styles.availabilityText}>{item.available ? "Available" : "Unavailable"}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={18} color={COLORS.RESTAURANT_PRIMARY} />
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
        title="Menu"
        subtitle="Manage your products"
        userType="restaurant"
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title="Add New Product"
          color={COLORS.RESTAURANT_PRIMARY}
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
  menuItemCard: {
    marginBottom: 12,
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
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    marginBottom: 2,
  },
  menuItemCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  menuItemPrice: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.RESTAURANT_PRIMARY,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
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
