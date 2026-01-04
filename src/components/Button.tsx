import * as React from "react"
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native"
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../constants/config"

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  style?: any
  color?: string
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  size = "md",
  loading = false,
  style,
  color,
}) => {
  const getStyles = () => {
    const sizeStyles = {
      sm: { height: 36, paddingHorizontal: SPACING.md },
      md: { height: 48, paddingHorizontal: SPACING.lg },
      lg: { height: 56, paddingHorizontal: SPACING.lg },
    }

    return {
      ...sizeStyles[size],
      ...(disabled || loading ? { opacity: 0.6 } : {}),
    }
  }

  const getBackgroundColor = () => {
    if (color) return color
    if (disabled || loading) return `${COLORS.primary}80`
    switch (variant) {
      case "primary":
        return COLORS.primary
      case "secondary":
        return COLORS.secondary
      case "outline":
        return COLORS.white
      default:
        return COLORS.primary
    }
  }

  const getTextColor = () => {
    if (variant === "outline") {
      return COLORS.primary
    }
    return COLORS.white
  }

  return (
    <TouchableOpacity
      style={[styles.button, getStyles(), { backgroundColor: getBackgroundColor() }, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
  },
})

