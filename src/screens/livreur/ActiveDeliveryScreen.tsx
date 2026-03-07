"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, ProgressBar } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { updateDeliveryStatus } from "../../redux/slices/livreurSlice"

export const ActiveDeliveryScreen: React.FC<any> = ({ navigation, route }) => {
  const dispatch = useAppDispatch()
  const { activeDelivery, isLoading } = useAppSelector((state) => state.livreur)
  const deliveryId = route.params?.id

  const getProgress = () => {
    if (!activeDelivery) return 0
    switch (activeDelivery.status) {
      case "accepted":
        return 0.2
      case "picked_up":
        return 0.6
      case "at_delivery_location":
        return 0.8
      case "delivered":
        return 1
      default:
        return 0
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await dispatch(updateDeliveryStatus({ id: activeDelivery!.id, status: newStatus })).unwrap()
      if (newStatus === "delivered") {
        Alert.alert("Success", "Delivery completed successfully!", [
          { text: "OK", onPress: () => navigation.navigate("LivreurHome") },
        ])
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update delivery status")
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
        <Text style={{ ...TYPOGRAPHY.heading3, marginTop: 16, textAlign: "center" }}>No active delivery found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title="Active Delivery"
        subtitle={`Order #${activeDelivery.order_id || activeDelivery.id.slice(0, 8)}`}
        onBackPress={() => navigation.goBack()}
        userType="livreur"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.restaurantCard}>
          <View style={styles.restaurantHeader}>
            <View style={styles.restaurantAvatar}>
              <MaterialIcons name="restaurant" size={32} color={COLORS.WHITE} />
            </View>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{activeDelivery.restaurant?.name || "Restaurant"}</Text>
              <Text style={styles.restaurantAddress}>{activeDelivery.pickup_address || "Pickup Address"}</Text>
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
              { label: "Pickup", done: activeDelivery.status !== "accepted" },
              {
                label: "Transit",
                done: activeDelivery.status === "at_delivery_location" || activeDelivery.status === "delivered",
              },
              { label: "Delivery", done: activeDelivery.status === "delivered" },
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
          {activeDelivery.status === "accepted" && (
            <>
              <Text style={styles.actionTitle}>Next Step: Pickup Order</Text>
              <Text style={styles.actionDesc}>Arrive at the restaurant and pick up the order</Text>
              <Button
                title="Order Picked Up"
                color={COLORS.LIVREUR_PRIMARY}
                onPress={() => handleUpdateStatus("picked_up")}
              />
            </>
          )}
          {activeDelivery.status === "picked_up" && (
            <>
              <Text style={styles.actionTitle}>Next Step: Delivering</Text>
              <Text style={styles.actionDesc}>Head to the customer's location</Text>
              <Button
                title="Arrived at Location"
                color={COLORS.LIVREUR_PRIMARY}
                onPress={() => handleUpdateStatus("at_delivery_location")}
              />
            </>
          )}
          {activeDelivery.status === "at_delivery_location" && (
            <>
              <Text style={styles.actionTitle}>Next Step: Hand over</Text>
              <Text style={styles.actionDesc}>Complete the delivery to the customer</Text>
              <Button title="Confirm Delivery" color={COLORS.SUCCESS} onPress={() => handleUpdateStatus("delivered")} />
            </>
          )}
        </Card>

        <Card style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>{activeDelivery.customer?.initials || "JD"}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{activeDelivery.customer?.name || "John Doe"}</Text>
              <Text style={styles.customerPhone}>{activeDelivery.customer?.phone || "+1 (555) 123-4567"}</Text>
            </View>
            {activeDelivery.customer?.phone && (
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
              <Text style={styles.addressText}>
                {activeDelivery.delivery_address || "123 Main Street, New York, NY 10001"}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.orderItemsCard}>
          <Text style={styles.orderItemsTitle}>Order Items</Text>
          {activeDelivery.items.map((item, idx) => (
            <View key={idx} style={styles.orderItem}>
              <View style={styles.orderItemQty}>
                <Text style={styles.orderItemQtyText}>x{item.qty}</Text>
              </View>
              <Text style={styles.orderItemName}>{item.name}</Text>
            </View>
          ))}
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
})
