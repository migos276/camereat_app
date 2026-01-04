"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Badge } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const RestaurantDashboardScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Dashboard" subtitle="Manage your restaurant" userType="restaurant" rightIcon="notifications" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View>
              <Text style={styles.statusLabel}>Restaurant Status</Text>
              <Badge text="Open" variant="success" />
            </View>
            <TouchableOpacity style={styles.statusToggle}>
              <MaterialIcons name="toggle-on" size={40} color={COLORS.RESTAURANT_PRIMARY} />
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
<MaterialIcons name="shopping-cart" size={28} color={COLORS.RESTAURANT_PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="check-circle" size={28} color={COLORS.SUCCESS} style={styles.statIcon} />
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="trending-up" size={28} color={COLORS.RESTAURANT_PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>$1,240</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="star" size={28} color={COLORS.WARNING} style={styles.statIcon} />
            <Text style={styles.statValue}>4.7</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Card>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.jumpTo("OrdersStack")}>
<MaterialIcons name="shopping-cart" size={24} color={COLORS.WHITE} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>View Pending Orders</Text>
          <Badge text="8" variant="error" />
        </TouchableOpacity>

        <Card style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("MenuStack" as any)}>
            <MaterialIcons name="restaurant-menu" size={20} color={COLORS.RESTAURANT_PRIMARY} />
            <Text style={styles.quickActionText}>Manage Menu</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("OrdersStack" as any)}>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  statusToggle: {
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 16,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.RESTAURANT_PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  buttonIcon: {
    flex: 0,
  },
  buttonText: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.WHITE,
    fontWeight: "700",
    flex: 1,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  quickActionsTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  quickActionText: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    flex: 1,
  },
})
