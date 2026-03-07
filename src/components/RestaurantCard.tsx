"use client"

import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import { COLORS, SPACING, TYPOGRAPHY } from "../constants/config"
import type { Restaurant } from "../types"

interface RestaurantCardProps {
  restaurant: Restaurant
  onPress: () => void
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress }) => {
  // Handle both old format (for backward compatibility) and new format
  const name = restaurant.commercial_name || restaurant.name || "Restaurant"
  const image = restaurant.logo || restaurant.image || undefined
  const rating = restaurant.average_rating || restaurant.rating
  const isOpen = restaurant.is_open !== undefined ? restaurant.is_open : true
  const cuisineType = restaurant.cuisine_type || ""
  const address = restaurant.full_address || ""
  const prepTime = restaurant.avg_preparation_time || 30
  const distance = restaurant.distance_km || 0

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
          </View>
        )}
        {!isOpen && <View style={styles.closedOverlay} />}
        {distance > 0 && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distance} km</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {typeof rating === 'number' ? rating.toFixed(1) : String(rating)}</Text>
            </View>
          )}
        </View>

        {cuisineType ? (
          <Text style={styles.cuisine} numberOfLines={1}>
            {cuisineType}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {prepTime > 0 ? (
            <Text style={styles.deliveryTime}>🕐 {prepTime} min</Text>
          ) : null}
          {address ? (
            <Text style={styles.address} numberOfLines={1}>
              {address}
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
  distanceBadge: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SPACING.xs,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    color: COLORS.white,
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

