import type React from "react"
import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { COLORS, TYPOGRAPHY } from "../constants/config"

interface ChipProps {
  label: string
  onPress?: () => void
  selected?: boolean
  color?: string
}

export const Chip: React.FC<ChipProps> = ({ label, onPress, selected = false, color = COLORS.CLIENT_PRIMARY }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? color : COLORS.BACKGROUND,
          borderColor: selected ? color : COLORS.BORDER,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? COLORS.WHITE : COLORS.TEXT_PRIMARY,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
})
