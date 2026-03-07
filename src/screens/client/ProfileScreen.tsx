"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Avatar, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { logout } from "../../redux/slices/authSlice"

// Fonction utilitaire pour générer les initiales à partir du prénom et nom
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || ""
  const last = lastName?.charAt(0)?.toUpperCase() || ""
  return first + last || "?"
}

interface ProfileScreenProps {
  navigation: any
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  // Extraire les données de l'utilisateur ou utiliser des valeurs par défaut
  const firstName = user?.first_name || ""
  const lastName = user?.last_name || ""
  const fullName = user?.full_name || `${firstName} ${lastName}`.trim() || "Utilisateur"
  const email = user?.email || "Non disponible"
  const initials = getInitials(firstName, lastName)
  const photoProfil = user?.photo_profil ? { uri: user.photo_profil } : undefined

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
            <Avatar source={photoProfil} initials={initials} size="large" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("EditProfile")}>
                <Text style={styles.editProfile}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Addresses")}>
            <MaterialIcons name="location-on" size={24} color={COLORS.primary} />
            <Text style={styles.menuText}>Delivery Addresses</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
            <MaterialIcons name="settings" size={24} color={COLORS.primary} />
            <Text style={styles.menuText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="favorite" size={24} color={COLORS.danger} />
            <Text style={styles.menuText}>Favorite Restaurants</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="help" size={24} color={COLORS.primary} />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </Card>

        <Button
          title="Logout"
          color={COLORS.danger}
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
    backgroundColor: COLORS.background,
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
    color: COLORS.gray,
    marginBottom: 6,
  },
  editProfile: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
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
