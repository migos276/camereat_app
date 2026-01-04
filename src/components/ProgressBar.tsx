import type React from "react"
import { View, StyleSheet } from "react-native"
import { COLORS } from "../constants/config"

interface ProgressBarProps {
  progress: number
  height?: number
  color?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8, color = COLORS.CLIENT_PRIMARY }) => {
  const clampedProgress = Math.max(0, Math.min(1, progress))

  return (
    <View style={[styles.container, { height }]}>
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  progress: {
    borderRadius: 4,
  },
})
