"use client"

import React from "react"
import { useState } from "react"
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { productService } from "../../services/product-service"
import type { RootState } from "../../redux/store"

type Props = NativeStackScreenProps<RestaurantStackParamList, "AddProduct">

interface MenuItemData {
  name: string
  price: string
  category: string
  description: string
  available: boolean
  unit?: string
}

const AddProductScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<MenuItemData>({
    name: "",
    price: "",
    category: "",
    description: "",
    available: true,
  })
  const [errors, setErrors] = useState<Partial<MenuItemData>>({})
  const [isLoading, setIsLoading] = useState(false)

  const user = useSelector((state: RootState) => state.auth.user)

  const categories = ["Pizzas", "Pasta", "Burgers", "Salads", "Desserts", "Beverages", "Appetizers", "Main Courses", "Sides"]

  const validateForm = () => {
    const newErrors: Partial<MenuItemData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price"
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    // Check if user is authenticated
    if (!user) {
      Alert.alert("Error", "Please log in again.")
      return
    }

    // Check if user has restaurant owner profile - if not, show helpful message
    if (user.user_type !== "RESTAURANT") {
      Alert.alert(
        "Error",
        "You need a restaurant account to add products. Please switch to your restaurant account."
      )
      return
    }

    // Check if user has a restaurant profile (restaurant_id is required)
    if (!user.restaurant_id) {
      Alert.alert(
        "Error",
        "Your restaurant profile is not set up. Please complete your restaurant profile first."
      )
      return
    }

    setIsLoading(true)

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        available: formData.available,
        unit: formData.unit || "UNITE",
        restaurant: user.restaurant_id,
      }

      await productService.createProduct(productData)

      Alert.alert(
        "Success",
        "Product added successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to the menu screen
              navigation.goBack()
            },
          },
        ]
      )
    } catch (error: any) {
      console.error("Error creating product:", error)
      let errorMessage = "Failed to create product. Please try again."
      
      if (error.response?.data) {
        // Format validation errors
        if (typeof error.response.data === 'object') {
          errorMessage = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n')
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
      }
      
      Alert.alert(
        "Error",
        errorMessage
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    Alert.alert(
      "Cancel",
      "Are you sure you want to cancel? Any unsaved changes will be lost.",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Product Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter product name"
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text })
              setErrors({ ...errors, name: undefined })
            }}
            editable={!isLoading}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Price (€) *</Text>
            <TextInput
              style={[styles.input, errors.price && styles.inputError]}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={formData.price}
              onChangeText={(text) => {
                setFormData({ ...formData, price: text })
                setErrors({ ...errors, price: undefined })
              }}
              editable={!isLoading}
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={[styles.input, styles.pickerInput, errors.category && styles.inputError]}
                placeholder="Select category"
                value={formData.category}
                onChangeText={(text) => {
                  setFormData({ ...formData, category: text })
                  setErrors({ ...errors, category: undefined })
                }}
                editable={!isLoading}
              />
              <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.gray} style={styles.pickerIcon} />
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter product description"
            multiline
            numberOfLines={3}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            editable={!isLoading}
          />
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <MaterialIcons
              name={formData.available ? "check-circle" : "cancel"}
              size={24}
              color={formData.available ? COLORS.success : COLORS.danger}
            />
            <Text style={styles.switchLabel}>Availability</Text>
          </View>
          <Switch
            value={formData.available}
            onValueChange={(value) => setFormData({ ...formData, available: value })}
            disabled={isLoading}
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
          />
        </View>

        <Text style={[styles.sectionTitle, styles.marginTop]}>Quick Category Selection</Text>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                formData.category === category && styles.categoryChipActive,
              ]}
              onPress={() => {
                setFormData({ ...formData, category })
                setErrors({ ...errors, category: undefined })
              }}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  formData.category === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.cancelButton, isLoading && styles.disabledButton]} 
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Save Product</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "600" as any,
    color: COLORS.dark,
  },
  formContainer: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as any,
    color: COLORS.gray,
    textTransform: "uppercase",
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500" as any,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    position: "relative",
  },
  pickerInput: {
    paddingRight: SPACING["2xl"],
  },
  pickerIcon: {
    position: "absolute",
    right: SPACING.md,
    top: "50%",
    marginTop: -12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "500" as any,
    color: COLORS.dark,
  },
  marginTop: {
    marginTop: SPACING.md,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.xl,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: "600" as any,
  },
  footer: {
    flexDirection: "row",
    padding: SPACING.md,
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.gray,
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as any,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
})

export default AddProductScreen

