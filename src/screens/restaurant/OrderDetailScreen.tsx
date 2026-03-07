"use client"

import React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { MaterialIcons } from "@expo/vector-icons"
import type { RestaurantStackParamList } from "../../navigation/RestaurantNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { restaurantService } from "../../services/restaurant-service"

type Props = NativeStackScreenProps<RestaurantStackParamList, "OrderDetail">

interface OrderItem {
  id: string | number
  name: string
  quantity: number
  price: number
  notes?: string
}

interface RestaurantOrderDetail {
  id: string | number
  numero?: string
  status?: string
  client_name?: string
  delivery_address_text?: string
  estimated_duration_minutes?: number
  products_amount?: number | string
  delivery_fee?: number | string
  total_amount?: number | string
  payment_phone?: string
  special_instructions?: string
  date_created?: string
  items?: Array<{
    id?: string | number
    quantity?: number
    unit_price?: number | string
    line_total?: number | string
    special_instructions?: string
    produit?: {
      name?: string
      product_name?: string
    }
  }>
}

const OrderDetailScreen: React.FC<Props> = ({ route }) => {
  const { id } = route.params
  const [order, setOrder] = useState<RestaurantOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [startingPreparing, setStartingPreparing] = useState(false)
  const [markingReady, setMarkingReady] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const orders = await restaurantService.getOrders()
      const target = orders.find((o: any) => String(o?.id) === String(id) || String(o?.numero) === String(id))
      if (!target) {
        setError("Commande introuvable.")
        setOrder(null)
        return
      }
      setOrder(target as RestaurantOrderDetail)
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement de la commande.")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleAcceptOrder = async () => {
    if (!order?.id) return
    
    Alert.alert(
      "Accepter la commande",
      "Voulez-vous vraiment accepter cette commande ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Accepter",
          onPress: async () => {
            try {
              setAccepting(true)
              const updatedOrder = await restaurantService.acceptOrder(String(order.id))
              setOrder(updatedOrder as RestaurantOrderDetail)
              Alert.alert("Succès", "La commande a été acceptée.")
            } catch (err: any) {
              Alert.alert("Erreur", err?.response?.data?.error || "Impossible d'accepter la commande.")
            } finally {
              setAccepting(false)
            }
          }
        }
      ]
    )
  }

  const handleStartPreparing = async () => {
    if (!order?.id) return
    
    Alert.alert(
      "Commencer la préparation",
      "Voulez-vous vraiment commencer la préparation de cette commande ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              setStartingPreparing(true)
              const updatedOrder = await restaurantService.startOrderPreparation(String(order.id))
              setOrder(updatedOrder as RestaurantOrderDetail)
              Alert.alert("Succès", "La préparation de la commande a commencé.")
            } catch (err: any) {
              Alert.alert("Erreur", err?.response?.data?.error || "Impossible de commencer la préparation.")
            } finally {
              setStartingPreparing(false)
            }
          }
        }
      ]
    )
  }

  const handleMarkAsReady = async () => {
    if (!order?.id) return
    
    Alert.alert(
      "Marquer comme prête",
      "Voulez-vous vraiment marquer cette commande comme prête ? Elle sera alors visible par les livreurs.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              setMarkingReady(true)
              const updatedOrder = await restaurantService.markOrderAsReady(String(order.id))
              setOrder(updatedOrder as RestaurantOrderDetail)
              Alert.alert("Succès", "La commande a été marquée comme prête.")
            } catch (err: any) {
              Alert.alert("Erreur", err?.response?.data?.error || "Impossible de marquer la commande comme prête.")
            } finally {
              setMarkingReady(false)
            }
          }
        }
      ]
    )
  }

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return COLORS.warning
      case "ACCEPTEE":
        return COLORS.primary
      case "EN_PREPARATION":
        return COLORS.secondary
      case "PRETE":
        return COLORS.success
      case "LIVREE":
        return COLORS.gray
      case "ANNULEE":
      case "REFUSEE":
        return COLORS.danger
      default:
        return COLORS.gray
    }
  }

  const getStatusLabel = (status?: string) => {
    const statusMap: Record<string, string> = {
      EN_ATTENTE: "En attente",
      ACCEPTEE: "Acceptée",
      EN_PREPARATION: "En préparation",
      PRETE: "Prête",
      LIVREUR_ASSIGNE: "Livreur assigné",
      EN_ROUTE_COLLECTE: "En route collecte",
      COLLECTEE: "Collectée",
      EN_LIVRAISON: "En livraison",
      LIVREE: "Livrée",
      ANNULEE: "Annulée",
      REFUSEE: "Refusée",
    }
    return status ? (statusMap[status] || status) : "Inconnu"
  }

  const formatAmount = (value: number | string | undefined) => Number(value || 0).toFixed(2)

  const orderItems = useMemo<OrderItem[]>(() => {
    if (!order?.items || !Array.isArray(order.items)) {
      return []
    }
    return order.items.map((item, index) => {
      const quantity = Number(item?.quantity || 0)
      const unitPrice = Number(item?.unit_price || 0)
      const lineTotal = Number(item?.line_total || unitPrice * quantity)
      return {
        id: item?.id ?? index,
        name: item?.produit?.name || item?.produit?.product_name || "Produit",
        quantity,
        price: lineTotal / (quantity || 1),
        notes: item?.special_instructions || undefined,
      }
    })
  }, [order])

  const renderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemQuantity}>{item.quantity}x</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
      </View>
      <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} FCFA</Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Chargement de la commande...</Text>
      </View>
    )
  }

  if (!order || error) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={42} color={COLORS.danger} />
        <Text style={styles.centerText}>{error || "Commande indisponible."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrder}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const status = order.status || "EN_ATTENTE"
  const subtotal = Number(order.products_amount || 0)
  const deliveryFee = Number(order.delivery_fee || 0)
  const total = Number(order.total_amount || 0)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>Commande #{order.numero || order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderTime}>
          {order.date_created ? new Date(order.date_created).toLocaleString() : "Date inconnue"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations client</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.client_name || "Client non renseigné"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.payment_phone || "Non renseigné"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.delivery_address_text || "Adresse non renseignée"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles commandés</Text>
        <View style={styles.infoCard}>
          <FlatList
            data={orderItems}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.infoText}>Aucun article disponible</Text>}
          />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{formatAmount(subtotal)} FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Frais de livraison</Text>
            <Text style={styles.totalValue}>{formatAmount(deliveryFee)} FCFA</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatAmount(total)} FCFA</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails supplémentaires</Text>
        <View style={styles.infoCard}>
          <Text style={styles.totalLabel}>Temps estimé: {order.estimated_duration_minutes || 0} min</Text>
          {order.special_instructions ? (
            <Text style={[styles.totalLabel, { marginTop: SPACING.xs }]}>Note: {order.special_instructions}</Text>
          ) : null}
        </View>
      </View>

      {/* Action buttons based on order status */}
      {/* Bouton Accepter - affiché uniquement pour les commandes EN_ATTENTE */}
      {status === "EN_ATTENTE" && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, accepting && styles.actionButtonDisabled]}
            onPress={handleAcceptOrder}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Accepter la commande</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton Commencer préparation - affiché uniquement pour les commandes ACCEPTEE */}
      {status === "ACCEPTEE" && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.preparingButton, startingPreparing && styles.actionButtonDisabled]}
            onPress={handleStartPreparing}
            disabled={startingPreparing}
          >
            {startingPreparing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="outdoor-grill" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Commencer la préparation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton Marquer comme prête - affiché uniquement pour les commandes EN_PREPARATION */}
      {status === "EN_PREPARATION" && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.readyButton, markingReady && styles.actionButtonDisabled]}
            onPress={handleMarkAsReady}
            disabled={markingReady}
          >
            {markingReady ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Marquer comme prête</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg, backgroundColor: COLORS.light },
  centerText: { marginTop: SPACING.sm, color: COLORS.dark, textAlign: "center" },
  retryButton: { marginTop: SPACING.md, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: SPACING.sm },
  retryButtonText: { color: COLORS.white, fontWeight: "600" as any },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, paddingTop: SPACING["2xl"] },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "bold" as any, color: COLORS.white },
  orderTime: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: SPACING.xs },
  statusText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.gray, marginBottom: SPACING.sm, textTransform: "uppercase" },
  infoCard: { backgroundColor: COLORS.white, borderRadius: SPACING.sm, padding: SPACING.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  infoText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "500" as any, color: COLORS.dark },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  itemQuantity: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" as any, color: COLORS.primary, width: 30 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  itemNotes: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.gray, fontStyle: "italic" },
  itemPrice: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" as any, color: COLORS.dark },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.xs },
  totalLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray },
  totalValue: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.dark },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  grandTotalLabel: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any, color: COLORS.dark },
  grandTotalValue: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "bold" as any, color: COLORS.primary },
  actionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: SPACING.sm, gap: SPACING.sm },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any },
  acceptButton: { backgroundColor: COLORS.primary },
  preparingButton: { backgroundColor: COLORS.secondary },
  readyButton: { backgroundColor: COLORS.success },
  readyButtonDisabled: { opacity: 0.6 },
  readyButtonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: "600" as any },
})

export default OrderDetailScreen
