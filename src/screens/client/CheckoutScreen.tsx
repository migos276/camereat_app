"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, TextInput } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

export const CheckoutScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Checkout" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <Card style={styles.addressCard}>
            <Text style={styles.addressTitle}>Home</Text>
            <Text style={styles.addressText}>123 Main Street, New York, NY 10001</Text>
          </Card>
          <TouchableOpacity style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change Address</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Delivery Time</Text>
          </View>
          <View style={styles.timeOptions}>
            <TouchableOpacity style={[styles.timeOption, styles.timeOptionSelected]}>
              <Text style={styles.timeOptionText}>ASAP (25-35 min)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeOption}>
              <Text style={styles.timeOptionText}>Schedule Later</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="credit-card" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.paymentMethods}>
            <TouchableOpacity style={[styles.paymentMethod, styles.paymentMethodSelected]}>
              <MaterialIcons name="credit-card" size={20} color={COLORS.WHITE} />
              <Text style={styles.paymentMethodText}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentMethod}>
              <MaterialIcons name="wallet" size={20} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.paymentMethodText}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentMethod}>
              <MaterialIcons name="money" size={20} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.paymentMethodText}>Cash</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="note" size={20} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.sectionTitle}>Special Instructions</Text>
          </View>
          <TextInput placeholder="Add delivery notes..." multiline numberOfLines={3} />
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>$27.98</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>$2.50</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>$30.48</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Place Order • $30.48"
          onPress={() => navigation.navigate("OrderTracking")}
          color={COLORS.CLIENT_PRIMARY}
        />
      </View>
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  addressCard: {
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  addressTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  changeButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CLIENT_PRIMARY,
    borderRadius: 8,
  },
  changeButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.CLIENT_PRIMARY,
    fontWeight: "600",
  },
  timeOptions: {
    gap: 8,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    alignItems: "center",
  },
  timeOptionSelected: {
    backgroundColor: COLORS.CLIENT_PRIMARY,
    borderColor: COLORS.CLIENT_PRIMARY,
  },
  timeOptionText: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
  },
  paymentMethodSelected: {
    backgroundColor: COLORS.CLIENT_PRIMARY,
    borderColor: COLORS.CLIENT_PRIMARY,
  },
  paymentMethodText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 12,
  },
  totalLabel: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
  },
  totalValue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    color: COLORS.CLIENT_PRIMARY,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
})
