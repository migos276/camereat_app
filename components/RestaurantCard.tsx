"use client"

import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/config"
import type { Restaurant } from "../src/types"

interface RestaurantCardProps {
  restaurant: Restaurant
  onPress: () => void
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress }) => {
  const addressString = typeof restaurant.address === "string" 
    ? restaurant.address 
    : restaurant.address?.address_line || ""

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {restaurant.image ? (
          <Image source={{ uri: restaurant.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{restaurant.name.charAt(0)}</Text>
          </View>
        )}
        {!restaurant.is_open && <View style={styles.closedOverlay} />}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          {restaurant.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {restaurant.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
          <Text style={styles.cuisine} numberOfLines={1}>
            {restaurant.cuisine_types.join(", ")}
          </Text>
        )}

        <View style={styles.footer}>
          {restaurant.delivery_time ? (
            <Text style={styles.deliveryTime}>🕐 {restaurant.delivery_time} min</Text>
          ) : null}
          {addressString ? (
            <Text style={styles.address} numberOfLines={1}>
              {addressString}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
    overflow: "hidden",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.gray,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize["3xl"],
    fontWeight: "bold",
    color: COLORS.white,
  },
  closedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.dark,
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SPACING.xs,
  },
  rating: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.dark,
  },
  cuisine: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: "500",
  },
  address: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    flex: 1,
    textAlign: "right",
    marginLeft: SPACING.sm,
  },
})

export default RestaurantCard
