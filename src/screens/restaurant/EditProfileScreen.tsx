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
  Image,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { restaurantService } from "../../services/restaurant-service"
import type { Restaurant } from "../../types"
import { useState, useEffect } from "react"
import { getFullImageUrl } from "../../utils/imageUtils"

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

// Helper function to get full image URL using the centralized utility
const getImageUrl = (path: string | undefined | null): string | null => {
  return getFullImageUrl(path)
}

export const EditProfileScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  const [formData, setFormData] = useState({
    commercial_name: "",
    legal_name: "",
    description: "",
    cuisine_type: "",
    full_address: "",
    phone: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })

  // Image picker state - store local URIs for preview
  const [logoUri, setLogoUri] = useState<string | null>(null)
  const [coverUri, setCoverUri] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

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
        latitude: data.latitude ? parseFloat(String(data.latitude)) : null,
        longitude: data.longitude ? parseFloat(String(data.longitude)) : null,
      })

      // Initialize image URIs from existing restaurant data - convert to full URLs
      if (data.logo) {
        const fullLogoUrl = getImageUrl(data.logo)
        setLogoUri(fullLogoUrl)
      }
      if (data.cover_image) {
        const fullCoverUrl = getImageUrl(data.cover_image)
        setCoverUri(fullCoverUrl)
      }
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

      // Round coordinates to 6 decimal places to avoid precision errors
      const roundedLatitude = formData.latitude 
        ? Math.round(formData.latitude * 1000000) / 1000000 
        : undefined;
      const roundedLongitude = formData.longitude 
        ? Math.round(formData.longitude * 1000000) / 1000000 
        : undefined;

      // Update restaurant profile
      const restaurantData: any = {
        commercial_name: formData.commercial_name,
        legal_name: formData.legal_name,
        description: formData.description,
        cuisine_type: formData.cuisine_type,
        full_address: formData.full_address,
        latitude: roundedLatitude,
        longitude: roundedLongitude,
      }

      // Remove undefined or empty values
      Object.keys(restaurantData).forEach((key) => {
        if (restaurantData[key as keyof Restaurant] === "" || restaurantData[key as keyof Restaurant] === undefined) {
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

  // Image picker handlers
  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your media library to select a logo.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri
      setLogoUri(uri) // Show preview immediately
      await uploadImage('logo', uri)
    }
  }

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your media library to select a cover image.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri
      setCoverUri(uri) // Show preview immediately
      await uploadImage('cover_image', uri)
    }
  }

  const uploadImage = async (type: 'logo' | 'cover_image', uri: string) => {
    try {
      if (type === 'logo') {
        setUploadingLogo(true)
      } else {
        setUploadingCover(true)
      }

      let updatedRestaurant: Restaurant
      if (type === 'logo') {
        updatedRestaurant = await restaurantService.uploadLogo(uri)
      } else {
        updatedRestaurant = await restaurantService.uploadCoverImage(uri)
      }

      setRestaurant(updatedRestaurant)
      
      // Update the URI to the full URL from server
      if (type === 'logo' && updatedRestaurant.logo) {
        const fullUrl = getImageUrl(updatedRestaurant.logo)
        setLogoUri(fullUrl)
      } else if (type === 'cover_image' && updatedRestaurant.cover_image) {
        const fullUrl = getImageUrl(updatedRestaurant.cover_image)
        setCoverUri(fullUrl)
      }
      
      Alert.alert('Success', `${type === 'logo' ? 'Logo' : 'Cover image'} uploaded successfully!`)
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err)
      Alert.alert('Error', `Failed to upload ${type === 'logo' ? 'logo' : 'cover image'}. Please try again.`)
      // Reset to previous image on failure
      if (type === 'logo' && restaurant?.logo) {
        const fullUrl = getImageUrl(restaurant.logo)
        setLogoUri(fullUrl)
      } else if (type === 'cover_image' && restaurant?.cover_image) {
        const fullUrl = getImageUrl(restaurant.cover_image)
        setCoverUri(fullUrl)
      } else {
        // If no previous image, clear the preview
        if (type === 'logo') {
          setLogoUri(null)
        } else {
          setCoverUri(null)
        }
      }
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingCover(false)
      }
    }
  }

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true)
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to set your restaurant position. Please enable it in your device settings.'
        )
        return
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const { latitude, longitude } = location.coords
      console.log('[EDIT_PROFILE] Got location:', latitude, longitude)
      
      setFormData((prev) => ({
        ...prev,
        latitude,
        longitude,
      }))
      
      Alert.alert(
        'Position Set',
        `Your restaurant position has been set to: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      )
    } catch (err: any) {
      console.error('Error getting location:', err)
      Alert.alert(
        'Error',
        'Unable to get your current location. Please check your GPS settings and try again.'
      )
    } finally {
      setGettingLocation(false)
    }
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
          {/* Restaurant Images Section */}
          <Text style={styles.sectionTitle}>Restaurant Images</Text>
          <View style={styles.formCard}>
            {/* Cover Image */}
            <View style={styles.imageSection}>
              <Text style={styles.label}>Cover Image</Text>
              <View style={styles.coverImageContainer}>
                {coverUri ? (
                  <Image 
                    source={{ uri: coverUri }} 
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.coverImagePlaceholder}>
                    <MaterialIcons name="image" size={48} color={COLORS.gray} />
                    <Text style={styles.placeholderText}>No cover image</Text>
                  </View>
                )}
                {uploadingCover && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.white} />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickCover}
                disabled={uploadingCover}
              >
                <MaterialIcons name="photo-camera" size={20} color={COLORS.white} />
                <Text style={styles.imagePickerButtonText}>
                  {coverUri ? 'Change Cover Image' : 'Add Cover Image'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Recommended: 16:9 aspect ratio</Text>
            </View>

            <View style={styles.divider} />

            {/* Logo */}
            <View style={styles.imageSection}>
              <Text style={styles.label}>Logo</Text>
              <View style={styles.logoContainer}>
                {logoUri ? (
                  <Image 
                    source={{ uri: logoUri }} 
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <MaterialIcons name="storefront" size={40} color={COLORS.gray} />
                  </View>
                )}
                {uploadingLogo && (
                  <View style={styles.uploadingOverlaySmall}>
                    <ActivityIndicator size="small" color={COLORS.white} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickLogo}
                disabled={uploadingLogo}
              >
                <MaterialIcons name="photo-camera" size={20} color={COLORS.white} />
                <Text style={styles.imagePickerButtonText}>
                  {logoUri ? 'Change Logo' : 'Add Logo'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Recommended: 1:1 aspect ratio</Text>
            </View>
          </View>

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
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Legal Name</Text>
              <TextInput
                style={styles.input}
                value={formData.legal_name}
                onChangeText={(text) => updateFormData("legal_name", text)}
                placeholder="Enter legal name"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => updateFormData("description", text)}
                multiline
                numberOfLines={3}
                placeholder="Enter description"
                placeholderTextColor={COLORS.gray}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisine Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  style={styles.picker}
                  selectedValue={formData.cuisine_type}
                  onValueChange={(itemValue) => updateFormData("cuisine_type", itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="Select cuisine type..." value="" />
                  {CUISINE_OPTIONS.map((option) => (
                    <Picker.Item 
                      key={option.value} 
                      label={option.label} 
                      value={option.value} 
                    />
                  ))}
                </Picker>
              </View>
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
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.full_address}
                onChangeText={(text) => updateFormData("full_address", text)}
                placeholder="Enter full address"
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Location Section */}
          <Text style={styles.sectionTitle}>Restaurant Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.helperText}>
              Set your restaurant's exact location using GPS. This helps customers find you and calculate delivery distances.
            </Text>
            
            <View style={styles.locationButtons}>
              <TouchableOpacity
                style={[styles.locationButton, { backgroundColor: COLORS.primary }]}
                onPress={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <MaterialIcons name="my-location" size={20} color={COLORS.white} />
                )}
                <Text style={styles.locationButtonText}>
                  {gettingLocation ? 'Getting location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
            </View>

            {formData.latitude && formData.longitude && (
              <View style={styles.locationInfo}>
                <View style={styles.coordinateItem}>
                  <Text style={styles.locationLabel}>Latitude</Text>
                  <Text style={styles.locationValue}>{formData.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.locationLabel}>Longitude</Text>
                  <Text style={styles.locationValue}>{formData.longitude.toFixed(6)}</Text>
                </View>
                <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
              </View>
            )}
          </View>

          {error && <Text style={styles.errorTextInline}>{error}</Text>}

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
              disabled={saving}
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
  errorTextInline: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.danger,
    textAlign: "center",
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#fee',
    borderRadius: SPACING.sm,
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
  textArea: {
    minHeight: 80,
    paddingTop: SPACING.md,
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
    minHeight: 50,
    justifyContent: 'center',
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
    minHeight: 50,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.gray,
  },
  // Image picker styles
  imageSection: {
    paddingVertical: SPACING.md,
  },
  coverImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.light,
    marginBottom: SPACING.md,
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
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: COLORS.white,
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: COLORS.light,
    marginBottom: SPACING.md,
    alignSelf: 'center',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
  },
  uploadingOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    gap: SPACING.sm,
    minHeight: 50,
  },
  imagePickerButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.white,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: SPACING.md,
  },
  // Picker styles
  pickerContainer: {
    backgroundColor: COLORS.light,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: COLORS.dark,
  },
  // Location section styles
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  locationButtons: {
    marginTop: SPACING.md,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    gap: SPACING.sm,
    minHeight: 50,
  },
  locationButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.white,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.light,
    borderRadius: SPACING.sm,
  },
  coordinateItem: {
    flex: 1,
  },
  locationLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  locationValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "500" as any,
    color: COLORS.dark,
  },
})