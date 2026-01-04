"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, ProgressBar } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const EarningsScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header
        title="Earnings"
        subtitle="Track your income"
        onBackPress={() => navigation.goBack()}
        userType="livreur"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings This Week</Text>
          <Text style={styles.earningsAmount}>$425.50</Text>
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Deliveries: 24</Text>
              <Text style={styles.breakdownValue}>$420.00</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Bonuses</Text>
              <Text style={styles.breakdownValue}>$5.50</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>Weekly Goal Progress</Text>
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalName}>Complete 25 deliveries</Text>
              <Text style={styles.goalProgress}>24 of 25</Text>
            </View>
            <ProgressBar progress={0.96} color={COLORS.LIVREUR_PRIMARY} />
          </View>
          <View style={styles.goalReward}>
            <MaterialIcons name="star" size={16} color={COLORS.WARNING} />
            <Text style={styles.goalRewardText}>Complete 1 more delivery to earn $10 bonus!</Text>
          </View>
        </Card>

        <Card style={styles.dailyBreakdownCard}>
          <Text style={styles.breakdownTitle}>Daily Breakdown</Text>
          {[
            { day: "Monday", earnings: 45.5, deliveries: 4 },
            { day: "Tuesday", earnings: 62.0, deliveries: 5 },
            { day: "Wednesday", earnings: 58.0, deliveries: 5 },
            { day: "Thursday", earnings: 75.5, deliveries: 6 },
            { day: "Friday", earnings: 84.5, deliveries: 7 },
            { day: "Saturday", earnings: 0, deliveries: 0 },
            { day: "Sunday", earnings: 0, deliveries: 0 },
          ].map((item, idx) => (
            <View key={idx} style={styles.dayItem}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{item.day}</Text>
                <Text style={styles.dayDeliveries}>{item.deliveries} deliveries</Text>
              </View>
              <Text style={[styles.dayEarnings, item.earnings > 0 && { color: COLORS.SUCCESS }]}>
                ${item.earnings.toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Performance Stats</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={24} color={COLORS.WARNING} />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={24} color={COLORS.LIVREUR_PRIMARY} />
              <Text style={styles.statValue}>22 min</Text>
              <Text style={styles.statLabel}>Avg Delivery</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={24} color={COLORS.SUCCESS} />
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
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
  earningsCard: {
    marginBottom: 16,
    backgroundColor: COLORS.LIVREUR_PRIMARY,
  },
  earningsLabel: {
    ...TYPOGRAPHY.body2,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  earningsAmount: {
    ...TYPOGRAPHY.heading1,
    color: COLORS.WHITE,
    fontWeight: "700",
    marginBottom: 16,
  },
  earningsBreakdown: {
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
    marginBottom: 4,
  },
  breakdownValue: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  goalsCard: {
    marginBottom: 16,
  },
  goalsTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  goalItem: {
    marginBottom: 12,
  },
  goalInfo: {
    marginBottom: 8,
  },
  goalName: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 4,
  },
  goalProgress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  goalReward: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 8,
  },
  goalRewardText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  dailyBreakdownCard: {
    marginBottom: 16,
  },
  breakdownTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  dayInfo: {},
  dayName: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginBottom: 2,
  },
  dayDeliveries: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  dayEarnings: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
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
})
