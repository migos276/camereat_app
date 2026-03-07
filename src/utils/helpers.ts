import { COLORS } from "../constants/config"

export const formatCurrency = (amount: number, currency = "DZD"): string => {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`
  }
  return `${distance.toFixed(1)}km`
}

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export const calculateDeliveryFee = (distance: number, basePrice = 100): number => {
  const perKmPrice = 50
  return basePrice + distance * perKmPrice
}

export const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    submitted: COLORS.warning,
    accepted: COLORS.primary,
    preparing: COLORS.warning,
    ready: COLORS.primary,
    assigned: COLORS.primary,
    in_transit: COLORS.secondary,
    arrived: COLORS.success,
    completed: COLORS.success,
    cancelled: COLORS.danger,
    rejected: COLORS.danger,
    failed: COLORS.danger,
    online: COLORS.success,
    offline: COLORS.gray,
    delivering: COLORS.secondary,
  }
  return statusColors[status] || COLORS.gray
}

export const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    submitted: "Soumis",
    accepted: "Accepté",
    preparing: "En préparation",
    ready: "Prêt",
    assigned: "Assigné",
    in_transit: "En transit",
    arrived: "Arrivé",
    completed: "Complété",
    cancelled: "Annulé",
    rejected: "Rejeté",
    failed: "Échoué",
    online: "En ligne",
    offline: "Hors ligne",
    delivering: "En livraison",
  }
  return labels[status] || status
}

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePhoneNumber = (phone: string): boolean => {
  const regex = /^(\+213|0)[567]\d{8}$/
  return regex.test(phone)
}

export const truncateString = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) + "..." : str
}
