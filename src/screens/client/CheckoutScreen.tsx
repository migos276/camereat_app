"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, TextInput } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { orderService } from "../../services/order-service"
import { useSelector } from "react-redux"
import type { RootState } from "../../redux/store"

const PAYMENT_METHODS = [
  {
    id: "ORANGE_MONEY",
    label: "Orange Money",
    subLabel: "Paiement mobile",
    icon: "phone-android",
    color: "#FF6600",
    textColor: "#FFFFFF",
  },
  {
    id: "MTN_MONEY",
    label: "MTN MoMo",
    subLabel: "Paiement mobile",
    icon: "phone-android",
    color: "#FFCC00",
    textColor: "#000000",
  },
  {
    id: "ESPECES",
    label: "Espèces",
    subLabel: "Paiement à la livraison",
    icon: "money",
    color: COLORS.BORDER,
    textColor: COLORS.TEXT_PRIMARY,
  },
]

export const CheckoutScreen: React.FC<any> = ({ navigation, route }) => {
  const [selectedPayment, setSelectedPayment] = useState("ORANGE_MONEY")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Get cart data from Redux
  const cart = useSelector((state: RootState) => state.cart)

  // Calculate totals - cart items have product property
  const subtotal = cart?.items?.reduce((sum: number, item: any) => {
    return sum + ((item.product?.price || 0) * item.quantity)
  }, 0) || 0
  const deliveryFee = cart?.restaurant?.base_delivery_fee || cart?.restaurant?.delivery_fee || 2500
  const total = subtotal + deliveryFee

  // Map payment method to backend format
  const getPaymentMode = () => {
    if (selectedPayment === "ORANGE_MONEY" || selectedPayment === "MTN_MONEY") {
      return "MOBILE_MONEY"
    }
    return selectedPayment
  }

  // Get operator based on payment method
  const getOperator = () => {
    if (selectedPayment === "ORANGE_MONEY") {
      return "ORANGE"
    }
    if (selectedPayment === "MTN_MONEY") {
      return "MTN"
    }
    return null
  }

  // Check if mobile money is selected
  const isMobileMoney = () => {
    return selectedPayment === "ORANGE_MONEY" || selectedPayment === "MTN_MONEY"
  }

  // Get phone input color based on selected method
  const getPhoneInputColor = () => {
    if (selectedPayment === "ORANGE_MONEY") {
      return "#FF6600"
    }
    if (selectedPayment === "MTN_MONEY") {
      return "#FFCC00"
    }
    return COLORS.BORDER
  }

  // Get icon color for mobile money
  const getPhoneIconColor = () => {
    if (selectedPayment === "ORANGE_MONEY") {
      return "#FF6600"
    }
    if (selectedPayment === "MTN_MONEY") {
      return "#FFCC00"
    }
    return COLORS.TEXT_SECONDARY
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '')
    // Check if it's a valid Cameroon number (starts with 237 or 6)
    return /^237[6-9]\d{7}$/.test(cleaned) || /^6\d{8}$/.test(cleaned)
  }

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[\s-]/g, '')
    if (cleaned.startsWith('6') && cleaned.length === 9) {
      cleaned = '237' + cleaned
    }
    return cleaned
  }

  const handlePlaceOrder = async () => {
    setPaymentError(null)

    // Validate phone number for mobile money
    if (isMobileMoney()) {
      if (!phoneNumber.trim()) {
        Alert.alert("Erreur", "Veuillez entrer votre numéro de téléphone mobile money")
        return
      }
      if (!validatePhoneNumber(phoneNumber)) {
        Alert.alert("Erreur", "Veuillez entrer un numéro valide (ex: 6XXXXXXXX)")
        return
      }
    }

    setIsLoading(true)

    try {
      // Prepare order data - handle potential undefined values
      const restaurantId = cart?.restaurant?.id || cart?.selectedRestaurantId
      const supermarketId = cart?.supermarket?.id || cart?.selectedSupermarketId
      
      // Validate we have required data
      if (!restaurantId && !supermarketId) {
        Alert.alert("Erreur", "Aucun restaurant ou supermarché sélectionné")
        return
      }
      
      if (!cart?.items?.length) {
        Alert.alert("Erreur", "Votre panier est vide")
        return
      }

      const orderData: any = {
        items: cart.items.map((item: any) => ({
          product_id: String(item.product?.id),
          quantity: item.quantity
        })),
        payment_mode: getPaymentMode(),
        payment_phone: isMobileMoney() ? formatPhoneNumber(phoneNumber) : undefined,
        total_amount: total,
        special_instructions: specialInstructions,
        delivery_address_text: [
          cart?.deliveryAddress?.street,
          cart?.deliveryAddress?.city,
          cart?.deliveryAddress?.country || "Cameroun",
        ]
          .filter(Boolean)
          .join(", "),
      }
      
      // Add either restaurant_id or supermarket_id
      if (restaurantId) {
        orderData.restaurant_id = restaurantId
      }
      if (supermarketId) {
        orderData.supermarket_id = supermarketId
      }
      
      // Add delivery address if available
      if (cart?.deliveryAddress?.id) {
        orderData.delivery_address_id = cart.deliveryAddress.id
      }

      console.log("Creating order with data:", orderData)

      const order = await orderService.createOrder(orderData)
      
      console.log("Order created:", order)

      if (order) {
        setOrderId(order.id)

        // If mobile money payment, check payment status
        if (isMobileMoney() && order.campay_reference) {
          // Start polling for payment status
          startPaymentStatusCheck(order.id, order.campay_reference)
        } else if (isMobileMoney()) {
          // Order created but no campay reference - show info and allow manual check
          Alert.alert(
            "Commande créée",
            "Votre commande a été créée. En l'absence de confirmation de paiement, veuillez compléter le paiement USSD et vérifier le statut dans le suivi de commande.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("OrderTracking", { orderId: order.id })
              }
            ]
          )
        } else {
          // For cash payment, navigate directly
          Alert.alert(
            "Commande confirmée",
            "Votre commande a été passée avec succès!",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("OrderTracking", { orderId: order.id })
              }
            ]
          )
        }
      }
    } catch (error: any) {
      console.error("Order creation error:", error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.response?.data?.non_field_errors?.[0] ||
                          "Erreur lors de la création de la commande"
      setPaymentError(errorMessage)
      Alert.alert("Erreur", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const startPaymentStatusCheck = async (orderId: string, campayReference?: string) => {
    setIsCheckingPayment(true)
    let attempts = 0
    const maxAttempts = 15 // Increased from 10 to 15 attempts (45 seconds total)

    const checkPayment = async () => {
      try {
        const status = await orderService.checkPaymentStatus(orderId)
        console.log("Payment status:", status)

        // Check both payment_status and order_payment_status for compatibility
        const paymentStatus = status.payment_status || status.status
        const orderPaymentStatus = status.order_payment_status

        if (paymentStatus === "SUCCESSFUL" || orderPaymentStatus === "PAYE") {
          setIsCheckingPayment(false)
          Alert.alert(
            "Paiement réussi",
            "Votre paiement a été confirmé!",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("OrderTracking", { orderId })
              }
            ]
          )
        } else if (paymentStatus === "FAILED") {
          setIsCheckingPayment(false)
          Alert.alert(
            "Paiement échoué",
            "Le paiement a échoué. Veuillez réessayer ou payer en espèces.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Optionally navigate back or show payment options
                }
              }
            ]
          )
        } else if (attempts < maxAttempts) {
          attempts++
          // Show progress message
          console.log(`Payment check attempt ${attempts}/${maxAttempts}: Status = ${paymentStatus}`)
          setTimeout(checkPayment, 3000) // Check every 3 seconds
        } else {
          setIsCheckingPayment(false)
          Alert.alert(
            "En attente de confirmation",
            "Le paiement est en cours de vérification. Vous pouvez vérifier le statut dans le suivi de commande. Veuillez compléter le paiement USSD sur votre téléphone.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("OrderTracking", { orderId })
              }
            ]
          )
        }
      } catch (error: any) {
        console.error("Payment check error:", error)
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkPayment, 3000)
        } else {
          setIsCheckingPayment(false)
          Alert.alert(
            "Suivi du paiement",
            "Impossible de vérifier le statut du paiement. Votre commande a été créée. Veuillez vérifier le statut plus tard.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("OrderTracking", { orderId })
              }
            ]
          )
        }
      }
    }

    // Start checking after a short delay to give user time to respond to USSD
    setTimeout(checkPayment, 2000)
  }

  return (
    <View style={styles.container}>
      <Header title="Checkout" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          </View>
          <Card style={styles.addressCard}>
            <Text style={styles.addressTitle}>
              {cart?.deliveryAddress?.label || "Domicile"}
            </Text>
            <Text style={styles.addressText}>
              {cart?.deliveryAddress?.street || "123 Rue Principale"}, {" "}
              {cart?.deliveryAddress?.city || "Yaoundé"}, {"Cameroun"}
            </Text>
          </Card>
          <TouchableOpacity style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Changer l'adresse</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Heure de livraison</Text>
          </View>
          <View style={styles.timeOptions}>
            <TouchableOpacity style={[styles.timeOption, styles.timeOptionSelected]}>
              <Text style={styles.timeOptionText}>Dès que possible (25-35 min)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeOption}>
              <Text style={styles.timeOptionText}>Planifier plus tard</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Payment Methods */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Moyen de paiement</Text>
          </View>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedPayment === method.id
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    {
                      backgroundColor: isSelected ? method.color : COLORS.BACKGROUND,
                      borderColor: isSelected ? method.color : COLORS.BORDER,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <MaterialIcons
                    name={method.icon as any}
                    size={24}
                    color={isSelected ? method.textColor : COLORS.TEXT_SECONDARY}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: isSelected ? method.textColor : COLORS.TEXT_SECONDARY },
                    ]}
                  >
                    {method.label}
                  </Text>
                  <Text
                    style={[
                      styles.paymentMethodSubText,
                      { color: isSelected ? method.textColor : COLORS.TEXT_SECONDARY },
                    ]}
                  >
                    {method.subLabel}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={18} color={method.textColor} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Phone number input for mobile money */}
          {isMobileMoney() && (
            <View style={styles.campayInfo}>
              <MaterialIcons name="info" size={16} color={getPhoneIconColor()} />
              <Text style={styles.campayInfoText}>
                Paiement sécurisé via CamPay. Vous recevrez une demande de paiement sur votre téléphone.
              </Text>
            </View>
          )}

          {isMobileMoney() && (
            <View style={styles.phoneInputContainer}>
              <MaterialIcons
                name="phone"
                size={18}
                color={getPhoneIconColor()}
              />
              <TextInput
                placeholder={selectedPayment === "ORANGE_MONEY" ? "Numéro Orange Money (ex: 6XXXXXXXX)" : "Numéro MTN MoMo (ex: 6XXXXXXXX)"}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={[
                  styles.phoneInput,
                  {
                    borderColor: getPhoneInputColor(),
                  },
                ]}
              />
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="note" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Instructions spéciales</Text>
          </View>
          <TextInput 
            placeholder="Ajouter des notes de livraison..." 
            multiline 
            numberOfLines={3}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <Text style={styles.summaryValue}>{deliveryFee.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} FCFA</Text>
          </View>
        </Card>

        {paymentError && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={20} color={COLORS.DANGER} />
            <Text style={styles.errorText}>{paymentError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={
            isLoading || isCheckingPayment
              ? isMobileMoney()
                ? isCheckingPayment
                  ? "Vérification du paiement..."
                  : "Traitement en cours..."
                : "Traitement en cours..."
              : `Commander • ${total.toLocaleString()}FCFA`
          }
          onPress={handlePlaceOrder}
          color={COLORS.CLIENT_PRIMARY}
          disabled={isLoading || isCheckingPayment}
        />
        {(isLoading || isCheckingPayment) && (
          <ActivityIndicator size="small" color={COLORS.WHITE} style={styles.loader} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  addressCard: {
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  addressTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  changeButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CLIENT_PRIMARY,
    borderRadius: 8,
  },
  changeButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.CLIENT_PRIMARY,
    fontWeight: "600",
  },
  timeOptions: {
    gap: 8,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    alignItems: "center",
  },
  timeOptionSelected: {
    backgroundColor: COLORS.CLIENT_PRIMARY,
    borderColor: COLORS.CLIENT_PRIMARY,
  },
  timeOptionText: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  paymentMethod: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    position: "relative",
  },
  paymentMethodText: {
    ...TYPOGRAPHY.body2,
    fontWeight: "700",
    textAlign: "center",
  },
  paymentMethodSubText: {
    fontSize: 10,
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  campayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3E8FF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  campayInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#6B4EFF",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 12,
  },
  totalLabel: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  totalValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.CLIENT_PRIMARY,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
  loader: {
    position: "absolute",
    right: 20,
    top: "50%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: COLORS.DANGER,
    fontSize: 14,
  },
})
