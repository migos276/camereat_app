"use client"

import React from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch } from "../../hooks"
import { logout } from "../../redux/slices/authSlice"

type Props = NativeStackScreenProps<RestaurantStackParamList, "RestaurantProfile">

const RestaurantProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const restaurant = {
    name: "Burger Palace",
    email: "contact@burgerpalace.com",
    phone: "+1 234 567 8900",
    address: "456 Food Ave, City",
    rating: 4.8,
    totalOrders: 1250,
    memberSince: "January 2024",
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => dispatch(logout()) },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="storefront" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.email}>{restaurant.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{restaurant.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{restaurant.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{restaurant.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{restaurant.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="edit" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
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
        <Text style={styles.versionText}>Member since {restaurant.memberSince}</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, paddingTop: SPACING["2xl"], alignItems: "center" },
  avatarContainer: { marginBottom: SPACING.md },
  name: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  email: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  statsRow: { flexDirection: "row", marginTop: SPACING.lg },
  statItem: { alignItems: "center", paddingHorizontal: SPACING.lg },
  statValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.white, opacity: 0.8 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.white, opacity: 0.3 },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.gray, marginBottom: SPACING.sm, textTransform: "uppercase" },
  infoCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  infoText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark },
  menuCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm },
  menuItem: { flexDirection: "row", alignItems: "center", padding: SPACING.md },
  menuText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.dark, marginLeft: SPACING.md },
  divider: { height: 1, backgroundColor: COLORS.lightGray },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.danger, padding: SPACING.md, borderRadius: SPACING.sm, gap: SPACING.sm },
  logoutText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },
  versionContainer: { padding: SPACING.xl, alignItems: "center" },
  versionText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
})

export default RestaurantProfileScreen
