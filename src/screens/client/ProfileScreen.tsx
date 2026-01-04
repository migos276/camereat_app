"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Avatar, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch } from "../../hooks"
import { logout } from "../../redux/slices/authSlice"

interface ProfileScreenProps {
  navigation: any
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => dispatch(logout()) },
    ])
  }

  return (
    <View style={styles.container}>
      <Header title="Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar initials="JD" size="large" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileEmail}>john.doe@example.com</Text>
              <TouchableOpacity onPress={() => navigation.navigate("EditProfile")}>
                <Text style={styles.editProfile}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Addresses")}>
            <MaterialIcons name="location-on" size={24} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.menuText}>Delivery Addresses</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
            <MaterialIcons name="settings" size={24} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.menuText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="favorite" size={24} color={COLORS.ERROR} />
            <Text style={styles.menuText}>Favorite Restaurants</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="help" size={24} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </Card>

        <Button
          title="Logout"
          color={COLORS.ERROR}
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.heading2,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  editProfile: {
    ...TYPOGRAPHY.body2,
    color: COLORS.CLIENT_PRIMARY,
    fontWeight: "600",
  },
  section: {
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  menuText: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    flex: 1,
  },
  logoutButton: {
    marginTop: 24,
  },
})
