"use client"

import React from "react"
import { useState } from "react"
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, Image, Platform } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"
import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
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
  image?: {
    uri: string
    name: string
    type: string
  }
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
  const [imageUri, setImageUri] = useState<string | null>(null)

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

    // Image is required for restaurants
    if (!formData.image) {
      newErrors.image = "Product image is required" as any
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos')
      return
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      const uri = asset.uri
      setImageUri(uri)

      // Extract filename from URI
      const filename = uri.split('/').pop() || 'product-image.jpg'
      
      // Determine mime type
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      // Store image info for upload
      setFormData({ 
        ...formData, 
        image: {
          uri: uri,
          name: filename,
          type: type
        }
      })
      setErrors({ ...errors, image: undefined })
    }
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

    // Check if user has restaurant owner profile
    if (user.user_type !== "RESTAURANT") {
      Alert.alert(
        "Error",
        "You need a restaurant account to add products. Please switch to your restaurant account."
      )
      return
    }

    // Check if user has a restaurant profile
    if (!user.restaurant_id) {
      Alert.alert(
        "Error",
        "Your restaurant profile is not set up. Please complete your restaurant profile first."
      )
      return
    }

    setIsLoading(true)

    try {
      // Create FormData
      const formDataToSend = new FormData()
      
      // Append text fields
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('price', formData.price)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('available', formData.available.toString())
      formDataToSend.append('unit', formData.unit || 'UNITE')
      formDataToSend.append('restaurant', user.restaurant_id.toString())

      // Append image
      if (formData.image) {
        const imageData: any = {
          uri: Platform.OS === 'ios' ? formData.image.uri.replace('file://', '') : formData.image.uri,
          type: formData.image.type,
          name: formData.image.name,
        }
        formDataToSend.append('image', imageData)
      }

      await productService.createProduct(formDataToSend)

      Alert.alert(
        "Success",
        "Product added successfully!",
        [
          {
            text: "OK",
            onPress: () => {
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
      
      Alert.alert("Error", errorMessage)
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Image *</Text>
          <TouchableOpacity
            style={[styles.imagePicker, (errors as any).image && styles.inputError]}
            onPress={pickImage}
            disabled={isLoading}
          >
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <MaterialIcons name="edit" size={24} color={COLORS.white} />
                  <Text style={styles.imageOverlayText}>Change Image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-photo-alternate" size={48} color={COLORS.gray} />
                <Text style={styles.imagePlaceholderText}>Tap to add product image</Text>
              </View>
            )}
          </TouchableOpacity>
          {(errors as any).image && <Text style={styles.errorText}>{(errors as any).image}</Text>}
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
  imagePicker: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SPACING.sm,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  imagePreviewContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: SPACING.sm,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  imageOverlayText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as any,
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  imagePlaceholderText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: "center",
  },
})

export default AddProductScreen