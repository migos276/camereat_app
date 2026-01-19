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
  Image,
} from "react-native"
import { useState, useEffect } from "react"
import * as ImagePicker from "expo-image-picker"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Button, TextInput } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { updateProfile } from "../../redux/slices/authSlice"
import { userService } from "../../services/user-service"

interface EditProfileScreenProps {
  navigation: any
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { user, isLoading, error } = useAppSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone_number: user?.phone || "",
    email: user?.email || "",
  })

  // Profile photo state
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [imageKey, setImageKey] = useState(0) // Force re-render of image

  // Initialize profile photo with cache buster
  useEffect(() => {
    if (user?.photo_profil) {
      // Add cache buster to force refresh
      const timestamp = Date.now()
      setProfilePhotoUri(`${user.photo_profil}?t=${timestamp}`)
    }
  }, [user?.photo_profil])

  const handleSave = async () => {
    try {
      const result = await dispatch(updateProfile(formData)).unwrap()
      Alert.alert("Success", "Profile updated successfully!")
      navigation.goBack()
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update profile")
    }
  }

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your media library to select a profile photo.')
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
      setProfilePhotoUri(uri)
      await uploadProfilePhoto(uri)
    }
  }

  const uploadProfilePhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true)
      const response = await userService.uploadProfilePhoto(uri)
      
      // Update local state with new photo URL and force re-render
      if (response.photo_profil) {
        // Add a timestamp to force refresh the image
        const timestamp = Date.now()
        const cacheBusterUrl = `${response.photo_profil}?t=${timestamp}`
        setProfilePhotoUri(cacheBusterUrl)
        // Increment the key to force React to re-create the Image component
        setImageKey(prev => prev + 1)
      }
      
      Alert.alert('Success', 'Profile photo uploaded successfully!')
    } catch (err: any) {
      console.error('Error uploading profile photo:', err)
      Alert.alert('Error', err.response?.data?.error || 'Failed to upload profile photo. Please try again.')
      // Reset to previous photo on failure
      setProfilePhotoUri(user?.photo_profil || null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getInitials = () => {
    const firstName = formData.first_name || user?.first_name || ""
    const lastName = formData.last_name || user?.last_name || ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <View style={styles.container}>
      <Header title="Edit Profile" />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Photo Section */}
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <View style={styles.profilePhotoCard}>
            <View style={styles.avatarContainer}>
              {profilePhotoUri ? (
                <Image 
                  key={imageKey}
                  source={{ uri: profilePhotoUri }} 
                  style={styles.avatarImage}
                  onError={() => console.log('Error loading profile photo')}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.white} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickProfilePhoto}
              disabled={uploadingPhoto}
            >
              <MaterialIcons name="photo-camera" size={20} color={COLORS.white} />
              <Text style={styles.changePhotoButtonText}>
                {profilePhotoUri ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Recommended: 1:1 aspect ratio, max 5MB</Text>
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.formCard}>
            <TextInput
              label="First Name"
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              placeholder="Enter your first name"
            />

            <TextInput
              label="Last Name"
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              placeholder="Enter your last name"
            />

            <TextInput
              label="Phone"
              value={formData.phone_number}
              onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              style={styles.saveButton}
            />
            
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING["2xl"],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as const,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    textTransform: "uppercase" as const,
  },
  profilePhotoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: COLORS.light,
    marginBottom: SPACING.lg,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  avatarInitials: {
    fontSize: TYPOGRAPHY.fontSize["3xl"],
    fontWeight: "600" as const,
    color: COLORS.white,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
    gap: SPACING.sm,
  },
  changePhotoButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    color: COLORS.white,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.danger,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  buttonContainer: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderColor: COLORS.gray,
  },
})

export default EditProfileScreen

