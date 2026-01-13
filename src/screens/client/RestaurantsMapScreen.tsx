"use client"

import React, { useEffect, useState } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useAppSelector } from "../../hooks"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { geolocationService } from "../../services/geolocation-service"

// Conditionally import MapView to handle environments where it's not available
let MapView: any = null
let Marker: any = null
try {
  const Maps = require("react-native-maps")
  MapView = Maps.MapView
  Marker = Maps.Marker
} catch (error) {
  console.warn("react-native-maps is not available in this environment")
}

type Props = NativeStackScreenProps<ClientStackParamList, "RestaurantsMap">

const { width, height } = Dimensions.get("window")

const RestaurantsMapScreen: React.FC<Props> = ({ navigation }) => {
  const { restaurants } = useAppSelector((state) => state.restaurant)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserLocation()
  }, [])

  const loadUserLocation = async () => {
    const hasPermission = await geolocationService.requestLocationPermission()
    if (hasPermission) {
      const location = await geolocationService.getCurrentLocation()
      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      } else {
        // Default to Yaoundé if no location
        setUserLocation({
          latitude: 3.848,
          longitude: 11.502,
        })
      }
    } else {
      // Default to Yaoundé if no permission
      setUserLocation({
        latitude: 3.848,
        longitude: 11.502,
      })
    }
    setIsLoading(false)
  }

  const handleMarkerPress = (restaurantId: string) => {
    navigation.navigate("RestaurantDetail", { id: restaurantId })
  }

  const handleBackPress = () => {
    navigation.goBack()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    )
  }

  // Show fallback UI if MapView is not available
  if (!MapView || !Marker) {
    return (
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nearby Restaurants</Text>
          <Text style={styles.headerSubtitle}>
            {restaurants.length} restaurants found
          </Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.gray} />
          <Text style={styles.mapPlaceholderText}>
            Map not available in this environment
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Please use a development build or native app
          </Text>
        </View>

        {/* Restaurant List Preview */}
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>Restaurants Nearby</Text>
          {restaurants.slice(0, 3).map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.restaurantItem}
              onPress={() => handleMarkerPress(restaurant.id)}
            >
              <View style={styles.restaurantIcon}>
                <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>
                  {restaurant.commercial_name || restaurant.name}
                </Text>
                <Text style={styles.restaurantDetails}>
                  {restaurant.cuisine_type && `${restaurant.cuisine_type} • `}
                  {restaurant.distance_km?.toFixed(1)} km
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  // Calculate region to fit all restaurants
  const getMapRegion = () => {
    if (!userLocation) {
      return {
        latitude: 3.848,
        longitude: 11.502,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    }

    if (restaurants.length === 0) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    }

    // Find bounds of all restaurants + user location
    const latitudes = [userLocation.latitude]
    const longitudes = [userLocation.longitude]

    restaurants.forEach((restaurant) => {
      if (restaurant.latitude) latitudes.push(restaurant.latitude)
      if (restaurant.longitude) longitudes.push(restaurant.longitude)
    })

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    const latDelta = (maxLat - minLat) * 1.5 + 0.02
    const lngDelta = (maxLng - minLng) * 1.5 + 0.02

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    }
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Restaurants</Text>
        <Text style={styles.headerSubtitle}>
          {restaurants.length} restaurants found
        </Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={getMapRegion()}
        region={getMapRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
            pinColor={COLORS.primary}
          />
        )}

        {/* Restaurant Markers */}
        {restaurants.map((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return null

          return (
            <Marker
              key={restaurant.id}
              coordinate={{
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }}
              title={restaurant.commercial_name || restaurant.name || "Restaurant"}
              description={
                restaurant.cuisine_type
                  ? `${restaurant.cuisine_type} • ${restaurant.distance_km?.toFixed(1) || ""} km`
                  : restaurant.distance_km
                  ? `${restaurant.distance_km.toFixed(1)} km away`
                  : undefined
              }
              onPress={() => handleMarkerPress(restaurant.id)}
              pinColor={COLORS.primary}
            />
          )
        })}
      </MapView>

      {/* Restaurant List Preview */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.bottomSheetTitle}>Restaurants Nearby</Text>
        {restaurants.slice(0, 3).map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantItem}
            onPress={() => handleMarkerPress(restaurant.id)}
          >
            <View style={styles.restaurantIcon}>
              <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>
                {restaurant.commercial_name || restaurant.name}
              </Text>
              <Text style={styles.restaurantDetails}>
                {restaurant.cuisine_type && `${restaurant.cuisine_type} • `}
                {restaurant.distance_km?.toFixed(1)} km
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  map: {
    width: width,
    height: height * 0.65,
  },
  mapPlaceholder: {
    width: width,
    height: height * 0.65,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  mapPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600" as const,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  mapPlaceholderSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: SPACING.md,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: SPACING.sm,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 60,
    right: SPACING.md,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold" as const,
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING["2xl"],
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  bottomSheetTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600" as const,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  restaurantItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
  },
  restaurantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.dark,
  },
  restaurantDetails: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
})

export default RestaurantsMapScreen

