"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import { useState, useEffect } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, ProgressBar } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface VerificationStatusScreenProps {
  navigation: any
}

export const VerificationStatusScreen: React.FC<VerificationStatusScreenProps> = ({ navigation }) => {
  const [status, setStatus] = useState<"submitted" | "reviewing" | "approved" | "rejected">("submitted")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("reviewing")
      setProgress(0.66)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case "approved":
        return COLORS.SUCCESS
      case "rejected":
        return COLORS.ERROR
      case "reviewing":
        return COLORS.WARNING
      default:
        return COLORS.CLIENT_PRIMARY
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "approved":
        return "check-circle"
      case "rejected":
        return "cancel"
      case "reviewing":
        return "schedule"
      default:
        return "pending"
    }
  }

  return (
    <View style={styles.container}>
      <Header
        title="Verification Status"
        subtitle="Track your submission progress"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={[styles.statusCard, { borderTopColor: getStatusColor(), borderTopWidth: 4 }]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor() }]}>
              <MaterialIcons name={getStatusIcon() as any} size={40} color={COLORS.WHITE} />
            </View>

            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {status === "submitted" && "Documents Submitted"}
                {status === "reviewing" && "Under Review"}
                {status === "approved" && "Verification Approved"}
                {status === "rejected" && "Verification Rejected"}
              </Text>
              <Text style={styles.statusDesc}>
                {status === "submitted" && "Your documents have been received. Please wait for review."}
                {status === "reviewing" && "Our team is reviewing your documents. This usually takes 2-3 days."}
                {status === "approved" && "Congratulations! You are now fully verified."}
                {status === "rejected" && "Your verification was not approved. Please resubmit with clearer documents."}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Verification Progress</Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <ProgressBar progress={progress} color={getStatusColor()} />
        </Card>

        <Card style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Timeline</Text>

          {[
            { step: "Documents Submitted", time: "Now", done: true },
            { step: "Under Review", time: "2-3 days", done: status !== "submitted" },
            { step: "Verification Result", time: "Pending", done: status === "approved" || status === "rejected" },
          ].map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: item.done ? getStatusColor() : COLORS.BORDER,
                  },
                ]}
              />
              <View style={styles.timelineItemContent}>
                <Text style={[styles.timelineItemStep, { fontWeight: item.done ? "600" : "400" }]}>{item.step}</Text>
                <Text style={styles.timelineItemTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </Card>

        {status === "rejected" && (
          <Card style={styles.actionCard}>
            <Text style={styles.actionTitle}>What Now?</Text>
            <Text style={styles.actionText}>
              You can resubmit your documents with clearer photos. Make sure all corners are visible and the document is
              fully readable.
            </Text>
            <TouchableOpacity style={styles.resubmitButton}>
              <MaterialIcons name="refresh" size={20} color={COLORS.CLIENT_PRIMARY} />
              <Text style={styles.resubmitText}>Resubmit Documents</Text>
            </TouchableOpacity>
          </Card>
        )}

        {status === "approved" && (
          <Card style={[styles.actionCard, { borderLeftColor: COLORS.SUCCESS, borderLeftWidth: 4 }]}>
            <Text style={styles.actionTitle}>Ready to Go!</Text>
            <Text style={styles.actionText}>You're all set. Start accepting orders and earning money now.</Text>
            <Button 
              title="Start Earning" 
              color={COLORS.SUCCESS} 
              onPress={() => navigation.replace("UserTypeSelect")} 
            />
          </Card>
        )}
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
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusDesc: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
  },
  progressPercent: {
    ...TYPOGRAPHY.body1,
    fontWeight: "700",
    color: COLORS.CLIENT_PRIMARY,
  },
  timelineCard: {
    marginBottom: 16,
  },
  timelineTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineItemContent: {
    flex: 1,
  },
  timelineItemStep: {
    ...TYPOGRAPHY.body2,
    marginBottom: 2,
  },
  timelineItemTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  actionCard: {
    marginBottom: 16,
  },
  actionTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 8,
  },
  actionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
  },
  resubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.CLIENT_PRIMARY,
    borderRadius: 8,
  },
  resubmitText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.CLIENT_PRIMARY,
    fontWeight: "600",
  },
})
