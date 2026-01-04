"use client"

import type React from "react"
import { useState } from "react"
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { CommonActions } from "@react-navigation/native"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { register } from "../../redux/slices/authSlice"
import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../../constants/config"
import TextInput from "../../components/TextInput"
import { Button } from "../../components/Button"

type Props = NativeStackScreenProps<AuthStackParamList, "Register">

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    passwordConfirm: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const handleRegister = async () => {
    console.log("[RegisterScreen] handleRegister appelé")
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = formData

    if (!email || !password || !confirmPassword || !firstName || !lastName || !phoneNumber) {
      alert("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const userType = route.params?.userType || "client"
    console.log("[RegisterScreen] Type d'utilisateur:", userType)

    try {
      console.log("[RegisterScreen] Début de l'inscription...")
      await dispatch(
        register({
          email,
          password,
          password_confirm: confirmPassword,
          phone: phoneNumber,  // CORRIGÉ: phone au lieu de phone_number
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
        }),
      ).unwrap()
      console.log("[RegisterScreen] Inscription réussie!")
      
      // Navigate to the appropriate screen based on user type
      // The RootNavigator will handle the navigation to the correct dashboard
      // @ts-ignore - TypeScript issue with CommonActions.reset type inference
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [{ name: "UserTypeSelect" }],
      })
      // @ts-ignore
      navigation.dispatch(resetAction)
    } catch (error: any) {
      console.error("[RegisterScreen] Erreur d'inscription:", error)
      alert(error?.message || error || "Registration failed")
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our delivery platform</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.col}>
              <TextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(v) => setFormData({ ...formData, firstName: v })}
                placeholder="John"
                editable={!isLoading}
              />
            </View>
            <View style={styles.col}>
              <TextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(v) => setFormData({ ...formData, lastName: v })}
                placeholder="Doe"
                editable={!isLoading}
              />
            </View>
          </View>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(v) => setFormData({ ...formData, email: v })}
            placeholder="your@email.com"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            label="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(v) => setFormData({ ...formData, phoneNumber: v })}
            placeholder="+213 XXX XXX XXX"
            keyboardType="phone-pad"
            editable={!isLoading}
          />

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(v) => setFormData({ ...formData, password: v })}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            editable={!isLoading}
          />

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />

          <Button
            title={isLoading ? "Creating account..." : "Create Account"}
            onPress={handleRegister}
            disabled={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login" as const)}>
            <Text style={styles.signinLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING["2xl"],
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as const,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  form: {
    marginBottom: SPACING["2xl"],
  },
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  col: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: "#FFE6E6",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  signinLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as const,
  },
})

export default RegisterScreen
