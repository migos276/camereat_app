import type React from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { COLORS } from "../constants/config"

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
})

export default SplashScreen
