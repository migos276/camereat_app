import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../../constants/config"
import { Button } from "../../components/Button"

type Props = NativeStackScreenProps<AuthStackParamList, "UserTypeSelect">

interface UserTypeOption {
  id: string
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  description: string
}

const userTypes: UserTypeOption[] = [
  { id: "client", label: "Customer", icon: "cart", description: "Order food and groceries" },
  { id: "restaurant", label: "Restaurant", icon: "silverware-fork-knife", description: "Manage your restaurant" },
  { id: "supermarket", label: "Supermarket", icon: "store", description: "Manage your supermarket" },
  { id: "livreur", label: "Delivery Driver", icon: "bike", description: "Start delivering" },
]

const UserTypeSelectScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Join Our Platform</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
      </View>

      <View style={styles.userTypes}>
        {userTypes.map((userType) => (
          <TouchableOpacity
            key={userType.id}
            style={styles.userTypeCard}
            onPress={() => navigation.navigate("Register" as const, { userType: userType.id })}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={userType.icon} size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.userTypeLabel}>{userType.label}</Text>
            <Text style={styles.userTypeDescription}>{userType.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Button title="Sign In" onPress={() => navigation.navigate("Login" as const)} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  header: {
    marginBottom: SPACING["3xl"],
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as const,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  userTypes: {
    marginBottom: SPACING["2xl"],
  },
  userTypeCard: {
    backgroundColor: COLORS.light,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  userTypeLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600" as const,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  userTypeDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    textAlign: "center",
  },
  footer: {
    marginTop: SPACING["2xl"],
  },
  footerText: {
    textAlign: "center",
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
})

export default UserTypeSelectScreen
