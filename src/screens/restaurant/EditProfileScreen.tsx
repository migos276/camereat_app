"use client"

import type React from "react"
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { restaurantService } from "../../services/restaurant-service"
import type { Restaurant } from "../../types"
import { useState, useEffect } from "react"

// Valid cuisine types from backend model
const CUISINE_OPTIONS = [
  { label: "Africain", value: "AFRICAIN" },
  { label: "Asiatique", value: "ASIATIQUE" },
  { label: "Européen", value: "EUROPEEN" },
  { label: "Fast Food", value: "FAST_FOOD" },
  { label: "Pizza", value: "PIZZA" },
  { label: "Burger", value: "BURGER" },
  { label: "Sushi", value: "SUSHI" },
  { label: "Italien", value: "ITALIEN" },
  { label: "Français", value: "FRANCAIS" },
  { label: "Autre", value: "AUTRE" },
]

type Props = NativeStackScreenProps<RestaurantStackParamList, "EditProfile">

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  const [formData, setFormData] = useState({
    commercial_name: "",
    legal_name: "",
    description: "",
    cuisine_type: "",
    full_address: "",
    phone: "",
  })

  useEffect(() => {
    fetchRestaurantData()
  }, [])

  const fetchRestaurantData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await restaurantService.getMyRestaurant()
      setRestaurant(data)

      // Initialize form with existing data
      setFormData({
        commercial_name: data.commercial_name || "",
        legal_name: data.legal_name || "",
        description: data.description || "",
        cuisine_type: data.cuisine_type || "",
        full_address: data.full_address || "",
        phone: user?.phone || "",
      })
    } catch (err: any) {
      console.error("Error fetching restaurant data:", err)
      setError(err.response?.data?.message || "Failed to load restaurant profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      if (!formData.commercial_name.trim()) {
        setError("Commercial name is required")
        setSaving(false)
        Alert.alert("Error", "Please enter a commercial name for your restaurant")
        return
      }

      // Update user profile (phone)
      const userData: any = {}
      if (formData.phone !== user?.phone) {
        userData.phone = formData.phone
      }

      // Update restaurant profile
      const restaurantData: Partial<Restaurant> = {
        commercial_name: formData.commercial_name,
        legal_name: formData.legal_name,
        description: formData.description,
        cuisine_type: formData.cuisine_type,
        full_address: formData.full_address,
      }

      // Remove undefined or empty values
      Object.keys(restaurantData).forEach((key) => {
        if (restaurantData[key as keyof Restaurant] === "") {
          delete restaurantData[key as keyof Restaurant]
        }
      })

      // Save restaurant profile
      await restaurantService.updateRestaurantProfile(restaurantData)

      Alert.alert("Success", "Profile updated successfully!")
      navigation.goBack()
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.response?.data?.message || "Failed to update profile")
      Alert.alert("Error", err.response?.data?.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Restaurant Information */}
          <Text style={styles.sectionTitle}>Restaurant Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Commercial Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.commercial_name}
                onChangeText={(text) => updateFormData("commercial_name", text)}
                placeholder="Enter commercial name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Legal Name</Text>
              <TextInput
                style={styles.input}
                value={formData.legal_name}
                onChangeText={(text) => updateFormData("legal_name", text)}
                placeholder="Enter legal name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => updateFormData("description", text)}
                multiline
                numberOfLines={3}
                placeholder="Enter description"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisine Type</Text>
              <TextInput
                style={styles.input}
                value={formData.cuisine_type}
                onChangeText={(text) => updateFormData("cuisine_type", text)}
                placeholder="Enter cuisine type"
              />
            </View>
          </View>

          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => updateFormData("phone", text)}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formData.full_address}
                onChangeText={(text) => updateFormData("full_address", text)}
                placeholder="Enter full address"
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
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
    color: COLORS.danger,
    textAlign: "center",
    marginTop: SPACING.md,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600" as any,
    color: COLORS.dark,
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING["2xl"],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as any,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    textTransform: "uppercase",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500" as any,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  input: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    backgroundColor: COLORS.light,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    minHeight: 44,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: "transparent",
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.gray,
  },
})

export default EditProfileScreen

