"use client"

import React from "react"
import { useState } from "react"
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"
import { MaterialIcons } from "@expo/vector-icons"
import type { SupermarchéStackParamList } from "../../navigation/SupermarchéNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { productService } from "../../services/product-service"
import type { RootState } from "../../redux/store"

type Props = NativeStackScreenProps<SupermarchéStackParamList, "AddProduct">

interface ProductData {
  name: string
  sku: string
  price: string
  stock: string
  category: string
  description: string
  available: boolean
}

const AddProductScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<ProductData>({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    available: true,
  })
  const [errors, setErrors] = useState<Partial<ProductData>>({})
  const [isLoading, setIsLoading] = useState(false)

  const user = useSelector((state: RootState) => state.auth.user)

  const categories = ["Dairy", "Bakery", "Produce", "Meat", "Frozen", "Beverages", "Snacks", "Household", "Personal Care"]

  const validateForm = () => {
    const newErrors: Partial<ProductData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required"
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price"
    }

    if (!formData.stock.trim()) {
      newErrors.stock = "Stock quantity is required"
    } else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = "Please enter a valid stock quantity"
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

    if (!user?.supermarket_id) {
      Alert.alert("Error", "Supermarket information not found. Please log in again.")
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
        stock: parseInt(formData.stock),
        supermarche: user.supermarket_id.toString(),
        unit: "UNITE",
      }

      await productService.createProduct(productData)

      Alert.alert(
        "Success",
        "Product added successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error: any) {
      console.error("Error creating product:", error)
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to create product. Please try again."
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

  const generateSKU = () => {
    // Generate a simple SKU based on category and random number
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : "PRD"
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const sku = `${prefix}${randomNum}`
    setFormData({ ...formData, sku })
    setErrors({ ...errors, sku: undefined })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.secondary} />
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
            <Text style={styles.label}>SKU *</Text>
            <View style={styles.skuContainer}>
              <TextInput
                style={[styles.input, styles.skuInput, errors.sku && styles.inputError]}
                placeholder="e.g., PRD001"
                value={formData.sku}
                onChangeText={(text) => {
                  setFormData({ ...formData, sku: text.toUpperCase() })
                  setErrors({ ...errors, sku: undefined })
                }}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={[styles.generateButton, isLoading && styles.disabledButton]} 
                onPress={generateSKU}
                disabled={isLoading}
              >
                <MaterialIcons name="auto-fix-high" size={18} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
          </View>

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
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Stock Quantity *</Text>
            <TextInput
              style={[styles.input, errors.stock && styles.inputError]}
              placeholder="0"
              keyboardType="number-pad"
              value={formData.stock}
              onChangeText={(text) => {
                setFormData({ ...formData, stock: text })
                setErrors({ ...errors, stock: undefined })
              }}
              editable={!isLoading}
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
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
  skuContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  skuInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  generateButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderTopRightRadius: SPACING.sm,
    borderBottomRightRadius: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    height: 46,
    justifyContent: "center",
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
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
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
    backgroundColor: COLORS.secondary,
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

