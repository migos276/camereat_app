"use client"

import type React from "react"
import { useState } from "react"
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import TextInput from "../../components/TextInput"
import { Button } from "../../components/Button"

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendReset = async () => {
    if (!email) {
      alert("Please enter your email")
      return
    }
    setIsLoading(true)
    // TODO: Call reset password API
    setTimeout(() => {
      setIsLoading(false)
      setSent(true)
    }, 1500)
  }

  if (sent) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.successContainer}>
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>We've sent password reset instructions to {email}</Text>
          </View>

          <Button
            title="Back to Login"
            onPress={() => {
              navigation.navigate("Login" as const)
            }}
          />
        </View>
      </ScrollView>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <Button title={isLoading ? "Sending..." : "Send Reset Link"} onPress={handleSendReset} disabled={isLoading} />
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
  backButton: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
    marginBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING["3xl"],
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
  successContainer: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  successBox: {
    alignItems: "center",
    marginBottom: SPACING["2xl"],
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold" as const,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    textAlign: "center",
  },
})

export default ForgotPasswordScreen
