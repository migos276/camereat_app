"use client"

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
  Platform,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useAppSelector } from "../../hooks"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { geolocationService } from "../../services/geolocation-service"
import type { Restaurant } from "../../types"

// Import conditionnel de MapView
let MapView: any = null
let Marker: any = null
let Callout: any = null
let PROVIDER_GOOGLE: any = null

try {
  const Maps = require("react-native-maps")
  MapView = Maps.default || Maps.MapView
  Marker = Maps.Marker
  Callout = Maps.Callout
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE
} catch (error) {
  console.warn("react-native-maps is not available in this environment")
}

type Props = NativeStackScreenProps<ClientStackParamList, "RestaurantsMap">

const { width, height } = Dimensions.get("window")

const CUISINE_TYPES = [
  "All",
  "African",
  "European",
  "Asian",
  "Fast Food",
  "Pizza",
  "Grilled",
  "Seafood",
  "Vegetarian",
  "Bakery",
  "Drinks",
]

// Calcul de distance optimisé
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const RestaurantsMapScreen: React.FC<Props> = ({ navigation }) => {
  const { restaurants } = useAppSelector((state) => state.restaurant)
  
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard")
  const [cuisineFilter, setCuisineFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance")
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false)
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  
  const mapRef = useRef<any>(null)
  const bottomSheetAnim = useRef(new Animated.Value(0)).current

  // Chargement initial de la localisation
  useEffect(() => {
    loadUserLocation()
  }, [])

  // Animation du bottom sheet
  useEffect(() => {
    Animated.spring(bottomSheetAnim, {
      toValue: bottomSheetExpanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start()
  }, [bottomSheetExpanded])

  const loadUserLocation = async () => {
    setIsLoading(true)
    try {
      const hasPermission = await geolocationService.requestLocationPermission()
      if (hasPermission) {
        const location = await geolocationService.getCurrentLocation()
        if (location) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          })
        } else {
          // Yaoundé par défaut
          setUserLocation({
            latitude: 3.848,
            longitude: 11.502,
          })
        }
      } else {
        setUserLocation({
          latitude: 3.848,
          longitude: 11.502,
        })
      }
    } catch (error) {
      console.error("Error loading location:", error)
      setUserLocation({
        latitude: 3.848,
        longitude: 11.502,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadUserLocation()
    setRefreshing(false)
  }, [])

  const handleMyLocationPress = useCallback(() => {
    if (userLocation && mapRef.current && mapReady) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      )
    }
  }, [userLocation, mapReady])

  const handleMarkerPress = useCallback((restaurantId: string, coordinate: any) => {
    setSelectedMarkerId(restaurantId)
    if (mapRef.current && mapReady) {
      mapRef.current.animateToRegion(
        {
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      )
    }
  }, [mapReady])

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    navigation.navigate("RestaurantDetail", { id: restaurantId })
  }, [navigation])

  const toggleMapType = useCallback(() => {
    setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))
  }, [])

  // Filtrage et tri des restaurants
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]

    // Filtre par cuisine
    if (cuisineFilter !== "All") {
      result = result.filter(
        (r) =>
          r.cuisine_type?.toLowerCase() === cuisineFilter.toLowerCase() ||
          r.cuisine_type?.toLowerCase().includes(cuisineFilter.toLowerCase()),
      )
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.commercial_name?.toLowerCase().includes(query) ||
          r.cuisine_type?.toLowerCase().includes(query) ||
          r.full_address?.toLowerCase().includes(query),
      )
    }

    // Calcul des distances
    if (userLocation) {
      result = result.map((r) => ({
        ...r,
        distance_km:
          r.latitude && r.longitude
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                r.latitude,
                r.longitude,
              )
            : 999,
      }))
    }

    // Tri
    if (sortBy === "distance") {
      result.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999))
    } else {
      result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    }

    return result
  }, [restaurants, cuisineFilter, searchQuery, sortBy, userLocation])

  // Cuisines disponibles
  const availableCuisines = useMemo(() => {
    const cuisines = new Set<string>(["All"])
    restaurants.forEach((r) => {
      if (r.cuisine_type) {
        cuisines.add(r.cuisine_type)
      }
    })
    return Array.from(cuisines)
  }, [restaurants])

  // Calcul de la région de la carte
  const mapRegion = useMemo(() => {
    if (!userLocation) {
      return {
        latitude: 3.848,
        longitude: 11.502,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    }

    if (filteredRestaurants.length === 0) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    }

    const coordinates = [
      { latitude: userLocation.latitude, longitude: userLocation.longitude }
    ]

    filteredRestaurants.forEach((restaurant) => {
      if (restaurant.latitude && restaurant.longitude) {
        coordinates.push({
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        })
      }
    })

    const latitudes = coordinates.map(c => c.latitude)
    const longitudes = coordinates.map(c => c.longitude)

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    const latPadding = (maxLat - minLat) * 0.3
    const lngPadding = (maxLng - minLng) * 0.3

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) + latPadding, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) + lngPadding, 0.02),
    }
  }, [userLocation, filteredRestaurants])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    )
  }

  if (!MapView || !Marker) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Restaurants à proximité</Text>
          <Text style={styles.headerSubtitle}>
            {filteredRestaurants.length} restaurants trouvés
          </Text>
        </View>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.gray} />
          <Text style={styles.mapPlaceholderText}>
            Carte non disponible
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Veuillez utiliser un appareil physique
          </Text>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle}>
            <View style={styles.handleBar} />
          </View>
          <Text style={styles.bottomSheetTitle}>Restaurants à proximité</Text>
          <ScrollView style={styles.restaurantList}>
            {filteredRestaurants.slice(0, 5).map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.restaurantItem}
                onPress={() => handleRestaurantPress(restaurant.id)}
              >
                <View style={styles.restaurantIcon}>
                  <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>
                    {restaurant.commercial_name || restaurant.name}
                  </Text>
                  <Text style={styles.restaurantCuisine}>
                    {restaurant.cuisine_type && `${restaurant.cuisine_type} • `}
                    {restaurant.distance_km?.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.ratingText}>
                    {restaurant.average_rating?.toFixed(1) || "N/A"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  }

  const animatedHeight = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.25, height * 0.6],
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Restaurants à proximité</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={COLORS.primary}
              style={refreshing ? { transform: [{ rotate: '360deg' }] } : {}}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.headerSubtitle}>
          {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouvé{filteredRestaurants.length > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleMyLocationPress}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
          <Ionicons
            name={mapType === "standard" ? "layers" : "globe"}
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {availableCuisines.slice(0, 10).map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[
                styles.filterChip,
                cuisineFilter === cuisine && styles.filterChipActive,
              ]}
              onPress={() => setCuisineFilter(cuisine)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  cuisineFilter === cuisine && styles.filterChipTextActive,
                ]}
              >
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType={mapType}
        provider={PROVIDER_GOOGLE}
        onMapReady={() => setMapReady(true)}
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.primary}
      >
        {filteredRestaurants.map((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return null

          const coordinate = {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }

          return (
            <Marker
              key={restaurant.id}
              coordinate={coordinate}
              onPress={() => handleMarkerPress(restaurant.id, coordinate)}
              tracksViewChanges={false}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerDot,
                    !restaurant.is_open && styles.markerDotClosed,
                    selectedMarkerId === restaurant.id && styles.markerDotSelected,
                  ]}
                >
                  <Ionicons 
                    name="restaurant" 
                    size={18} 
                    color={COLORS.white} 
                  />
                </View>
                {restaurant.average_rating && restaurant.average_rating > 0 && (
                  <View style={styles.markerRating}>
                    <Ionicons name="star" size={10} color={COLORS.white} />
                    <Text style={styles.markerRatingText}>
                      {restaurant.average_rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
              <Callout
                onPress={() => handleRestaurantPress(restaurant.id)}
                tooltip
              >
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutName} numberOfLines={1}>
                    {restaurant.commercial_name || restaurant.name}
                  </Text>
                  <Text style={styles.calloutCuisine}>
                    {restaurant.cuisine_type || "Restaurant"}
                  </Text>
                  <View style={styles.calloutRow}>
                    <View style={styles.calloutRating}>
                      <Ionicons name="star" size={14} color={COLORS.warning} />
                      <Text style={styles.calloutRatingText}>
                        {restaurant.average_rating?.toFixed(1) || "N/A"}
                      </Text>
                    </View>
                    <Text style={styles.calloutDistance}>
                      {restaurant.distance_km?.toFixed(1)} km
                    </Text>
                  </View>
                  <Text style={styles.calloutTap}>Appuyez pour voir</Text>
                </View>
              </Callout>
            </Marker>
          )
        })}
      </MapView>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>
        <TouchableOpacity
          style={styles.bottomSheetHandle}
          onPress={() => setBottomSheetExpanded(!bottomSheetExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.handleBar} />
        </TouchableOpacity>

        <View style={styles.sortContainer}>
          <Text style={styles.bottomSheetTitle}>
            {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''}
          </Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === "distance" && styles.sortButtonActive]}
              onPress={() => setSortBy("distance")}
            >
              <Ionicons
                name="location"
                size={16}
                color={sortBy === "distance" ? COLORS.white : COLORS.gray}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === "distance" && styles.sortButtonTextActive,
                ]}
              >
                Distance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === "rating" && styles.sortButtonActive]}
              onPress={() => setSortBy("rating")}
            >
              <Ionicons
                name="star"
                size={16}
                color={sortBy === "rating" ? COLORS.white : COLORS.gray}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === "rating" && styles.sortButtonTextActive,
                ]}
              >
                Note
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.restaurantList}
          showsVerticalScrollIndicator={false}
        >
          {filteredRestaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>Aucun restaurant trouvé</Text>
              <Text style={styles.emptyStateSubtext}>
                Essayez de modifier vos filtres
              </Text>
            </View>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={[
                  styles.restaurantItem,
                  selectedMarkerId === restaurant.id && styles.restaurantItemSelected,
                ]}
                onPress={() => handleRestaurantPress(restaurant.id)}
              >
                <View style={styles.restaurantIcon}>
                  <Ionicons name="restaurant" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {restaurant.commercial_name || restaurant.name}
                  </Text>
                  <Text style={styles.restaurantCuisine}>
                    {restaurant.cuisine_type || "Restaurant"}
                  </Text>
                  <View style={styles.restaurantMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={14} color={COLORS.gray} />
                      <Text style={styles.metaText}>
                        {restaurant.distance_km?.toFixed(1)} km
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={14} color={COLORS.gray} />
                      <Text style={styles.metaText}>
                        {restaurant.avg_preparation_time || "30"} min
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.restaurantRight}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text style={styles.ratingText}>
                      {restaurant.average_rating?.toFixed(1) || "N/A"}
                    </Text>
                  </View>
                  {!restaurant.is_open && (
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedText}>Fermé</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>
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
    height: height,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  mapPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
  mapPlaceholderSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
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
    top: Platform.OS === "ios" ? 50 : 40,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    height: 36,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  mapControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 180 : 170,
    right: SPACING.md,
    zIndex: 10,
  },
  controlButton: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 180 : 170,
    left: 0,
    right: 80,
    zIndex: 10,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerDotClosed: {
    backgroundColor: COLORS.gray,
  },
  markerDotSelected: {
    transform: [{ scale: 1.2 }],
    borderColor: COLORS.warning,
  },
  markerRating: {
    position: "absolute",
    bottom: -8,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerRatingText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.white,
    marginLeft: 2,
  },
  calloutContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    width: 200,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  calloutCuisine: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  calloutRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  calloutRatingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 4,
  },
  calloutDistance: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  calloutTap: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: "100%",
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sortButtons: {
    flexDirection: "row",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginLeft: 4,
  },
  sortButtonTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  bottomSheetTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.dark,
  },
  restaurantList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING["3xl"],
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.dark,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  restaurantItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
  },
  restaurantItemSelected: {
    backgroundColor: COLORS.primary + "15",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  restaurantIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontWeight: "600",
    color: COLORS.dark,
  },
  restaurantCuisine: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  restaurantMeta: {
    flexDirection: "row",
    marginTop: SPACING.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginLeft: 4,
  },
  restaurantRight: {
    alignItems: "flex-end",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 4,
  },
  closedBadge: {
    backgroundColor: COLORS.danger + "20",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  closedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.danger,
    fontWeight: "600",
  },
})

export default RestaurantsMapScreen