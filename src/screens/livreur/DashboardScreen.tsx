"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Badge } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const DashboardScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Dashboard" subtitle="Ready to deliver" userType="livreur" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View>
              <Text style={styles.statusLabel}>Your Status</Text>
              <Badge text="Online" variant="success" />
            </View>
            <TouchableOpacity style={styles.statusToggle}>
              <MaterialIcons name="toggle-on" size={40} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
<MaterialIcons name="shopping-cart" size={32} color={COLORS.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Deliveries Today</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="attach-money" size={32} color={COLORS.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>$84.50</Text>
            <Text style={styles.statLabel}>Earned Today</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="star" size={32} color={COLORS.warning} style={styles.statIcon} />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Your Rating</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialIcons name="timer" size={32} color={COLORS.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>25</Text>
            <Text style={styles.statLabel}>Minutes AVG</Text>
          </Card>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("AvailableOrders")}>
          <MaterialIcons name="local-shipping" size={24} color={COLORS.white} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Available Orders</Text>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Card style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickAction}>
            <MaterialIcons name="history" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <MaterialIcons name="trending-up" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>View Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <MaterialIcons name="description" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Documents Status</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.secondary,
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
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "400",
    color: COLORS.secondary,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
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
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.white,
    fontWeight: "700",
    flex: 1,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    flex: 1,
  },
})
