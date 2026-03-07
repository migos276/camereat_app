import * as React from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { COLORS } from "../constants/config"

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  shadow?: boolean
}

export const Card: React.FC<CardProps> = ({ children, style, shadow = true }) => {
  return <View style={[styles.card, shadow && styles.shadow, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
})
