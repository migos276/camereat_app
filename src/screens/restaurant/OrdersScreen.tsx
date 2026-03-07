"use client"

import type React from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  SectionList,
  RefreshControl,
  Alert,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useState, useEffect, useRef } from "react"
import { Header } from "../../components"
import { COLORS } from "../../constants/config"
import { restaurantService } from "../../services/restaurant-service"
import type { RestaurantOrder } from "../../types"

type StatusKey = "waiting" | "accepted" | "preparing" | "ready" | "delivery" | "completed" | "cancelled"

const mapStatus = (status: string) => {
  switch (status) {
    case "EN_ATTENTE":
      return "waiting"
    case "ACCEPTEE":
      return "accepted"
    case "EN_PREPARATION":
      return "preparing"
    case "PRETE":
      return "ready"
    case "LIVREUR_ASSIGNE":
    case "EN_ROUTE_COLLECTE":
    case "COLLECTEE":
    case "EN_LIVRAISON":
      return "delivery"
    case "LIVREE":
      return "completed"
    case "ANNULEE":
    case "REFUSEE":
      return "cancelled"
    default:
      return "waiting"
  }
}

const STATUS_CONFIG: Record<StatusKey, {
  label: string
  icon: keyof typeof MaterialIcons.glyphMap
  color: string
  bgColor: string
}> = {
  waiting: {
    label: "En attente",
    icon: "hourglass-empty" as const,
    color: "#FF6B6B",
    bgColor: "#FFF5F5",
  },
  accepted: {
    label: "Acceptée",
    icon: "thumb-up",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  preparing: {
    label: "En préparation",
    icon: "outdoor-grill" as const,
    color: "#F59E0B",
    bgColor: "#FFFBEB",
  },
  ready: {
    label: "Prête",
    icon: "check-circle" as const,
    color: "#10B981",
    bgColor: "#F0FDF4",
  },
  delivery: {
    label: "En livraison",
    icon: "delivery-dining" as const,
    color: "#6366F1",
    bgColor: "#F5F3FF",
  },
  completed: {
    label: "Livrée",
    icon: "task-alt",
    color: "#059669",
    bgColor: "#ECFDF5",
  },
  cancelled: {
    label: "Annulée/Refusée",
    icon: "cancel",
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
}

// ─── Animated Order Card ──────────────────────────────────────────────────────
const AnimatedOrderCard: React.FC<{
  order: RestaurantOrder
  onPress: () => void
  onAccept?: () => void
  onStartPreparing?: () => void
  onMarkReady?: () => void
  isAccepting?: boolean
  isStartingPreparing?: boolean
  isMarkingReady?: boolean
  index: number
}> = ({ order, onPress, onAccept, onStartPreparing, onMarkReady, isAccepting = false, isStartingPreparing = false, isMarkingReady = false, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  const status = mapStatus(order.status) as StatusKey
  const config = STATUS_CONFIG[status]
  const amount = Number(order?.total_amount || 0)
  const deliveryAddress = ((order as any)?.delivery_address_text || "").trim()
  const paymentMode = String((order as any)?.payment_mode || "").replace(/_/g, " ")

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true }).start()
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()

  const timeLabel = (() => {
    const d = new Date(order.date_created)
    if (Number.isNaN(d.getTime())) return "Date inconnue"
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `Il y a ${diffMin} min`
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  })()

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, { borderLeftColor: config.color }]}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <View style={[styles.statusIconBox, { backgroundColor: config.color + "18" }]}>
                <MaterialIcons name={config.icon} size={20} color={config.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.orderNumRow}>
                  <Text style={styles.orderNum}>#{order.numero}</Text>
                  <View style={[styles.statusPill, { backgroundColor: config.bgColor }]}>
                    <Text style={[styles.statusPillText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
                <Text style={styles.clientName}>{order.client_name || "Client"}</Text>
                {deliveryAddress ? (
                  <Text style={styles.addressLine} numberOfLines={1}>
                    {deliveryAddress}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.amountBlock}>
              <Text style={[styles.amountText, { color: config.color }]}>
                {amount.toLocaleString("fr-FR")}
              </Text>
              <Text style={styles.amountCurrency}>FCFA</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom row */}
          <View style={styles.cardBottom}>
            <View style={styles.metaItem}>
              <MaterialIcons name="shopping-bag" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {order.items_count || 0} article{(order.items_count || 0) > 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{timeLabel}</Text>
            </View>
            {paymentMode ? (
              <>
                <View style={styles.metaDot} />
                <View style={styles.metaItem}>
                  <MaterialIcons name="payments" size={14} color="#9CA3AF" />
                  <Text style={styles.metaText}>{paymentMode}</Text>
                </View>
              </>
            ) : null}
            <View style={{ flex: 1 }} />
            {/* Action buttons based on order status */}
            {order.status === "EN_ATTENTE" && onAccept ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                disabled={isAccepting}
                onPress={(event: any) => {
                  event?.stopPropagation?.()
                  onAccept()
                }}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Accepter</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : order.status === "ACCEPTEE" && onStartPreparing ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.preparingBtn]}
                disabled={isStartingPreparing}
                onPress={(event: any) => {
                  event?.stopPropagation?.()
                  onStartPreparing()
                }}
              >
                {isStartingPreparing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="outdoor-grill" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Préparer</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : order.status === "EN_PREPARATION" && onMarkReady ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.readyBtn]}
                disabled={isMarkingReady}
                onPress={(event: any) => {
                  event?.stopPropagation?.()
                  onMarkReady()
                }}
              >
                {isMarkingReady ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Prête</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
            <View style={[styles.detailBtn, { borderColor: config.color + "40" }]}>
              <Text style={[styles.detailBtnText, { color: config.color }]}>Voir</Text>
              <MaterialIcons name="chevron-right" size={14} color={config.color} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ statusType: StatusKey; count: number }> = ({
  statusType,
  count,
}) => {
  const cfg = STATUS_CONFIG[statusType]
  return (
    <View style={[styles.sectionHeader, { backgroundColor: cfg.bgColor }]}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIconBox, { backgroundColor: cfg.color + "22" }]}>
          <MaterialIcons name={cfg.icon} size={16} color={cfg.color} />
        </View>
        <Text style={[styles.sectionTitle, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <View style={[styles.sectionBadge, { backgroundColor: cfg.color }]}>
        <Text style={styles.sectionBadgeText}>{count}</Text>
      </View>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RestaurantOrdersScreen: React.FC<any> = ({ navigation }) => {
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<StatusKey | null>(null)
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null)
  const [startingPreparingOrderId, setStartingPreparingOrderId] = useState<string | null>(null)
  const [readyingOrderId, setReadyingOrderId] = useState<string | null>(null)
  const sectionListRef = useRef<SectionList<RestaurantOrder>>(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      if (!refreshing) setLoading(true)
      setError(null)
      const data = await restaurantService.getOrders()
      setOrders(data)
    } catch {
      setError("Impossible de charger les commandes.")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleAcceptOrder = (order: RestaurantOrder) => {
    Alert.alert(
      "Accepter la commande",
      `Voulez-vous accepter la commande #${order.numero} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Accepter",
          onPress: async () => {
            try {
              const orderId = String(order.id)
              setAcceptingOrderId(orderId)
              const updated = await restaurantService.acceptOrder(orderId)
              setOrders((prev) =>
                prev.map((item) =>
                  String(item.id) === orderId
                    ? { ...item, status: updated.status }
                    : item,
                ),
              )
            } catch (err: any) {
              Alert.alert(
                "Erreur",
                err?.response?.data?.error || "Impossible d'accepter la commande.",
              )
            } finally {
              setAcceptingOrderId(null)
            }
          },
        },
      ],
    )
  }

  const handleStartPreparing = (order: RestaurantOrder) => {
    Alert.alert(
      "Commencer la préparation",
      `Voulez-vous commencer la préparation de la commande #${order.numero} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const orderId = String(order.id)
              setStartingPreparingOrderId(orderId)
              const updated = await restaurantService.startOrderPreparation(orderId)
              setOrders((prev) =>
                prev.map((item) =>
                  String(item.id) === orderId
                    ? { ...item, status: updated.status }
                    : item,
                ),
              )
            } catch (err: any) {
              Alert.alert(
                "Erreur",
                err?.response?.data?.error || "Impossible de commencer la préparation.",
              )
            } finally {
              setStartingPreparingOrderId(null)
            }
          },
        },
      ],
    )
  }

  const handleMarkAsReady = (order: RestaurantOrder) => {
    Alert.alert(
      "Marquer comme prête",
      `Confirmer que la commande #${order.numero} est prête ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const orderId = String(order.id)
              setReadyingOrderId(orderId)
              const updated = await restaurantService.markOrderAsReady(orderId)
              setOrders((prev) =>
                prev.map((item) =>
                  String(item.id) === orderId
                    ? { ...item, status: updated.status }
                    : item,
                ),
              )
            } catch (err: any) {
              Alert.alert(
                "Erreur",
                err?.response?.data?.error || "Impossible de marquer la commande comme prête.",
              )
            } finally {
              setReadyingOrderId(null)
            }
          },
        },
      ],
    )
  }

  const ordersByStatus = {
    waiting: orders.filter(o => mapStatus(o.status) === "waiting"),
    accepted: orders.filter(o => mapStatus(o.status) === "accepted"),
    preparing: orders.filter(o => mapStatus(o.status) === "preparing"),
    ready: orders.filter(o => mapStatus(o.status) === "ready"),
    delivery: orders.filter(o => mapStatus(o.status) === "delivery"),
    completed: orders.filter(o => mapStatus(o.status) === "completed"),
    cancelled: orders.filter(o => mapStatus(o.status) === "cancelled"),
  }

  const totalOrders = orders.length
  const urgentCount = ordersByStatus.waiting.length + ordersByStatus.accepted.length

  // Build sections for SectionList
  const allSections = (["waiting", "accepted", "preparing", "ready", "delivery", "completed", "cancelled"] as const)
    .map((s) => ({ key: s, data: ordersByStatus[s] }))
    .filter((s) => s.data.length > 0)

  useEffect(() => {
    if (!activeSection && allSections.length > 0) {
      setActiveSection(allSections[0].key as StatusKey)
    }
  }, [allSections, activeSection])

  const sectionIndexByKey = allSections.reduce<Record<string, number>>((acc, section, index) => {
    acc[section.key] = index
    return acc
  }, {})

  const scrollToSection = (statusKey: StatusKey) => {
    const sectionIndex = sectionIndexByKey[statusKey]
    if (sectionIndex === undefined) return
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      viewOffset: 6,
      animated: true,
    })
    setActiveSection(statusKey)
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ section?: { key?: string } }> }) => {
    const firstVisible = viewableItems.find((item) => item?.section?.key)
    const key = firstVisible?.section?.key as StatusKey | undefined
    if (key) setActiveSection(key)
  }).current

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Commandes" subtitle="Gestion des commandes" userType="restaurant" />
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Chargement des commandes…</Text>
        </View>
      </View>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.screen}>
        <Header title="Commandes" subtitle="Gestion des commandes" userType="restaurant" />
        <View style={styles.centeredState}>
          <View style={styles.errorIcon}>
            <MaterialIcons name="wifi-off" size={32} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Erreur de connexion</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <MaterialIcons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <Header title="Commandes" subtitle="Gestion des commandes" userType="restaurant" />

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>{urgentCount}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{ordersByStatus.preparing.length}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#10B981" }]}>{ordersByStatus.ready.length}</Text>
          <Text style={styles.statLabel}>Prêtes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#059669" }]}>{ordersByStatus.completed.length}</Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <MaterialIcons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs (scroll anchors) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {(["waiting", "accepted", "preparing", "ready", "delivery", "completed", "cancelled"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s]
          const isActive = activeSection === s
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterTab,
                isActive && { backgroundColor: cfg.color, borderColor: cfg.color },
                sectionIndexByKey[s] === undefined && styles.filterTabDisabled,
              ]}
              disabled={sectionIndexByKey[s] === undefined}
              onPress={() => scrollToSection(s)}
            >
              <MaterialIcons name={cfg.icon} size={13} color={isActive ? "#fff" : cfg.color} />
              <Text style={[styles.filterTabText, isActive && { color: "#fff" }]}>
                {cfg.label}
              </Text>
              {ordersByStatus[s].length > 0 && (
                <View style={[styles.filterCount, { backgroundColor: isActive ? "#ffffff33" : cfg.color + "22" }]}>
                  <Text style={[styles.filterCountText, { color: isActive ? "#fff" : cfg.color }]}>
                    {ordersByStatus[s].length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Orders list */}
      {allSections.length === 0 ? (
        <View style={styles.centeredState}>
          <MaterialIcons name="inbox" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.stateText}>Il n'y a pas de commandes pour le moment.</Text>
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={allSections}
          keyExtractor={(item, index) => String(item.id ?? item.numero ?? index)}
          renderItem={({ item, index }) => (
            <AnimatedOrderCard
              order={item}
              index={index}
              isAccepting={acceptingOrderId === String(item.id)}
              isStartingPreparing={startingPreparingOrderId === String(item.id)}
              isMarkingReady={readyingOrderId === String(item.id)}
              onAccept={() => handleAcceptOrder(item)}
              onStartPreparing={() => handleStartPreparing(item)}
              onMarkReady={() => handleMarkAsReady(item)}
              onPress={() => navigation.navigate("OrderDetail", { id: String(item.id ?? item.numero) })}
            />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              statusType={section.key as StatusKey}
              count={section.data.length}
            />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 20 }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  // ── States ──
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // ── Stats bar ──
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    marginLeft: 6,
  },

  // ── Filter bar ──
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  filterTabDisabled: {
    opacity: 0.45,
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  sectionBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
  },
  sectionBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // ── List ──
  listContent: {
    paddingBottom: 32,
  },

  // ── Order card ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  statusIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  orderNumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  orderNum: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  addressLine: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    flexShrink: 1,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  amountCurrency: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 70,
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: "#3B82F6",
  },
  preparingBtn: {
    backgroundColor: "#F59E0B",
  },
  readyBtn: {
    backgroundColor: "#10B981",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
})

export default RestaurantOrdersScreen
