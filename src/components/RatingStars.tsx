import type React from "react"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS } from "../constants/config"

interface RatingStarsProps {
  rating: number
  onRate?: (rating: number) => void
  size?: number
  editable?: boolean
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating, onRate, size = 20, editable = false }) => {
  const handlePress = (newRating: number) => {
    if (editable && onRate) {
      onRate(newRating)
    }
  }

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => handlePress(star)} disabled={!editable}>
          <MaterialIcons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? COLORS.WARNING : COLORS.TEXT_SECONDARY}
            style={styles.star}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    marginRight: 4,
  },
})
