"use client"

import React from "react"
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, RefreshControl } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, ProgressBar } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getEarnings, clearError } from "../../redux/slices/livreurSlice"
import { Alert } from "react-native"

// Define Livreur specific colors
const LIVREUR_COLORS = {
  PRIMARY: "#FF6B35",
  PRIMARY_DARK: "#E55A2B",
  SUCCESS: "#06A77D",
  WARNING: "#F4A261",
  BACKGROUND: "#F7F7F7",
  WHITE: "#FFFFFF",
  TEXT_PRIMARY: "#1F1F1F",
  TEXT_SECONDARY: "#999999",
  CARD: "#FFFFFF",
}

interface DailyBreakdown {
  date: string
  day_name: string
  earnings: number
  deliveries: number
}

interface EarningsData {
  total_earnings_week: number
  total_earnings_month: number
  deliveries_week: number
  bonuses: number
  daily_breakdown: DailyBreakdown[]
  weekly_goal: number
  weekly_goal_progress: number
  average_rating: number
  average_delivery_time: number
  completion_rate: number
}

export const EarningsScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { earnings, isLoading, error } = useAppSelector((state) => state.livreur)

  const loadEarnings = React.useCallback(async () => {
    await dispatch(getEarnings())
  }, [dispatch])

  React.useEffect(() => {
    loadEarnings()
  }, [loadEarnings])

  React.useEffect(() => {
    if (error) {
      const errorMessage = typeof error === 'string' ? error : "Impossible de charger les revenus"
      Alert.alert(
        "Erreur",
        errorMessage,
        [{ text: "OK", onPress: () => dispatch(clearError()) }]
      )
    }
  }, [error, dispatch])

  // Mock data for when no backend data is available
  const mockDailyBreakdown = [
    { day_name: "Monday", earnings: 45.5, deliveries: 4 },
    { day_name: "Tuesday", earnings: 62.0, deliveries: 5 },
    { day_name: "Wednesday", earnings: 58.0, deliveries: 5 },
    { day_name: "Thursday", earnings: 75.5, deliveries: 6 },
    { day_name: "Friday", earnings: 84.5, deliveries: 7 },
    { day_name: "Saturday", earnings: 0, deliveries: 0 },
    { day_name: "Sunday", earnings: 0, deliveries: 0 },
  ]

  // Use backend data or fallback to mock data
  const data = earnings as EarningsData | null
  const dailyBreakdown = data?.daily_breakdown && data.daily_breakdown.length > 0
    ? data.daily_breakdown
    : mockDailyBreakdown

  const totalEarningsWeek = data?.total_earnings_week ?? 425.50
  const deliveriesWeek = data?.deliveries_week ?? 24
  const bonuses = data?.bonuses ?? 5.50
  const weeklyGoal = data?.weekly_goal ?? 25
  const weeklyGoalProgress = data?.weekly_goal_progress ?? 0.96
  const averageRating = data?.average_rating ?? 4.8
  const averageDeliveryTime = data?.average_delivery_time ?? 22
  const completionRate = data?.completion_rate ?? 0.98

  const renderContent = () => {
    if (isLoading && !earnings) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LIVREUR_COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Chargement des revenus...</Text>
        </View>
      )
    }

    return (
      <>
        {/* Total Earnings Card */}
        <Card style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings This Week</Text>
          <Text style={styles.earningsAmount}>
            {totalEarningsWeek.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
          </Text>
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Deliveries: {deliveriesWeek}</Text>
              <Text style={styles.breakdownValue}>
                {(totalEarningsWeek - bonuses).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Bonuses</Text>
              <Text style={styles.breakdownValue}>
                {bonuses.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Weekly Goal Card */}
        <Card style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>Weekly Goal Progress</Text>
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalName}>Complete {weeklyGoal} deliveries</Text>
              <Text style={styles.goalProgress}>{deliveriesWeek} of {weeklyGoal}</Text>
            </View>
            <ProgressBar progress={weeklyGoalProgress} color={LIVREUR_COLORS.PRIMARY} />
          </View>
          {weeklyGoalProgress < 1 ? (
            <View style={styles.goalReward}>
              <MaterialIcons name="star" size={16} color={COLORS.warning} />
              <Text style={styles.goalRewardText}>
                Complete {weeklyGoal - deliveriesWeek} more delivery to earn $10 bonus!
              </Text>
            </View>
          ) : (
            <View style={[styles.goalReward, { backgroundColor: '#D1FAE5' }]}>
              <MaterialIcons name="check-circle" size={16} color={LIVREUR_COLORS.SUCCESS} />
              <Text style={[styles.goalRewardText, { color: LIVREUR_COLORS.SUCCESS }]}>
                Weekly goal achieved! Bonus earned!
              </Text>
            </View>
          )}
        </Card>

        {/* Daily Breakdown Card */}
        <Card style={styles.dailyBreakdownCard}>
          <Text style={styles.breakdownTitle}>Daily Breakdown</Text>
          {dailyBreakdown.map((item, idx) => (
            <View key={idx} style={styles.dayItem}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{item.day_name}</Text>
                <Text style={styles.dayDeliveries}>{item.deliveries} deliveries</Text>
              </View>
              <Text style={[styles.dayEarnings, item.earnings > 0 && { color: LIVREUR_COLORS.SUCCESS }]}>
                {item.earnings.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </Text>
            </View>
          ))}
        </Card>

        {/* Performance Stats Card */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Performance Stats</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={24} color={COLORS.warning} />
              <Text style={styles.statValue}>{averageRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={24} color={LIVREUR_COLORS.PRIMARY} />
              <Text style={styles.statValue}>{averageDeliveryTime} min</Text>
              <Text style={styles.statLabel}>Avg Delivery</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={24} color={LIVREUR_COLORS.SUCCESS} />
              <Text style={styles.statValue}>{(completionRate * 100).toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        </Card>
      </>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title="Earnings"
        subtitle="Track your income"
        onBackPress={() => navigation.goBack()}
        userType="livreur"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading && !!earnings} onRefresh={loadEarnings} />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIVREUR_COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
    marginTop: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  earningsCard: {
    marginBottom: 16,
    backgroundColor: LIVREUR_COLORS.PRIMARY,
  },
  earningsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: TYPOGRAPHY.fontSize["3xl"],
    color: COLORS.white,
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
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.white,
    fontWeight: "700",
  },
  goalsCard: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    marginBottom: 4,
  },
  goalProgress: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
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
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    color: COLORS.dark,
  },
  dailyBreakdownCard: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    marginBottom: 12,
  },
  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  dayInfo: {},
  dayName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  dayDeliveries: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
  },
  dayEarnings: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "700",
    color: LIVREUR_COLORS.TEXT_PRIMARY,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
})

