"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const SupermarcheStatisticsScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header
        title="Statistics"
        subtitle="View your performance"
        userType="supermarche"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.revenueCard}>
          <Text style={styles.cardTitle}>Today's Revenue</Text>
          <Text style={styles.revenueAmount}>$2,150.75</Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Orders: 35</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Avg Order: $61.45</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Growth: +8%</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Key Metrics</Text>
          {[
            { icon: "shopping-bag", label: "Total Orders", value: "35", color: COLORS.SUPERMARCHE_PRIMARY },
            { icon: "check-circle", label: "Completed", value: "33", color: COLORS.SUCCESS },
            { icon: "inventory-2", label: "Total Products", value: "486", color: COLORS.SUPERMARCHE_PRIMARY },
            { icon: "star", label: "Avg Rating", value: "4.6", color: COLORS.WARNING },
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
            { name: "Organic Milk", quantity: 42, revenue: "$167.58" },
            { name: "Whole Wheat Bread", quantity: 35, revenue: "$104.65" },
            { name: "Fresh Chicken Breast", quantity: 18, revenue: "$161.82" },
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

        <Card style={styles.categoryCard}>
          <Text style={styles.cardTitle}>Sales by Category</Text>
          {[
            { category: "Dairy & Eggs", percentage: 28, amount: "$602.21" },
            { category: "Produce", percentage: 22, amount: "$473.16" },
            { category: "Meat & Fish", percentage: 25, amount: "$537.69" },
            { category: "Bakery", percentage: 15, amount: "$322.61" },
            { category: "Others", percentage: 10, amount: "$215.08" },
          ].map((item, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryAmount}>{item.amount}</Text>
              </View>
              <View style={styles.percentageBar}>
                <View
                  style={[
                    styles.percentageFill,
                    { width: `${item.percentage}%`, backgroundColor: COLORS.SUPERMARCHE_PRIMARY },
                  ]}
                />
              </View>
              <Text style={styles.percentage}>{item.percentage}%</Text>
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
    backgroundColor: COLORS.SUPERMARCHE_PRIMARY,
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
    color: COLORS.SUPERMARCHE_PRIMARY,
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
  categoryCard: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  categoryInfo: {
    width: 120,
  },
  categoryName: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryAmount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  percentageBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.BORDER,
    borderRadius: 3,
    overflow: "hidden",
  },
  percentageFill: {
    height: "100%",
    borderRadius: 3,
  },
  percentage: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    width: 35,
    textAlign: "right",
  },
})
