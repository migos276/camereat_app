"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const OrderTrackingScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Order #12345" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIcon, { backgroundColor: COLORS.CLIENT_PRIMARY }]}>
              <MaterialIcons name="check-circle" size={32} color={COLORS.WHITE} />
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Order Confirmed</Text>
              <Text style={styles.statusTime}>2 minutes ago</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.progressCard}>
          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: COLORS.SUCCESS }]} />
            <View style={styles.progressContent}>
              <Text style={styles.progressLabel}>Order Confirmed</Text>
              <Text style={styles.progressTime}>2:15 PM</Text>
            </View>
            <MaterialIcons name="check" size={20} color={COLORS.SUCCESS} />
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: COLORS.CLIENT_PRIMARY }]} />
            <View style={styles.progressContent}>
              <Text style={styles.progressLabel}>Restaurant Preparing</Text>
              <Text style={styles.progressTime}>In progress...</Text>
            </View>
            <View style={styles.progressSpinner} />
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: COLORS.BORDER }]} />
            <View style={styles.progressContent}>
              <Text style={styles.progressLabel}>Out for Delivery</Text>
              <Text style={styles.progressTime}>Waiting...</Text>
            </View>
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: COLORS.BORDER }]} />
            <View style={styles.progressContent}>
              <Text style={styles.progressLabel}>Delivered</Text>
              <Text style={styles.progressTime}>Waiting...</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.deliveryCard}>
          <Text style={styles.deliveryTitle}>Estimated Delivery</Text>
          <Text style={styles.deliveryTime}>2:40 PM - 2:50 PM</Text>
          <View style={styles.divider} />
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryDetail}>
              <MaterialIcons name="location-on" size={20} color={COLORS.CLIENT_PRIMARY} />
              <View style={styles.deliveryDetailContent}>
                <Text style={styles.deliveryLabel}>Delivery Location</Text>
                <Text style={styles.deliveryValue}>123 Main Street</Text>
              </View>
            </View>
            <View style={styles.deliveryDetail}>
              <MaterialIcons name="directions-car" size={20} color={COLORS.CLIENT_PRIMARY} />
              <View style={styles.deliveryDetailContent}>
                <Text style={styles.deliveryLabel}>Distance</Text>
                <Text style={styles.deliveryValue}>3.2 km away</Text>
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.driverCard}>
          <Text style={styles.driverTitle}>Your Delivery Driver</Text>
          <View style={styles.driverContent}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>JD</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>John Doe</Text>
              <View style={styles.driverRating}>
                <MaterialIcons name="star" size={14} color={COLORS.WARNING} />
                <Text style={styles.driverRatingText}>4.8 (245 reviews)</Text>
              </View>
            </View>
            <MaterialIcons name="call" size={24} color={COLORS.CLIENT_PRIMARY} />
          </View>
        </Card>

        <Card style={styles.orderCard}>
          <Text style={styles.orderTitle}>Order Items</Text>
          {[
            { name: "Margherita Pizza", qty: 1, price: 12.99 },
            { name: "Carbonara Pasta", qty: 2, price: 29.98 },
          ].map((item, idx) => (
            <View key={idx} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQtyPrice}>
                x{item.qty} • ${item.price.toFixed(2)}
              </Text>
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
  statusCard: {
    marginBottom: 16,
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.CLIENT_PRIMARY,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    marginBottom: 2,
  },
  statusTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressContent: {
    flex: 1,
  },
  progressLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 2,
  },
  progressTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  progressSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.CLIENT_PRIMARY,
    borderTopColor: "transparent",
  },
  progressLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.BORDER,
    marginLeft: 5,
    marginVertical: 4,
  },
  deliveryCard: {
    marginBottom: 16,
  },
  deliveryTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 4,
  },
  deliveryTime: {
    ...TYPOGRAPHY.heading2,
    fontWeight: "700",
    color: COLORS.CLIENT_PRIMARY,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginBottom: 12,
  },
  deliveryInfo: {
    gap: 12,
  },
  deliveryDetail: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  deliveryDetailContent: {
    flex: 1,
  },
  deliveryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  deliveryValue: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
  },
  driverCard: {
    marginBottom: 16,
  },
  driverTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  driverContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.CLIENT_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  driverInitials: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 2,
  },
  driverRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverRatingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  itemQtyPrice: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
})
