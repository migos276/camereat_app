import * as React from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"
import { userService } from "../../services/user-service"
import type { Address } from "../../types"

interface AddressesScreenProps {
  navigation: any
}

export const AddressesScreen: React.FC<AddressesScreenProps> = ({ navigation }) => {
  const [addresses, setAddresses] = React.useState<Address[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchAddresses = async () => {
    try {
      const data = await userService.getAddresses()
      setAddresses(data)
    } catch (error) {
      console.error("Error fetching addresses:", error)
      Alert.alert("Error", "Failed to load addresses")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAddresses()
    setRefreshing(false)
  }

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete "${address.label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteAddress(address.id)
              setAddresses(addresses.filter((a) => a.id !== address.id))
            } catch (error) {
              Alert.alert("Error", "Failed to delete address")
            }
          },
        },
      ]
    )
  }

  const handleSetMain = async (address: Address) => {
    try {
      await userService.updateAddress(address.id, { is_main: true })
      setAddresses(
        addresses.map((a) => ({
          ...a,
          is_main: a.id === address.id,
        }))
      )
    } catch (error) {
      Alert.alert("Error", "Failed to set main address")
    }
  }

  React.useEffect(() => {
    fetchAddresses()
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Delivery Addresses" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {(!addresses || addresses.length === 0) ? (
          <Card style={styles.emptyCard}>
            <MaterialIcons name="location-off" size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptySubtitle}>
              You haven't added any delivery addresses yet.
            </Text>
            <Button
              title="Add Address"
              onPress={() => navigation.navigate("AddAddress")}
              color={COLORS.primary}
              style={styles.addButton}
            />
          </Card>
        ) : (
          <>
            {addresses.map((address) => (
              <Card key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressIcon}>
                    <MaterialIcons
                      name={address.is_main ? "star" : "location-on"}
                      size={24}
                      color={address.is_main ? COLORS.warning : COLORS.primary}
                    />
                  </View>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    <Text style={styles.addressText}>
                      {address.street}, {address.neighborhood}
                    </Text>
                    <Text style={styles.addressText}>
                      {address.city}, {address.postal_code}
                    </Text>
                    <Text style={styles.addressText}>{address.country}</Text>
                    {address.delivery_instructions && (
                      <Text style={styles.instructions}>
                        Note: {address.delivery_instructions}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.addressActions}>
                  {!address.is_main && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetMain(address)}
                    >
                      <MaterialIcons name="star-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.actionText}>Set as Main</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate("AddAddress", { address })}
                  >
                    <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAddress(address)}
                  >
                    <MaterialIcons name="delete" size={18} color={COLORS.danger} />
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            <Button
              title="Add New Address"
              onPress={() => navigation.navigate("AddAddress")}
              color={COLORS.primary}
              style={styles.addButton}
            />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold" as const,
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    marginTop: 8,
  },
  addressCard: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
    color: COLORS.dark,
  },
  addressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
    lineHeight: 20,
  },
  instructions: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontStyle: "italic",
    marginTop: 4,
  },
  addressActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  deleteButton: {
    marginLeft: "auto",
  },
  deleteText: {
    color: COLORS.danger,
  },
})

