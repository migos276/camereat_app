import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import { COLORS, TYPOGRAPHY } from "../constants/config"

interface BadgeProps {
  text: string
  variant?: "primary" | "success" | "warning" | "error" | "info"
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = "primary" }) => {
  const colorMap = {
    primary: COLORS.CLIENT_PRIMARY,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    info: COLORS.INFO,
  }

  const backgroundColor = colorMap[variant]

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: COLORS.WHITE }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },
})
