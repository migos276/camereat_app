import * as React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS, TYPOGRAPHY } from "../constants/config"

interface HeaderProps {
  title: string
  subtitle?: string
  onBackPress?: () => void
  rightIcon?: string
  onRightPress?: () => void
  userType?: "client" | "livreur" | "restaurant" | "supermarche"
}

const getUserTypeColor = (userType?: string) => {
  switch (userType) {
    case "client":
      return COLORS.primary
    case "livreur":
      return COLORS.secondary
    case "restaurant":
      return COLORS.primary
    case "supermarche":
      return COLORS.secondary
    default:
      return COLORS.primary
  }
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBackPress, rightIcon, onRightPress, userType }) => {
  const backgroundColor = getUserTypeColor(userType)

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.contentContainer}>
        <View style={styles.leftSection}>
          {onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <MaterialIcons name={rightIcon as any} size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    width: 40,
  },
  titleSection: {
    flex: 1,
    alignItems: "center",
  },
  rightSection: {
    width: 40,
    alignItems: "flex-end",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    color: COLORS.white,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
  },
})
