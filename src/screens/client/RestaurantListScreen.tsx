"use client"

import type React from "react"
import { View, FlatList, StyleSheet, Text, TouchableOpacity, RefreshControl } from "react-native"
import { useState, useEffect, useCallback } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, LoadingSpinner, EmptyState } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface Restaurant {
  id: string
  name: string
  image: string
  rating: number
  distance: string
  deliveryTime: string
  deliveryFee: number
  cuisineTypes: string[]
}

export const RestaurantListScreen: React.FC<any> = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    setLoading(true)
    try {
      // Mock data - replace with API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setRestaurants([
        {
          id: "1",
          name: "La Pizzeria",
          image: "/placeholder.svg",
          rating: 4.8,
          distance: "2.5 km",
          deliveryTime: "25-35 min",
          deliveryFee: 2.5,
          cuisineTypes: ["Italian", "Pizza"],
        },
        {
          id: "2",
          name: "Burger Palace",
          image: "/placeholder.svg",
          rating: 4.5,
          distance: "1.2 km",
          deliveryTime: "15-20 min",
          deliveryFee: 1.5,
          cuisineTypes: ["American", "Burgers"],
        },
        {
          id: "3",
          name: "Asian Wok",
          image: "/placeholder.svg",
          rating: 4.6,
          distance: "3.1 km",
          deliveryTime: "30-40 min",
          deliveryFee: 3,
          cuisineTypes: ["Asian", "Chinese"],
        },
      ])
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadRestaurants()
    setRefreshing(false)
  }, [])

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity onPress={() => navigation.navigate("RestaurantDetail", { restaurantId: item.id })}>
      <Card style={styles.restaurantCard}>
        <View style={styles.imageContainer}>
          <Text style={styles.placeholderImage}>Restaurant Image</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={14} color={COLORS.WARNING} />
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
          </View>

          <Text style={styles.cuisines}>{item.cuisineTypes.join(" • ")}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="location-on" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.infoText}>{item.distance}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.infoText}>{item.deliveryTime}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="local-shipping" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.infoText}>${item.deliveryFee}</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <View style={styles.container}>
      <Header title="Restaurants" subtitle="Order from nearby restaurants" />

      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="restaurant"
            title="No Restaurants Available"
            description="Check back later or try a different location"
          />
        }
      />
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
    paddingBottom: 32,
  },
  restaurantCard: {
    marginBottom: 12,
    overflow: "hidden",
  },
  imageContainer: {
    backgroundColor: COLORS.BORDER,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderImage: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  cardContent: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  restaurantName: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  rating: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  cuisines: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
})
