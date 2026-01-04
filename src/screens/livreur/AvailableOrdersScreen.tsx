"use client"

import React, { useEffect, useCallback } from "react"
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card } from "../../components"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getAvailableDeliveries, clearError, acceptDelivery } from "../../redux/slices/livreurSlice"
import type { Delivery } from "../../types"

// Define Livreur specific colors
const LIVREUR_COLORS = {
  PRIMARY: "#FF6B35",
  PRIMARY_DARK: "#E55A2B",
  SECONDARY: "#004E89",
  SUCCESS: "#06A77D",
  WARNING: "#F4A261",
  DANGER: "#E76F51",
  BACKGROUND: "#F7F7F7",
  WHITE: "#FFFFFF",
  TEXT_PRIMARY: "#1F1F1F",
  TEXT_SECONDARY: "#999999",
  CARD: "#FFFFFF",
  GRAY: "#E0E0E0",
}

interface DeliveryOrder {
  id: string
  restaurant_name: string
  distance: string
  estimated_pay: number
  pickup_time: string
  delivery_time: string
  item_count: number
  status: string
  client_name?: string
  client_address?: string
  restaurant_address?: string
}

export const AvailableOrdersScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { availableDeliveries, isLoading, error } = useAppSelector((state) => state.livreur)

  const loadDeliveries = useCallback(async () => {
    const result = await dispatch(getAvailableDeliveries())
    if (getAvailableDeliveries.rejected.match(result)) {
      // Error is already stored in state, will be handled by useEffect
    }
  }, [dispatch])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  useEffect(() => {
    if (error) {
      handleError(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleError = (errorData: any) => {
    const detail = errorData?.detail || "Une erreur est survenue"
    const code = errorData?.code || errorData?.error

    switch (code) {
      case "PROFILE_NOT_FOUND":
        Alert.alert(
          "Profil incomplet",
          detail,
          [
            {
              text: "Compléter le profil",
              onPress: () => navigation.navigate("LivreurProfile"),
            },
            { text: "Annuler", style: "cancel" },
          ]
        )
        break

      case "PENDING_APPROVAL":
        Alert.alert(
          "En attente d'approbation",
          detail + "\n\nStatut: EN_ATTENTE",
          [{ text: "OK" }]
        )
        break

      case "REJECTED":
        Alert.alert(
          "Compte rejeté",
          detail + "\n\nVeuillez contacter le support pour plus d'informations.",
          [{ text: "OK" }]
        )
        break

      case "ACCOUNT_INACTIVE":
        Alert.alert(
          "Compte désactivé",
          detail,
          [{ text: "OK" }]
        )
        break

      case "NOT_LIVREUR":
        Alert.alert(
          "Accès refusé",
          detail,
          [{ text: "OK" }]
        )
        break

      default:
        Alert.alert(
          "Erreur",
          detail,
          [{ text: "Réessayer", onPress: () => loadDeliveries() }, { text: "OK" }]
        )
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await dispatch(acceptDelivery(orderId)).unwrap()
      Alert.alert(
        "Commande acceptée",
        "La commande a été ajoutée à vos livraisons actives.",
        [{ text: "OK", onPress: () => navigation.navigate("ActiveDelivery", { orderId }) }]
      )
    } catch (err: any) {
      Alert.alert(
        "Erreur",
        err?.detail || "Impossible d'accepter cette commande"
      )
    }
  }

  const renderOrder = ({ item }: { item: any }) => {
    const distance = item.distance || "N/A"
    const pay = item.estimated_pay || item.amount || 0
    const pickupTime = item.pickup_time || "N/A"
    const deliveryTime = item.delivery_time || "N/A"
    const itemCount = item.item_count || 0

    // Get restaurant name from different possible fields
    const restaurantName = item.restaurant_name || item.restaurant?.name || "Restaurant"

    return (
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderTitle}>
            <Text style={styles.restaurantName}>{restaurantName}</Text>
            <View style={styles.orderMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={14} color={LIVREUR_COLORS.PRIMARY} />
                <Text style={styles.metaText}>{distance}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="shopping-cart" size={14} color={LIVREUR_COLORS.PRIMARY} />
                <Text style={styles.metaText}>{itemCount} articles</Text>
              </View>
            </View>
          </View>
          <View style={styles.payBadge}>
            <Text style={styles.payAmount}>{pay.toFixed(2)} XOF</Text>
          </View>
        </View>

        {item.client_name && (
          <View style={styles.clientInfo}>
            <MaterialIcons name="person" size={14} color={LIVREUR_COLORS.TEXT_SECONDARY} />
            <Text style={styles.clientText}>{item.client_name}</Text>
          </View>
        )}

        <View style={styles.timeInfo}>
          <View style={styles.timeInfoItem}>
            <MaterialIcons name="schedule" size={16} color={LIVREUR_COLORS.TEXT_SECONDARY} />
            <Text style={styles.timeInfoText}>Retrait: {pickupTime}</Text>
          </View>
          <View style={styles.timeInfoItem}>
            <MaterialIcons name="timer" size={16} color={LIVREUR_COLORS.TEXT_SECONDARY} />
            <Text style={styles.timeInfoText}>Livraison: {deliveryTime}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(item.id)}
        >
          <MaterialIcons name="check" size={20} color={LIVREUR_COLORS.WHITE} />
          <Text style={styles.acceptButtonText}>Accepter la commande</Text>
        </TouchableOpacity>
      </Card>
    )
  }

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={LIVREUR_COLORS.PRIMARY} />
          <Text style={styles.emptyText}>Chargement des commandes...</Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="local-shipping" size={64} color={LIVREUR_COLORS.TEXT_SECONDARY} />
        <Text style={styles.emptyTitle}>Aucune commande disponible</Text>
        <Text style={styles.emptyText}>
          Aucune commande n'est disponible pour le moment dans votre zone de couverture.
        </Text>
        <Text style={styles.emptySubtext}>
          Vérifiez que votre position GPS est activée et que vous êtes en ligne.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDeliveries}>
          <MaterialIcons name="refresh" size={20} color={LIVREUR_COLORS.WHITE} />
          <Text style={styles.refreshButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title="Commandes disponibles"
        onBackPress={() => navigation.goBack()}
        userType="livreur"
      />

      <FlatList
        data={availableDeliveries as any[]}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadDeliveries} />
        }
        ListEmptyComponent={renderEmptyState()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIVREUR_COLORS.BACKGROUND,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING["2xl"],
  },
  orderCard: {
    marginBottom: SPACING.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  orderTitle: {
    flex: 1,
  },
  restaurantName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
    color: LIVREUR_COLORS.TEXT_PRIMARY,
  },
  orderMeta: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
  },
  payBadge: {
    backgroundColor: LIVREUR_COLORS.PRIMARY,
    borderRadius: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  payAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: LIVREUR_COLORS.WHITE,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  clientText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
  },
  timeInfo: {
    flexDirection: "row",
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  timeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  timeInfoText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIVREUR_COLORS.PRIMARY,
    borderRadius: SPACING.sm,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  acceptButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: LIVREUR_COLORS.WHITE,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING["2xl"],
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: SPACING.lg,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIVREUR_COLORS.PRIMARY,
    borderRadius: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  refreshButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: LIVREUR_COLORS.WHITE,
  },
})

