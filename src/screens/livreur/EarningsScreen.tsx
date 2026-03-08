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

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getNumberFromCandidates = (source: any, paths: string[], fallback = 0): number => {
  if (!source) return fallback

  for (const path of paths) {
    const value = path.split(".").reduce<any>((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source)
    const parsed = toNumber(value, Number.NaN)
    if (Number.isFinite(parsed)) return parsed
  }

  return fallback
}

const formatFcfa = (value: number): string =>
  `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} FCFA`

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

  const rawData = earnings as any
  const data = (rawData?.data ?? rawData ?? null) as EarningsData | null

  const totalEarningsWeek = getNumberFromCandidates(data, [
    "total_earnings_week",
    "weekly_earnings",
    "earnings_week",
    "week_total",
    "total_earnings",
  ])
  const deliveriesWeek = getNumberFromCandidates(data, [
    "deliveries_week",
    "weekly_deliveries",
    "deliveries_count_week",
    "deliveries_count",
  ])
  const bonuses = getNumberFromCandidates(data, ["bonuses", "bonus", "weekly_bonus"])
  const weeklyGoal = getNumberFromCandidates(data, ["weekly_goal", "goal_deliveries_week", "deliveries_goal_week"], 25)
  const rawWeeklyGoalProgress = getNumberFromCandidates(data, ["weekly_goal_progress", "goal_progress", "progress"], Number.NaN)
  const computedGoalProgress = weeklyGoal > 0 ? deliveriesWeek / weeklyGoal : 0
  const weeklyGoalProgress = Math.min(1, Math.max(0, Number.isFinite(rawWeeklyGoalProgress) ? rawWeeklyGoalProgress : computedGoalProgress))
  const averageRating = getNumberFromCandidates(data, ["average_rating", "rating_average", "avg_rating"])
  const averageDeliveryTime = getNumberFromCandidates(data, ["average_delivery_time", "avg_delivery_time", "delivery_time_average"])
  const rawCompletionRate = getNumberFromCandidates(data, ["completion_rate", "delivery_completion_rate", "rate_completion"])
  const completionRate = rawCompletionRate > 1 ? rawCompletionRate / 100 : rawCompletionRate
  const deliveriesAmount = Math.max(0, totalEarningsWeek - bonuses)

  const dailyBreakdownSource = (data as any)?.daily_breakdown ?? (data as any)?.breakdown ?? (data as any)?.earnings_by_day ?? []
  const dailyBreakdown = Array.isArray(dailyBreakdownSource)
    ? dailyBreakdownSource.map((item: any) => ({
        date: item?.date ?? "",
        day_name: item?.day_name ?? item?.day ?? item?.label ?? "Jour",
        earnings: getNumberFromCandidates(item, ["earnings", "amount", "total"]),
        deliveries: getNumberFromCandidates(item, ["deliveries", "deliveries_count", "orders_count"]),
      }))
    : []

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
            {formatFcfa(totalEarningsWeek)}
          </Text>
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Deliveries: {deliveriesWeek}</Text>
              <Text style={styles.breakdownValue}>
                {formatFcfa(deliveriesAmount)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Bonuses</Text>
              <Text style={styles.breakdownValue}>
                {formatFcfa(bonuses)}
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
                Complete {weeklyGoal - deliveriesWeek} more delivery to earn 10 FCFA bonus!
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
          {dailyBreakdown.length > 0 ? (
            dailyBreakdown.map((item, idx) => (
              <View key={idx} style={styles.dayItem}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{item.day_name}</Text>
                  <Text style={styles.dayDeliveries}>{item.deliveries} deliveries</Text>
                </View>
                <Text style={[styles.dayEarnings, item.earnings > 0 && { color: LIVREUR_COLORS.SUCCESS }]}>
                  {formatFcfa(toNumber(item.earnings))}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun revenu disponible pour cette période.</Text>
          )}
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
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: LIVREUR_COLORS.TEXT_SECONDARY,
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
