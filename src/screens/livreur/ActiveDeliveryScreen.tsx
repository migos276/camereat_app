"use client"

import React, { useCallback, useEffect } from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, ProgressBar } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getActiveDelivery, updateDeliveryStatus } from "../../redux/slices/livreurSlice"

export const ActiveDeliveryScreen: React.FC<any> = ({ navigation, route }) => {
  const dispatch = useAppDispatch()
  const { activeDelivery, isLoading } = useAppSelector((state) => state.livreur)
  const deliveryId = route.params?.id

  const toNumber = (value: unknown, fallback = 0): number => {
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const toMoney = (value: unknown): string => `${toNumber(value).toFixed(2)} FCFA`

  const formatDateTime = (value: unknown): string => {
    if (!value || typeof value !== "string") return "N/A"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "N/A"
    return date.toLocaleString("fr-FR")
  }

  const formatDeliveryPreference = (value: unknown): string => {
    if (value === "PLANIFIEE") return "Planifiee"
    if (value === "DES_QUE_PRETE") return "Des que prete"
    return "N/A"
  }

  const getClientName = (delivery: any): string =>
    delivery?.client_name || delivery?.customer?.name || "Client"

  const getClientPhone = (delivery: any): string =>
    delivery?.client_phone || delivery?.customer?.phone || "N/A"

  const getClientInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "CL"
    return `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
  }

  const getDeliveryAddress = (delivery: any): string => {
    const rawAddress =
      delivery?.client_delivery_address ||
      delivery?.delivery_address_text ||
      delivery?.delivery_address ||
      delivery?.customer?.address
    if (!rawAddress) return "Adresse non disponible"
    if (typeof rawAddress === "string") return rawAddress
    if (typeof rawAddress === "object") return rawAddress.street || rawAddress.label || rawAddress.address || "Adresse non disponible"
    return "Adresse non disponible"
  }

  const loadActiveDelivery = useCallback(async () => {
    await dispatch(getActiveDelivery())
  }, [dispatch])

  useEffect(() => {
    loadActiveDelivery()
  }, [loadActiveDelivery, deliveryId])

  const getProgress = () => {
    if (!activeDelivery) return 0
    switch (activeDelivery.status) {
      case "LIVREUR_ASSIGNE":
        return 0.3
      case "EN_ROUTE_COLLECTE":
      case "COLLECTEE":
        return 0.8
      case "EN_LIVRAISON":
        return 0.9
      case "LIVREE":
        return 1
      default:
        return 0
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeDelivery?.id) return
    try {
      await dispatch(updateDeliveryStatus({ id: activeDelivery.id, status: newStatus })).unwrap()
      if (newStatus === "LIVREE" || newStatus.toLowerCase() === "delivered") {
        Alert.alert("Succès", "Livraison marquée comme effectuée.", [
          { text: "OK", onPress: () => navigation.navigate("LivreurHome") },
        ])
      }
    } catch (error: any) {
      Alert.alert("Erreur", error?.detail || "Impossible de mettre à jour le statut de livraison.")
    }
  }

  if (isLoading && !activeDelivery) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!activeDelivery) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.gray} />
        <Text style={{ ...TYPOGRAPHY.heading3, marginTop: 16, textAlign: "center" }}>Aucune livraison active trouvée</Text>
        <Button title="Actualiser" onPress={loadActiveDelivery} style={{ marginTop: 24 }} />
      </View>
    )
  }

  const data = activeDelivery as any
  const deliveryRef = data.numero || String(activeDelivery.id || "").slice(0, 8)
  const clientName = getClientName(activeDelivery)
  const clientPhone = getClientPhone(activeDelivery)
  const clientInitials = getClientInitials(clientName)
  const deliveryAddress = getDeliveryAddress(activeDelivery)
  const restaurantName = data.restaurant_name || activeDelivery.restaurant?.name || "Restaurant"
  const pickupAddress = data.restaurant_address || data.pickup_address || "Point de retrait non renseigne"
  const distanceText = `${toNumber(data.distance_km ?? data.distance, 0).toFixed(2)} km`
  const etaText = `${toNumber(data.estimated_duration_minutes ?? data.estimatedTime, 0)} min`
  const items = Array.isArray(data.items) ? data.items : []

  return (
    <View style={styles.container}>
      <Header
        title="Active Delivery"
        subtitle={`Order #${deliveryRef}`}
        onBackPress={() => navigation.goBack()}
        userType="livreur"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadActiveDelivery} />}
      >
        <Card style={styles.restaurantCard}>
          <View style={styles.restaurantHeader}>
            <View style={styles.restaurantAvatar}>
              <MaterialIcons name="restaurant" size={32} color={COLORS.WHITE} />
            </View>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurantName}</Text>
              <Text style={styles.restaurantAddress}>{pickupAddress}</Text>
            </View>
            {activeDelivery.restaurant?.phone && (
              <TouchableOpacity>
                <MaterialIcons name="call" size={24} color={COLORS.LIVREUR_PRIMARY} />
              </TouchableOpacity>
            )}
          </View>
        </Card>

        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>Delivery Progress</Text>
          <ProgressBar progress={getProgress()} color={COLORS.LIVREUR_PRIMARY} />
          <View style={styles.progressSteps}>
            {[
              { label: "Pickup", done: activeDelivery.status !== "LIVREUR_ASSIGNE" },
              {
                label: "Transit",
                done: activeDelivery.status === "EN_ROUTE_COLLECTE" || activeDelivery.status === "COLLECTEE" || activeDelivery.status === "EN_LIVRAISON" || activeDelivery.status === "LIVREE",
              },
              { label: "Delivery", done: activeDelivery.status === "LIVREE" },
            ].map((step, idx) => (
              <View key={idx} style={styles.progressStep}>
                <View
                  style={[styles.progressStepDot, { backgroundColor: step.done ? COLORS.SUCCESS : COLORS.BORDER }]}
                />
                <Text style={[styles.progressStepLabel, step.done && { fontWeight: "700" }]}>{step.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.actionCard}>
          {activeDelivery.status !== "LIVREE" && (
            <>
              <Text style={styles.actionTitle}>Finaliser la commande</Text>
              <Text style={styles.actionDesc}>Confirmez que la commande a bien été livrée au client</Text>
              <Button title="Confirmer la livraison" color={COLORS.SUCCESS} onPress={() => handleUpdateStatus("LIVREE")} />
            </>
          )}
        </Card>

        <Card style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>{clientInitials}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{clientName}</Text>
              <Text style={styles.customerPhone}>{clientPhone}</Text>
            </View>
            {clientPhone !== "N/A" && (
              <TouchableOpacity>
                <MaterialIcons name="call" size={24} color={COLORS.LIVREUR_PRIMARY} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.deliveryAddressSection}>
            <MaterialIcons name="location-on" size={20} color={COLORS.LIVREUR_PRIMARY} />
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Delivery Address</Text>
              <Text style={styles.addressText}>{deliveryAddress}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.orderItemsCard}>
          <Text style={styles.orderItemsTitle}>Articles</Text>
          {items.map((item, idx) => (
            <View key={idx} style={styles.orderItem}>
              <View style={styles.orderItemQty}>
                <Text style={styles.orderItemQtyText}>x{(item as any).quantity || (item as any).qty || 1}</Text>
              </View>
              <Text style={styles.orderItemName}>{(item as any).produit?.name || (item as any).name || "Article"}</Text>
              <Text style={styles.orderItemPrice}>{toMoney((item as any).line_total)}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.orderItemsCard}>
          <Text style={styles.orderItemsTitle}>Infos Livraison</Text>
          <View style={styles.orderItem}>
            <MaterialIcons name="map" size={20} color={COLORS.LIVREUR_PRIMARY} />
            <Text style={styles.orderItemName}>{distanceText}</Text>
          </View>
          <View style={styles.orderItem}>
            <MaterialIcons name="schedule" size={20} color={COLORS.LIVREUR_PRIMARY} />
            <Text style={styles.orderItemName}>{etaText}</Text>
          </View>
          <View style={styles.orderItem}>
            <MaterialIcons name="event" size={20} color={COLORS.LIVREUR_PRIMARY} />
            <Text style={styles.orderItemName}>Preference: {formatDeliveryPreference(data.delivery_preference)}</Text>
          </View>
          <View style={styles.orderItem}>
            <MaterialIcons name="event-available" size={20} color={COLORS.LIVREUR_PRIMARY} />
            <Text style={styles.orderItemName}>Planifiee: {formatDateTime(data.requested_delivery_time)}</Text>
          </View>
        </Card>

        <Card style={styles.orderItemsCard}>
          <Text style={styles.orderItemsTitle}>Montants</Text>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Produits</Text>
            <Text style={styles.orderItemPrice}>{toMoney(data.products_amount)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Frais livraison</Text>
            <Text style={styles.orderItemPrice}>{toMoney(data.delivery_fee)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Commission plateforme</Text>
            <Text style={styles.orderItemPrice}>{toMoney(data.platform_commission)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Total</Text>
            <Text style={styles.orderItemPrice}>{toMoney(data.total_amount)}</Text>
          </View>
        </Card>

        <Card style={styles.orderItemsCard}>
          <Text style={styles.orderItemsTitle}>Paiement</Text>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Mode: {data.payment_mode || "N/A"}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Statut: {data.payment_status || "N/A"}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Telephone: {data.payment_phone || "N/A"}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Reference: {data.campay_reference || "N/A"}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Operateur: {data.operator || "N/A"}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>USSD: {data.ussd_code || "N/A"}</Text>
          </View>
        </Card>

        <Card style={styles.orderItemsCard}>
          <Text style={styles.orderItemsTitle}>Dates et Notes</Text>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Creee: {formatDateTime(data.date_created || data.order_hour)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Acceptee: {formatDateTime(data.date_accepted)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Livree: {formatDateTime(data.date_delivered)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>Instructions: {data.special_instructions || "Aucune"}</Text>
          </View>
        </Card>
      </ScrollView>
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
    paddingBottom: 32,
  },
  restaurantCard: {
    marginBottom: 12,
  },
  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  restaurantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.LIVREUR_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    marginBottom: 2,
  },
  restaurantAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  progressCard: {
    marginBottom: 12,
  },
  progressTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  progressStep: {
    alignItems: "center",
    gap: 4,
  },
  progressStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressStepLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  actionCard: {
    marginBottom: 12,
    backgroundColor: "#EFF6FF",
  },
  actionTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionDesc: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  customerCard: {
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.LIVREUR_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  customerInitials: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    marginBottom: 2,
  },
  customerPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginBottom: 12,
  },
  deliveryAddressSection: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  orderItemsCard: {
    marginBottom: 16,
  },
  orderItemsTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  orderItemQty: {
    backgroundColor: COLORS.BACKGROUND,
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  orderItemQtyText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  orderItemName: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    flex: 1,
  },
  orderItemPrice: {
    ...TYPOGRAPHY.body2,
    fontWeight: "700",
    color: COLORS.LIVREUR_PRIMARY,
  },
})
