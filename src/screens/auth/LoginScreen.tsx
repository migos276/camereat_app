"use client"

import type React from "react"
import { useState } from "react"
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { login } from "../../redux/slices/authSlice"
import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../../constants/config"
import TextInput from "../../components/TextInput"
import { Button } from "../../components/Button"

type Props = NativeStackScreenProps<AuthStackParamList, "Login">

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields")
      return
    }
    dispatch(login({ email, password }))
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            editable={!isLoading}
          />

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword" as const)}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title={isLoading ? "Signing in..." : "Sign In"} onPress={handleLogin} disabled={isLoading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("UserTypeSelect" as const)}>
            <Text style={styles.signupLink}>Sign up</Text>
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
    justifyContent: "center",
  },
  header: {
    marginBottom: SPACING["3xl"],
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
  forgotPassword: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING["2xl"],
  },
  footerText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as const,
  },
})

export default LoginScreen
