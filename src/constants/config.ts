export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.20.10.3:8000/api"

export const APP_CONSTANTS = {
  USER_TYPES: {
    CLIENT: "client",
    RESTAURANT: "restaurant",
    SUPERMARKET: "supermarket",
    LIVREUR: "livreur",
    ADMIN: "admin",
  },
  ORDER_STATUS: {
    SUBMITTED: "submitted",
    ACCEPTED: "accepted",
    PREPARING: "preparing",
    READY: "ready",
    ASSIGNED: "assigned",
    IN_TRANSIT: "in_transit",
    ARRIVED: "arrived",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    REJECTED: "rejected",
    FAILED: "failed",
  },
  DELIVERY_STATUS: {
    PENDING: "pending",
    ACCEPTED: "accepted",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
  },
  LIVREUR_STATUS: {
    ONLINE: "online",
    OFFLINE: "offline",
    DELIVERING: "delivering",
    ON_BREAK: "on_break",
  },
  VERIFICATION_STATUS: {
    PENDING: "pending",
    SUBMITTED: "submitted",
    APPROVED: "approved",
    REJECTED: "rejected",
    CHANGES_REQUESTED: "changes_requested",
  },
}

export const COLORS = {
  primary: "#FF6B35",
  secondary: "#004E89",
  success: "#06A77D",
  warning: "#F4A261",
  danger: "#E76F51",
  light: "#F7F7F7",
  dark: "#1F1F1F",
  gray: "#999999",
  lightGray: "#E0E0E0",
  white: "#FFFFFF",
  background: "#F7F7F7",
  darkGray: "#2D2D2D",
  card: "#FFFFFF",
}

// Dark mode colors
export const DARK_COLORS = {
  primary: "#FF6B35",
  secondary: "#4DA8DA",
  success: "#06A77D",
  warning: "#F4A261",
  danger: "#E76F51",
  light: "#2D2D2D",
  dark: "#F7F7F7",
  gray: "#AAAAAA",
  lightGray: "#3D3D3D",
  white: "#1F1F1F",
  background: "#121212",
  darkGray: "#2D2D2D",
  card: "#1F1F1F",
}

// Helper function to get colors based on theme
export const getColors = (darkMode: boolean) => {
  return darkMode ? DARK_COLORS : COLORS
}

export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
}

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const SHADOW = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
}
