import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS, TYPOGRAPHY } from "../constants/config"

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionText?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionText, onAction }) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon as any} size={64} color={COLORS.TEXT_SECONDARY} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onAction && (
        <Text style={styles.action} onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.heading3,
    marginBottom: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    textAlign: "center",
  },
  action: {
    ...TYPOGRAPHY.body1,
    color: COLORS.CLIENT_PRIMARY,
    fontWeight: "600",
  },
})
