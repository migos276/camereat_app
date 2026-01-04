"use client"

import React from "react"
import { useState } from "react"
import { View, StyleSheet, Text, Switch, TouchableOpacity, ScrollView, Alert } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useNavigation } from "@react-navigation/native"
import { useAppDispatch } from "../../hooks"
import { logout } from "../../redux/slices/authSlice"
import { clearProfile } from "../../redux/slices/livreurSlice"
import type { LivreurStackParamList } from "../../navigation/LivreurNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"

type Props = NativeStackScreenProps<LivreurStackParamList, "LivreurSettings">

const LivreurSettingsScreen: React.FC<Props> = () => {
  const dispatch = useAppDispatch()
  const navigation = useNavigation()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          // Clear livreur profile first
          dispatch(clearProfile())
          // Then logout from auth
          await dispatch(logout())
          // Navigation will be handled by RootNavigator based on auth state
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Preferences</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-Assign Orders</Text>
              <Text style={styles.settingSubtitle}>Automatically accept nearby orders</Text>
            </View>
            <Switch
              value={autoAssignEnabled}
              onValueChange={setAutoAssignEnabled}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Receive order alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Language</Text>
            <Text style={styles.menuValue}>English</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Privacy Policy</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Help Center</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Contact Us</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Report a Problem</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.gray, marginBottom: SPACING.sm, textTransform: "uppercase" },
  settingsCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.md },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark },
  settingSubtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray, marginTop: SPACING.xs },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.md },
  menuText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.dark },
  menuValue: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  divider: { height: 1, backgroundColor: COLORS.lightGray },
  logoutButton: { backgroundColor: COLORS.danger, padding: SPACING.md, borderRadius: SPACING.sm, alignItems: "center" },
  logoutText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.white },
  versionContainer: { padding: SPACING.xl, alignItems: "center" },
  versionText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
})

export default LivreurSettingsScreen
