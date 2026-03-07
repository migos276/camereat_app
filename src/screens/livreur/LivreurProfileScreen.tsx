"use client"

import React, { useEffect } from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { LivreurStackParamList } from "../../navigation/LivreurNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getCurrentUser } from "../../redux/slices/authSlice"
import { getLivreurProfile, clearProfile } from "../../redux/slices/livreurSlice"

type Props = NativeStackScreenProps<LivreurStackParamList, "LivreurProfile">

const LivreurProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { profile, isLoading, error } = useAppSelector((state) => state.livreur)
  const { user: authUser } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // First, ensure we have the current user data from auth
    if (!authUser) {
      dispatch(getCurrentUser())
    }
    // Then fetch the livreur profile
    dispatch(getLivreurProfile())
    
    // Cleanup: clear profile when unmounting
    return () => {
      dispatch(clearProfile())
    }
  }, [dispatch, authUser])

  useEffect(() => {
    // Show error if profile fetch failed
    if (error) {
      Alert.alert(
        "Error",
        error,
        [{ text: "OK" }]
      )
    }
  }, [error])

  if (isLoading && !profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  // Get user data from authSlice as primary source, fallback to profile.user
  const currentUser = authUser || profile?.user
  const fullName = currentUser 
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() 
    : "Unknown User"
  const email = currentUser?.email || "No email"
  const memberSince = profile?.date_started 
    ? new Date(profile.date_started).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : authUser?.date_creation 
      ? new Date(authUser.date_creation).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : "N/A"

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color={COLORS.white} />
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.average_rating?.toFixed(1) || "N/A"}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.delivery_count || 0}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("LivreurSettings")}>
            <MaterialIcons name="settings" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="payment" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Payment Methods</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="history" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Delivery History</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="help" size={24} color={COLORS.dark} />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member Since</Text>
        <Text style={styles.memberSince}>{memberSince}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
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
  menuCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm },
  menuItem: { flexDirection: "row", alignItems: "center", padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  menuText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.dark, marginLeft: SPACING.md },
  memberSince: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.dark },
})

export default LivreurProfileScreen
