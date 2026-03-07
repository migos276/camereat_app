"use client"

import React, { useState, useCallback } from "react"
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

const AVATAR_SIZE = 110

type Props = NativeStackScreenProps<RestaurantStackParamList, "RestaurantProfile">

const RestaurantProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarVersion, setAvatarVersion] = useState(0)

  const fetchRestaurantData = useCallback(async () => {
    try {
      setError(null)
      const data = await restaurantService.getMyRestaurant()
      setRestaurant(data)
      setAvatarVersion((v) => v + 1)
    } catch (err: any) {
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
      setAvatarVersion((v) => v + 1)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to refresh restaurant profile")
    } finally {
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      let isActive = true
      setLoading(true)
      const loadData = async () => {
        try {
          setError(null)
          // Force a fresh fetch to get the latest restaurant data including updated logo
          const data = await restaurantService.getMyRestaurant()
          console.log("[RestaurantProfileScreen] Fetched restaurant data:", {
            id: data.id,
            commercial_name: data.commercial_name,
            logo: data.logo,
            cover_image: data.cover_image,
          })
          if (isActive) {
            setRestaurant(data)
            // Force image refresh by incrementing version
            setAvatarVersion((v) => v + 1)
          }
        } catch (err: any) {
          console.error("[RestaurantProfileScreen] Error fetching restaurant:", err)
          if (isActive) setError(err.response?.data?.message || "Failed to load restaurant profile")
        } finally {
          if (isActive) setLoading(false)
        }
      }
      loadData()
      return () => { isActive = false }
    }, [])
  )

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => dispatch(logout()) },
    ])
  }

  const handleEditProfile = () => {
    if (restaurant) navigation.navigate("EditProfile" as never)
  }

  const getImageUrl = (path: string | undefined | null): string | null =>
    getFullImageUrl(path)

  const memberSince = user?.date_creation
    ? new Date(user.date_creation).toLocaleDateString("en-US", { month: "long", year: "numeric" })
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

  const restaurantName = restaurant?.commercial_name || user?.first_name || "Restaurant"
  const restaurantEmail = user?.email || "contact@restaurant.com"
  const restaurantPhone = user?.phone || "+1 234 567 8900"
  const restaurantAddress = restaurant?.full_address || "Address not set"
  const restaurantRating = restaurant?.average_rating?.toFixed(1) || "0.0"
  const totalOrders = restaurant?.review_count || 0

  const logoImageUrl = getImageUrl(restaurant?.logo || user?.photo_profil || restaurant?.image)
  console.log("[RestaurantProfileScreen] Logo sources:", {
    restaurantLogo: restaurant?.logo,
    userPhotoProfil: user?.photo_profil,
    restaurantImage: restaurant?.image,
    finalUrl: logoImageUrl,
  })
  const logoImageUrlWithCacheBuster = logoImageUrl
    ? `${logoImageUrl}${logoImageUrl.includes("?") ? "&" : "?"}v=${avatarVersion}`
    : null

  console.log("[RestaurantProfileScreen] Final avatar URL:", logoImageUrlWithCacheBuster)

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Top hero: photo de profil centrée ── */}
      <View style={styles.hero}>
        <View style={styles.avatarContainer}>
          {logoImageUrlWithCacheBuster ? (
            <Image
              source={{ uri: logoImageUrlWithCacheBuster }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={(e) => console.log("[RestaurantProfileScreen] Avatar load error:", e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="storefront" size={48} color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Edit button */}
        <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEditProfile}>
          <MaterialIcons name="edit" size={14} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.name}>{restaurantName}</Text>
        <Text style={styles.email}>{restaurantEmail}</Text>

        {/* Stats */}
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

      {/* ── Restaurant Info ── */}
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

      {/* ── Settings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("AddProduct" as never)}>
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

      {/* ── Support ── */}
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

      {/* ── Logout ── */}
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
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.light,
  },
  loadingText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.gray },

  errorContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: COLORS.light, padding: SPACING.xl,
  },
  errorTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "600" as any, color: COLORS.dark, marginTop: SPACING.md },
  errorText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.gray, textAlign: "center", marginTop: SPACING.sm, marginBottom: SPACING.lg },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: SPACING.sm },
  retryButtonText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  avatarImage: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    top: 48 + AVATAR_SIZE - 28,
    right: "50%",
    marginRight: -(AVATAR_SIZE / 2) + 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as any,
    color: COLORS.white,
    marginBottom: 4,
  },
  email: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, opacity: 0.8 },

  statsRow: { flexDirection: "row", marginTop: SPACING.lg },
  statItem: { alignItems: "center", paddingHorizontal: SPACING.lg },
  statValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.white, opacity: 0.8 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.white, opacity: 0.3 },

  // ── Sections ──
  section: { padding: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.gray,
    marginBottom: SPACING.sm, textTransform: "uppercase",
  },
  infoCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  infoText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark, flex: 1 },

  menuCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm },
  menuItem: { flexDirection: "row", alignItems: "center", padding: SPACING.md },
  menuText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.dark, marginLeft: SPACING.md },
  divider: { height: 1, backgroundColor: COLORS.lightGray },

  logoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.danger, padding: SPACING.md,
    borderRadius: SPACING.sm, gap: SPACING.sm,
  },
  logoutText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },

  versionContainer: { padding: SPACING.xl, alignItems: "center" },
  versionText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
})

export default RestaurantProfileScreen
