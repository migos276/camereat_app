import * as React from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, TextInput } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { userService } from "../../services/user-service"
import type { Address } from "../../types"

interface AddAddressScreenProps {
  navigation: any
  route?: {
    params?: {
      address?: Address
    }
  }
}

const LABELS = ["Maison", "Bureau", "Appartement", "Autre"]

export const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ navigation, route }) => {
  const isEditing = route?.params?.address !== undefined
  const existingAddress = route?.params?.address

  const [label, setLabel] = React.useState(existingAddress?.label || "")
  const [street, setStreet] = React.useState(existingAddress?.street || "")
  const [neighborhood, setNeighborhood] = React.useState(existingAddress?.neighborhood || "")
  const [city, setCity] = React.useState(existingAddress?.city || "")
  const [postalCode, setPostalCode] = React.useState(existingAddress?.postal_code || "")
  const [country, setCountry] = React.useState(existingAddress?.country || "Cameroun")
  const [deliveryInstructions, setDeliveryInstructions] = React.useState(
    existingAddress?.delivery_instructions || ""
  )
  const [isMain, setIsMain] = React.useState(existingAddress?.is_main || false)

  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!label.trim()) {
      newErrors.label = "Label is required"
    }

    if (!street.trim()) {
      newErrors.street = "Street address is required"
    }

    if (!city.trim()) {
      newErrors.city = "City is required"
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = "Postal code is required"
    }

    if (!country.trim()) {
      newErrors.country = "Country is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const addressData = {
        label: label.trim(),
        street: street.trim(),
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        delivery_instructions: deliveryInstructions.trim() || undefined,
        is_main: isMain,
      }

      if (isEditing && existingAddress) {
        await userService.updateAddress(existingAddress.id, addressData)
        Alert.alert("Success", "Address updated successfully")
      } else {
        await userService.createAddress(addressData)
        Alert.alert("Success", "Address added successfully")
      }

      navigation.goBack()
    } catch (error) {
      console.error("Error saving address:", error)
      Alert.alert("Error", "Failed to save address. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? "Edit Address" : "Add Address"}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Address Label</Text>
          <View style={styles.labelContainer}>
            {LABELS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.labelChip, label === item && styles.labelChipSelected]}
                onPress={() => setLabel(item)}
              >
                <Text style={[styles.labelText, label === item && styles.labelTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            placeholder="Or enter custom label"
            value={label}
            onChangeText={setLabel}
            error={errors.label}
          />
          {errors.label && <Text style={styles.errorText}>{errors.label}</Text>}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>

          <TextInput
            label="Street Address"
            placeholder="Enter street address"
            value={street}
            onChangeText={setStreet}
            error={errors.street}
          />

          <TextInput
            label="Neighborhood (Optional)"
            placeholder="Enter neighborhood"
            value={neighborhood}
            onChangeText={setNeighborhood}
          />

          <TextInput
            label="City"
            placeholder="Enter city"
            value={city}
            onChangeText={setCity}
            error={errors.city}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Postal Code"
                placeholder="Enter postal code"
                value={postalCode}
                onChangeText={setPostalCode}
                error={errors.postalCode}
              />
            </View>
            <View style={styles.halfWidth}>
              <TextInput
                label="Country"
                placeholder="Enter country"
                value={country}
                onChangeText={setCountry}
                error={errors.country}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
          <TextInput
            placeholder="E.g., Ring the doorbell, leave at door..."
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity
            style={styles.mainToggle}
            onPress={() => setIsMain(!isMain)}
          >
            <View style={styles.mainToggleInfo}>
              <MaterialIcons
                name={isMain ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.mainToggleText}>Set as main address</Text>
            </View>
            <Text style={styles.mainToggleSubtext}>
              This will be your default delivery address
            </Text>
          </TouchableOpacity>
        </Card>

        <Button
          title={isEditing ? "Update Address" : "Save Address"}
          onPress={handleSubmit}
          color={COLORS.primary}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 12,
    color: COLORS.dark,
  },
  labelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  labelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  labelChipSelected: {
    backgroundColor: COLORS.primary,
  },
  labelText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  labelTextSelected: {
    color: COLORS.white,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  mainToggle: {
    flexDirection: "column",
    gap: 4,
  },
  mainToggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainToggleText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  mainToggleSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    marginLeft: 32,
  },
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.danger,
    marginTop: 4,
  },
})

