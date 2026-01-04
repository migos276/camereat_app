"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { logout } from "../../redux/slices/authSlice"
import { loadDarkModePreference, saveDarkModePreference } from "../../redux/slices/themeSlice"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"

type Props = NativeStackScreenProps<ClientStackParamList, "Settings">

interface SettingsItemProps {
  title: string
  subtitle?: string
  onPress?: () => void
  rightComponent?: React.ReactNode
}

const SettingsItem: React.FC<SettingsItemProps> = ({ title, subtitle, onPress, rightComponent }) => {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingsItemRight}>{rightComponent}</View>
    </TouchableOpacity>
  )
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { darkMode, loading } = useAppSelector((state) => state.theme)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Load dark mode preference on component mount
  useEffect(() => {
    dispatch(loadDarkModePreference() as any)
  }, [dispatch])

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          dispatch(logout())
          // Navigation will be handled by RootNavigator based on auth state
        },
      },
    ])
  }

  const handleDarkModeToggle = (value: boolean) => {
    dispatch(saveDarkModePreference(value) as any)
  }

  // Get colors based on theme
  const backgroundColor = darkMode ? COLORS.dark : COLORS.background
  const sectionBackgroundColor = darkMode ? COLORS.darkGray : COLORS.white
  const textColor = darkMode ? COLORS.white : COLORS.dark
  const subtitleColor = darkMode ? COLORS.lightGray : COLORS.gray
  const borderColor = darkMode ? COLORS.darkGray : COLORS.lightGray

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
        <Text style={[styles.sectionTitle, { color: subtitleColor }]}>Account</Text>
        <SettingsItem
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => {
            // Navigate to edit profile
          }}
        />
        <SettingsItem
          title="Email"
          subtitle={user?.email || "Not set"}
          onPress={() => {
            // Navigate to change email
          }}
        />
        <SettingsItem
          title="Phone"
          subtitle={user?.phone || "Not set"}
          onPress={() => {
            // Navigate to change phone
          }}
        />
        <SettingsItem
          title="Password"
          subtitle="Change your password"
          onPress={() => {
            // Navigate to change password
          }}
        />
      </View>

      <View style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
        <Text style={[styles.sectionTitle, { color: subtitleColor }]}>Preferences</Text>
        <SettingsItem
          title="Notifications"
          subtitle="Receive push notifications"
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          }
        />
        <SettingsItem
          title="Dark Mode"
          subtitle="Enable dark theme"
          rightComponent={
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          }
        />
        <SettingsItem
          title="Language"
          subtitle="English"
          onPress={() => {
            // Navigate to language selection
          }}
        />
      </View>

      <View style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
        <Text style={[styles.sectionTitle, { color: subtitleColor }]}>Support</Text>
        <SettingsItem
          title="Help Center"
          subtitle="FAQs and support"
          onPress={() => {
            // Navigate to help center
          }}
        />
        <SettingsItem
          title="Contact Us"
          subtitle="Get in touch with our team"
          onPress={() => {
            // Navigate to contact us
          }}
        />
        <SettingsItem
          title="Privacy Policy"
          onPress={() => {
            // Navigate to privacy policy
          }}
        />
        <SettingsItem
          title="Terms of Service"
          onPress={() => {
            // Navigate to terms of service
          }}
        />
      </View>

      <View style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
        <SettingsItem
          title="Logout"
          onPress={handleLogout}
        />
      </View>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: subtitleColor }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.gray,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    textTransform: "uppercase",
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingsItemLeft: {
    flex: 1,
  },
  settingsItemRight: {
    marginLeft: SPACING.md,
  },
  settingsItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
  settingsItemSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  versionContainer: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
})

export default SettingsScreen

