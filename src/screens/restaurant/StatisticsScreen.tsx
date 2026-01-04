"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const RestaurantStatisticsScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header
        title="Statistics"
        subtitle="View your performance"
        userType="restaurant"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.revenueCard}>
          <Text style={styles.cardTitle}>Today's Revenue</Text>
          <Text style={styles.revenueAmount}>$1,240.50</Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Orders: 42</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Avg Order: $29.54</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Growth: +12%</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Key Metrics</Text>
          {[
{ icon: "shopping-cart", label: "Total Orders", value: "42", color: COLORS.RESTAURANT_PRIMARY },
            { icon: "check-circle", label: "Completed", value: "40", color: COLORS.SUCCESS },
            { icon: "schedule", label: "Avg Prep Time", value: "18 min", color: COLORS.WARNING },
            { icon: "star", label: "Avg Rating", value: "4.7", color: COLORS.WARNING },
          ].map((metric, idx) => (
            <View key={idx} style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <View style={[styles.metricIcon, { backgroundColor: metric.color }]}>
                  <MaterialIcons name={metric.icon as any} size={20} color={COLORS.WHITE} />
                </View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.topProductsCard}>
          <Text style={styles.cardTitle}>Top Selling Products</Text>
          {[
            { name: "Margherita Pizza", quantity: 28, revenue: "$363.72" },
            { name: "Carbonara Pasta", quantity: 22, revenue: "$329.78" },
            { name: "Pepperoni Pizza", quantity: 18, revenue: "$269.82" },
          ].map((product, idx) => (
            <View key={idx} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productRank}>#{idx + 1}</Text>
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productQty}>{product.quantity} sold</Text>
                </View>
              </View>
              <Text style={styles.productRevenue}>{product.revenue}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.hoursCard}>
          <Text style={styles.cardTitle}>Peak Hours</Text>
          {[
            { hour: "12:00 PM - 1:00 PM", orders: 8, busy: true },
            { hour: "1:00 PM - 2:00 PM", orders: 12, busy: true },
            { hour: "6:00 PM - 7:00 PM", orders: 15, busy: true },
            { hour: "7:00 PM - 8:00 PM", orders: 10, busy: false },
          ].map((slot, idx) => (
            <View key={idx} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{slot.hour}</Text>
              <View style={styles.orderBars}>
                {[...Array(slot.orders / 3)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.orderBar,
                      { backgroundColor: slot.busy ? COLORS.RESTAURANT_PRIMARY : COLORS.BORDER },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.orderCount}>{slot.orders} orders</Text>
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
  revenueCard: {
    marginBottom: 16,
    backgroundColor: COLORS.RESTAURANT_PRIMARY,
  },
  cardTitle: {
    ...TYPOGRAPHY.body1,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  revenueAmount: {
    ...TYPOGRAPHY.heading1,
    color: COLORS.WHITE,
    fontWeight: "700",
    marginBottom: 16,
  },
  revenueBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  breakdownItem: {
    alignItems: "center",
  },
  breakdownLabel: {
    ...TYPOGRAPHY.caption,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsCard: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  metricLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  metricLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  metricValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  topProductsCard: {
    marginBottom: 16,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  productRank: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.RESTAURANT_PRIMARY,
  },
  productDetails: {},
  productName: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 2,
  },
  productQty: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  productRevenue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  hoursCard: {
    marginBottom: 16,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  hourLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    width: 100,
  },
  orderBars: {
    flexDirection: "row",
    gap: 2,
    flex: 1,
  },
  orderBar: {
    flex: 1,
    height: 20,
    borderRadius: 4,
  },
  orderCount: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    width: 60,
    textAlign: "right",
  },
})
