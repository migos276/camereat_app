"use client"

import type React from "react"
import { View, StyleSheet, Text, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { Header, Button, TextInput } from "../../components"
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { updateProfile } from "../../redux/slices/authSlice"
import { useState } from "react"

interface EditProfileScreenProps {
  navigation: any
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { user, isLoading, error } = useAppSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone_number: user?.phone_number || "",
    email: user?.email || "",
  })

  const handleSave = async () => {
    try {
      const result = await dispatch(updateProfile(formData)).unwrap()
      Alert.alert("Success", "Profile updated successfully!")
      navigation.goBack()
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update profile")
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Edit Profile" />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600" as const,
    marginBottom: SPACING.md,
    color: COLORS.dark,
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

