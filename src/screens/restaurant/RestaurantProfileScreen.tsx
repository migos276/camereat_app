"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { logout } from "../../redux/slices/authSlice"
import { restaurantService } from "../../services/restaurant-service"
import type { Restaurant } from "../../types"
import { getFullImageUrl } from "../../utils/imageUtils"

const { width } = Dimensions.get('window')
const AVATAR_SIZE = 100

type Props = NativeStackScreenProps<RestaurantStackParamList, "RestaurantProfile">

const RestaurantProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurantData = useCallback(async () => {
    try {
      setError(null)
      const data = await restaurantService.getMyRestaurant()
      setRestaurant(data)
    } catch (err: any) {
      console.error("Error fetching restaurant data:", err)
      setError(err.response?.data?.message || "Failed to load restaurant profile")
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      setError(null)
      const data = await restaurantService.getMyRestaurant()
      setRestaurant(data)
    } catch (err: any) {
      console.error("Error refreshing restaurant data:", err)
      setError(err.response?.data?.message || "Failed to refresh restaurant profile")
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Use useFocusEffect to refresh data when screen comes into focus
  // This ensures updated profile data is shown after editing
  useFocusEffect(
    useCallback(() => {
      let isActive = true

      // Reset loading state when screen comes into focus
      setLoading(true)
      
      const loadData = async () => {
        try {
          setError(null)
          const data = await restaurantService.getMyRestaurant()
          if (isActive) {
            setRestaurant(data)
          }
        } catch (err: any) {
          console.error("Error fetching restaurant data:", err)
          if (isActive) {
            setError(err.response?.data?.message || "Failed to load restaurant profile")
          }
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }
      }

      loadData()

      return () => {
        isActive = false
      }
    }, [])
  )

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => dispatch(logout()),
      },
    ])
  }

  const handleEditProfile = () => {
    if (restaurant) {
      navigation.navigate("EditProfile" as never)
    }
  }

  // Helper function to get full image URL using the centralized utility
  const getImageUrl = (path: string | undefined | null): string | null => {
    return getFullImageUrl(path)
  }

  // Generate member since date from user creation or restaurant creation
  const memberSince = user?.date_creation
    ? new Date(user.date_creation).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "N/A"

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (error && !restaurant) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Failed to Load Profile</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurantData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Use real data or fallback values
  const restaurantName =
    restaurant?.commercial_name || user?.first_name || "Restaurant"
  const restaurantEmail = user?.email || "contact@restaurant.com"
  const restaurantPhone = user?.phone || "+1 234 567 8900"
  const restaurantAddress = restaurant?.full_address || "Address not set"
  const restaurantRating = restaurant?.average_rating?.toFixed(1) || "0.0"
  const totalOrders = restaurant?.review_count || 0

  // Get image URLs
  const coverImageUrl = getImageUrl(restaurant?.cover_image)
  const logoImageUrl = getImageUrl(restaurant?.logo)

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Cover Image with Avatar Overlay */}
      <View style={styles.coverImageContainer}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverImagePlaceholder}>
            <MaterialIcons name="restaurant" size={48} color={COLORS.gray} />
          </View>
        )}
        <View style={styles.coverOverlay} />
        {/* Avatar positioned absolutely over the cover image */}
        <View style={[styles.avatarContainer, { left: (width - AVATAR_SIZE) / 2 }]}>
          {logoImageUrl ? (
            <Image
              source={{ uri: logoImageUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="storefront" size={40} color={COLORS.primary} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.name}>{restaurantName}</Text>
        <Text style={styles.email}>{restaurantEmail}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{restaurantRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{restaurantPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{restaurantAddress}</Text>
          </View>
          {restaurant?.cuisine_type && (
            <View style={styles.infoRow}>
              <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{restaurant.cuisine_type}</Text>
            </View>
          )}
          {restaurant?.description && (
            <View style={styles.infoRow}>
              <MaterialIcons name="description" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{restaurant.description}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("AddProduct" as never)}
          >
            <MaterialIcons name="restaurant-menu" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Manage Menu</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="notifications" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="payment" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Payment Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="help" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="privacy-tip" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="description" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Member since {memberSince}</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600" as any,
    color: COLORS.dark,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING["2xl"],
    alignItems: "center",
    paddingBottom: SPACING["3xl"], // Extra padding to account for the overlapping avatar
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as any,
    color: COLORS.white,
  },
  email: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  statsRow: { flexDirection: "row", marginTop: SPACING.lg },
  statItem: { alignItems: "center", paddingHorizontal: SPACING.lg },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as any,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white,
    opacity: 0.3,
  },
  section: { padding: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as any,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "500" as any,
    color: COLORS.dark,
    flex: 1,
  },
  menuCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm },
  menuItem: { flexDirection: "row", alignItems: "center", padding: SPACING.md },
  menuText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    marginLeft: SPACING.md,
  },
  divider: { height: 1, backgroundColor: COLORS.lightGray },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.white,
  },
  versionContainer: { padding: SPACING.xl, alignItems: "center" },
  versionText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  // Cover image styles
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.light,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  // Avatar styles - Fixed positioning
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarImage: {
    width: AVATAR_SIZE - 6, // Subtract border width
    height: AVATAR_SIZE - 6,
    borderRadius: (AVATAR_SIZE - 6) / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE - 6,
    height: AVATAR_SIZE - 6,
    borderRadius: (AVATAR_SIZE - 6) / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default RestaurantProfileScreen