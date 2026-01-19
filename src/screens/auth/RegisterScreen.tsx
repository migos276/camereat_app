"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { CommonActions } from "@react-navigation/native"
import { MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { register } from "../../redux/slices/authSlice"
import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../../constants/config"
import TextInput from "../../components/TextInput"
import { Button } from "../../components/Button"
import { restaurantService } from "../../services/restaurant-service"
import { Picker } from "@react-native-picker/picker"

type Props = NativeStackScreenProps<AuthStackParamList, "Register">

// Cuisine types from backend model
const CUISINE_OPTIONS = [
  { label: "Sélectionner...", value: "" },
  { label: "Africain", value: "AFRICAIN" },
  { label: "Asiatique", value: "ASIATIQUE" },
  { label: "Européen", value: "EUROPEEN" },
  { label: "Fast Food", value: "FAST_FOOD" },
  { label: "Pizza", value: "PIZZA" },
  { label: "Burger", value: "BURGER" },
  { label: "Sushi", value: "SUSHI" },
  { label: "Italien", value: "ITALIEN" },
  { label: "Français", value: "FRANCAIS" },
  { label: "Autre", value: "AUTRE" },
]

// Price level options
const PRICE_LEVEL_OPTIONS = [
  { label: "Budget (€)", value: "€" },
  { label: "Moyen (€€)", value: "€€" },
  { label: "Cher (€€€)", value: "€€€" },
]

// Days of the week
const DAYS_OF_WEEK = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
]

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    // User fields
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    // Restaurant fields
    commercial_name: "",
    legal_name: "",
    description: "",
    rccm_number: "",
    tax_number: "",
    restaurant_license: "",
    cuisine_type: "",
    full_address: "",
    delivery_radius_km: "5",
    avg_preparation_time: "30",
    price_level: "€€",
    base_delivery_fee: "0",
    min_order_amount: "0",
    // Location
    latitude: "",
    longitude: "",
    // Opening hours
    opening_hours_monday_open: "08:00",
    opening_hours_monday_close: "22:00",
    opening_hours_tuesday_open: "08:00",
    opening_hours_tuesday_close: "22:00",
    opening_hours_wednesday_open: "08:00",
    opening_hours_wednesday_close: "22:00",
    opening_hours_thursday_open: "08:00",
    opening_hours_thursday_close: "22:00",
    opening_hours_friday_open: "08:00",
    opening_hours_friday_close: "22:00",
    opening_hours_saturday_open: "08:00",
    opening_hours_saturday_close: "22:00",
    opening_hours_sunday_open: "08:00",
    opening_hours_sunday_close: "22:00",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisteringRestaurant, setIsRegisteringRestaurant] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  const dispatch = useAppDispatch()
  const { error } = useAppSelector((state) => state.auth)

  const userType = route.params?.userType || "client"
  const isRestaurant = userType === "restaurant"

  // Get current location on mount for restaurants
  useEffect(() => {
    if (isRestaurant) {
      getCurrentLocation()
    }
  }, [isRestaurant])

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true)
      setLocationError(null)
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setLocationError("Permission de localisation refusée")
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const { latitude, longitude } = location.coords
      setFormData((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }))
      
      // Try to get address from coordinates
      await getAddressFromCoordinates(latitude, longitude)
      
    } catch (error: any) {
      console.error("Error getting location:", error)
      setLocationError("Impossible d'obtenir la position")
    } finally {
      setLocationLoading(false)
    }
  }

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      if (response.length > 0) {
        const address = response[0]
        const fullAddress = [
          address.streetNumber ? `${address.streetNumber}` : "",
          address.street ? address.street : "",
          address.district ? address.district : "",
          address.city ? address.city : "",
          address.region ? address.region : "",
          address.postalCode ? address.postalCode : "",
          address.country ? address.country : "",
        ]
          .filter(Boolean)
          .join(", ")

        setFormData((prev) => ({
          ...prev,
          full_address: fullAddress || prev.full_address,
        }))
      }
    } catch (error) {
      console.error("Error getting address:", error)
    }
  }

  const handleRegister = async () => {
    if (isRestaurant) {
      await handleRestaurantRegistration()
    } else {
      await handleUserRegistration()
    }
  }

  const handleUserRegistration = async () => {
    console.log("[RegisterScreen] handleRegister appelé pour utilisateur standard")
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = formData

    if (!email || !password || !confirmPassword || !firstName || !lastName || !phoneNumber) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas")
      return
    }

    try {
      console.log("[RegisterScreen] Début de l'inscription...")
      setIsLoading(true)
      
      await dispatch(
        register({
          email,
          password,
          password_confirm: confirmPassword,
          phone: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
        }),
      ).unwrap()
      
      console.log("[RegisterScreen] Inscription réussie!")
      
      // @ts-ignore
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [{ name: "UserTypeSelect" }],
      })
      // @ts-ignore
      navigation.dispatch(resetAction)
    } catch (error: any) {
      console.error("[RegisterScreen] Erreur d'inscription:", error)
      Alert.alert("Erreur", error?.message || error || "Échec de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestaurantRegistration = async () => {
    console.log("[RegisterScreen] handleRestaurantRegistration appelé")
    
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phoneNumber,
      commercial_name,
      cuisine_type,
      latitude,
      longitude,
      full_address,
    } = formData

    // Validate required fields
    if (!email || !password || !confirmPassword || !firstName || !lastName || !phoneNumber) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires (utilisateur)")
      return
    }

    if (!commercial_name) {
      Alert.alert("Erreur", "Veuillez entrer le nom commercial de votre restaurant")
      return
    }

    if (!cuisine_type) {
      Alert.alert("Erreur", "Veuillez sélectionner un type de cuisine")
      return
    }

    if (!latitude || !longitude) {
      Alert.alert("Erreur", "Veuillez obtenir votre position actuelle")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas")
      return
    }

    try {
      setIsLoading(true)
      setIsRegisteringRestaurant(true)
      console.log("[RegisterScreen] Début de l'inscription restaurant...")

      // Step 1: Register user
      await dispatch(
        register({
          email,
          password,
          password_confirm: confirmPassword,
          phone: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
        }),
      ).unwrap()

      console.log("[RegisterScreen] Utilisateur créé avec succès")

      // Step 2: Create restaurant profile
      const opening_hours: Record<string, any> = {}
      DAYS_OF_WEEK.forEach((day) => {
        const openKey = `opening_hours_${day.key}_open`
        const closeKey = `opening_hours_${day.key}_close`
        opening_hours[day.key] = {
          open: formData[openKey as keyof typeof formData],
          close: formData[closeKey as keyof typeof formData],
          closed: false,
        }
      })

      // Round coordinates to 6 decimal places to avoid precision errors
      // max_digits=10, decimal_places=7 means max 10 total digits with 7 after decimal
      const roundedLatitude = formData.latitude 
        ? Math.round(parseFloat(formData.latitude) * 1000000) / 1000000 
        : undefined;
      const roundedLongitude = formData.longitude 
        ? Math.round(parseFloat(formData.longitude) * 1000000) / 1000000 
        : undefined;

      const restaurantData = {
        commercial_name: formData.commercial_name,
        legal_name: formData.legal_name || `${formData.commercial_name} SARL`,
        description: formData.description,
        rccm_number: formData.rccm_number,
        tax_number: formData.tax_number,
        restaurant_license: formData.restaurant_license,
        cuisine_type: formData.cuisine_type,
        full_address: formData.full_address,
        latitude: roundedLatitude,
        longitude: roundedLongitude,
        delivery_radius_km: parseInt(formData.delivery_radius_km) || 5,
        avg_preparation_time: parseInt(formData.avg_preparation_time) || 30,
        opening_hours,
        price_level: formData.price_level,
        base_delivery_fee: parseFloat(formData.base_delivery_fee) || 0,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
      }

      await restaurantService.registerRestaurantProfile(restaurantData)
      console.log("[RegisterScreen] Profil restaurant créé avec succès")

      // Navigate to restaurant dashboard
      // @ts-ignore
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [{ name: "UserTypeSelect" }],
      })
      // @ts-ignore
      navigation.dispatch(resetAction)
      
    } catch (error: any) {
      console.error("[RegisterScreen] Erreur d'inscription restaurant:", error)
      Alert.alert("Erreur", error?.response?.data?.message || error?.message || "Échec de l'inscription")
    } finally {
      setIsLoading(false)
      setIsRegisteringRestaurant(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const renderUserFields = () => (
    <>
      <View style={styles.sectionTitle}>Informations personnelles</View>
      <View style={styles.formCard}>
        <View style={styles.row}>
          <View style={styles.col}>
            <TextInput
              label="Prénom *"
              value={formData.firstName}
              onChangeText={(v) => updateFormData("firstName", v)}
              placeholder="John"
              editable={!isLoading}
            />
          </View>
          <View style={styles.col}>
            <TextInput
              label="Nom *"
              value={formData.lastName}
              onChangeText={(v) => updateFormData("lastName", v)}
              placeholder="Doe"
              editable={!isLoading}
            />
          </View>
        </View>

        <TextInput
          label="Email *"
          value={formData.email}
          onChangeText={(v) => updateFormData("email", v)}
          placeholder="your@email.com"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          label="Téléphone *"
          value={formData.phoneNumber}
          onChangeText={(v) => updateFormData("phoneNumber", v)}
          placeholder="+213 XXX XXX XXX"
          keyboardType="phone-pad"
          editable={!isLoading}
        />

        <TextInput
          label="Mot de passe *"
          value={formData.password}
          onChangeText={(v) => updateFormData("password", v)}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowPassword(!showPassword)}
          editable={!isLoading}
        />

        <TextInput
          label="Confirmer le mot de passe *"
          value={formData.confirmPassword}
          onChangeText={(v) => updateFormData("confirmPassword", v)}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          editable={!isLoading}
        />
      </View>
    </>
  )

  const renderRestaurantFields = () => (
    <>
      {/* Restaurant Information */}
      <View style={styles.sectionTitle}>Informations du Restaurant</View>
      <View style={styles.formCard}>
        <TextInput
          label="Nom commercial *"
          value={formData.commercial_name}
          onChangeText={(v) => updateFormData("commercial_name", v)}
          placeholder="Le Petit Café"
          editable={!isLoading}
        />

        <TextInput
          label="Raison sociale"
          value={formData.legal_name}
          onChangeText={(v) => updateFormData("legal_name", v)}
          placeholder="Le Petit Café SARL"
          editable={!isLoading}
        />

        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(v) => updateFormData("description", v)}
          placeholder="Description de votre restaurant..."
          multiline
          numberOfLines={3}
          editable={!isLoading}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type de cuisine *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.cuisine_type}
              onValueChange={(value) => updateFormData("cuisine_type", value)}
              enabled={!isLoading}
            >
              {CUISINE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Business Details */}
      <View style={styles.sectionTitle}>Informations Juridiques</View>
      <View style={styles.formCard}>
        <TextInput
          label="Numéro RCCM"
          value={formData.rccm_number}
          onChangeText={(v) => updateFormData("rccm_number", v)}
          placeholder="RC: XXX-XX-XXXX"
          editable={!isLoading}
        />

        <TextInput
          label="Numéro Fiscal"
          value={formData.tax_number}
          onChangeText={(v) => updateFormData("tax_number", v)}
          placeholder="NIF: XXXXXXXXX"
          editable={!isLoading}
        />

        <TextInput
          label="License Restaurant"
          value={formData.restaurant_license}
          onChangeText={(v) => updateFormData("restaurant_license", v)}
          placeholder="License number"
          editable={!isLoading}
        />
      </View>

      {/* Location */}
      <View style={styles.sectionTitle}>Emplacement</View>
      <View style={styles.formCard}>
        <Text style={styles.label}>Position *</Text>
        
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={locationLoading || isLoading}
        >
          <MaterialIcons
            name={locationLoading ? "hourglass-empty" : "my-location"}
            size={20}
            color={COLORS.white}
          />
          <Text style={styles.locationButtonText}>
            {locationLoading ? "Récupération de la position..." : "Utiliser ma position actuelle"}
          </Text>
        </TouchableOpacity>

        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}

        {formData.latitude && formData.longitude && (
          <Text style={styles.coordinatesText}>
            Position: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
          </Text>
        )}

        <TextInput
          label="Adresse complète"
          value={formData.full_address}
          onChangeText={(v) => updateFormData("full_address", v)}
          placeholder="Adresse complète..."
          multiline
          numberOfLines={2}
          editable={!isLoading}
        />

        <TextInput
          label="Rayon de livraison (km)"
          value={formData.delivery_radius_km}
          onChangeText={(v) => updateFormData("delivery_radius_km", v)}
          placeholder="5"
          keyboardType="number-pad"
          editable={!isLoading}
        />
      </View>

      {/* Opening Hours */}
      <View style={styles.sectionTitle}>Heures d'ouverture</View>
      <View style={styles.formCard}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day.key} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Ouverture</Text>
                <TextInput
                  value={formData[`opening_hours_${day.key}_open` as keyof typeof formData] as string}
                  onChangeText={(v) => updateFormData(`opening_hours_${day.key}_open`, v)}
                  placeholder="08:00"
                  editable={!isLoading}
                />
              </View>
              <MaterialIcons name="arrow-forward" size={16} color={COLORS.gray} />
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Fermeture</Text>
                <TextInput
                  value={formData[`opening_hours_${day.key}_close` as keyof typeof formData] as string}
                  onChangeText={(v) => updateFormData(`opening_hours_${day.key}_close`, v)}
                  placeholder="22:00"
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Business Settings */}
      <View style={styles.sectionTitle}>Paramètres</View>
      <View style={styles.formCard}>
        <TextInput
          label="Temps de préparation moyen (minutes)"
          value={formData.avg_preparation_time}
          onChangeText={(v) => updateFormData("avg_preparation_time", v)}
          placeholder="30"
          keyboardType="number-pad"
          editable={!isLoading}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Niveau de prix</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.price_level}
              onValueChange={(value) => updateFormData("price_level", value)}
              enabled={!isLoading}
            >
              {PRICE_LEVEL_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        <TextInput
          label="Frais de livraison de base"
          value={formData.base_delivery_fee}
          onChangeText={(v) => updateFormData("base_delivery_fee", v)}
          placeholder="0"
          keyboardType="number-pad"
          editable={!isLoading}
        />

        <TextInput
          label="Montant minimum de commande"
          value={formData.min_order_amount}
          onChangeText={(v) => updateFormData("min_order_amount", v)}
          placeholder="0"
          keyboardType="number-pad"
          editable={!isLoading}
        />
      </View>
    </>
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isRestaurant ? "Inscription Restaurant" : "Créer un compte"}
          </Text>
          <Text style={styles.subtitle}>
            {isRestaurant
              ? "Enregistrez votre restaurant sur notre plateforme"
              : "Rejoignez notre plateforme de livraison"}
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* User Fields - Always shown */}
          {renderUserFields()}

          {/* Restaurant Fields - Only for restaurants */}
          {isRestaurant && renderRestaurantFields()}

          <Button
            title={
              isLoading
                ? isRegisteringRestaurant
                  ? "Création du profil..."
                  : "Création du compte..."
                : isRestaurant
                ? "S'inscrire en tant que Restaurant"
                : "Créer mon compte"
            }
            onPress={handleRegister}
            disabled={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login" as const)}>
            <Text style={styles.signinLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING["2xl"],
  },
  header: {
    marginBottom: SPACING["2xl"],
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as const,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    textAlign: "center",
  },
  form: {
    marginBottom: SPACING["2xl"],
  },
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as const,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    textTransform: "uppercase",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500" as const,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  pickerContainer: {
    backgroundColor: COLORS.light,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: "hidden",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    gap: SPACING.sm,
  },
  locationButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FFE6E6",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dayLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500" as const,
    color: COLORS.dark,
    width: 80,
  },
  timeRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray,
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  signinLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600" as const,
  },
})

export default RegisterScreen

