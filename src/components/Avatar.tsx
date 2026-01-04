import type React from "react"
import { Image, View, StyleSheet, Text } from "react-native"
import { COLORS, TYPOGRAPHY } from "../constants/config"

interface AvatarProps {
  source?: { uri: string }
  initials?: string
  size?: "small" | "medium" | "large"
}

export const Avatar: React.FC<AvatarProps> = ({ source, initials, size = "medium" }) => {
  const sizeMap = {
    small: 40,
    medium: 56,
    large: 80,
  }

  const avatarSize = sizeMap[size]
  const fontSize = size === "small" ? 14 : size === "medium" ? 18 : 24

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {source ? (
        <Image source={source} style={[styles.image, { width: avatarSize, height: avatarSize }]} />
      ) : (
        <View style={[styles.initials, { width: avatarSize, height: avatarSize }]}>
          <Text style={[TYPOGRAPHY.body2, { fontSize, fontWeight: "600", color: COLORS.WHITE }]}>{initials}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: "hidden",
  },
  image: {
    borderRadius: 999,
  },
  initials: {
    backgroundColor: COLORS.CLIENT_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },
})
