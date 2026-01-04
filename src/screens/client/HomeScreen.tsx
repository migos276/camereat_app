"use client"

import React from "react"

import { useState } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getNearbyRestaurants } from "../../redux/slices/restaurantSlice"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { geolocationService } from "../../services/geolocation-service"
import RestaurantCard from "../../components/RestaurantCard"

type Props = NativeStackScreenProps<ClientStackParamList, "Home">

const HomeScreen = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { restaurants, isLoading } = useAppSelector((state) => state.restaurant)
  const [refreshing, setRefreshing] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useFocusEffect(
    React.useCallback(() => {
      loadNearbyRestaurants()
    }, []),
  )

  const loadNearbyRestaurants = async () => {
    const hasPermission = await geolocationService.requestLocationPermission()
    if (hasPermission) {
      const location = await geolocationService.getCurrentLocation()
      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
        dispatch(
          getNearbyRestaurants({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            radiusKm: 5,
          }),
        )
      }
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadNearbyRestaurants()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Deliver It</Text>
        <Text style={styles.location}>📍 Your Location</Text>
      </View>

      {isLoading && restaurants.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
              <TouchableOpacity onPress={() => navigation.navigate("SearchStack")}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={restaurants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => navigation.navigate("RestaurantDetail", { id: item.id })}
                />
              )}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingTop: SPACING["2xl"],
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  location: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  viewAll: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
})

export default HomeScreen
