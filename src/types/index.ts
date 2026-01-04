export interface User {
  id: string
  email: string
  phone?: string
  first_name: string
  last_name: string
  user_type: "CLIENT" | "RESTAURANT" | "SUPERMARCHE" | "LIVREUR" | "ADMIN"
  is_approved?: boolean
  is_verified?: boolean
  photo_profil?: string
  date_creation?: string
  full_name?: string
  restaurant_id?: string
  supermarket_id?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface Restaurant {
  id: string
  commercial_name: string
  legal_name?: string
  description?: string
  logo?: string
  cover_image?: string
  latitude?: number
  longitude?: number
  full_address?: string
  delivery_radius_km?: number
  avg_preparation_time?: number
  average_rating?: number
  review_count?: number
  price_level?: string
  base_delivery_fee?: number
  min_order_amount?: number
  cuisine_type?: string
  is_open?: boolean
  is_active?: boolean
  distance_km?: number
  // Backward compatibility
  name?: string
  image?: string
  rating?: number
  cuisine_types?: string[]
  delivery_time?: number
  address?: string | Address
}

export interface Supermarket {
  id: string
  commercial_name: string
  legal_name?: string
  description?: string
  logo?: string
  cover_image?: string
  latitude?: number
  longitude?: number
  full_address?: string
  delivery_radius_km?: number
  product_count?: number
  average_rating?: number
  review_count?: number
  price_level?: string
  base_delivery_fee?: number
  min_order_amount?: number
  is_open?: boolean
  is_active?: boolean
  distance_km?: number
}

export interface Category {
  id?: string
  name: string
  slug?: string
  icon?: string
  color?: string
  display_order?: number
}

export interface Product {
  id: string
  name: string
  description?: string
  image?: string
  price: number
  discount_percentage?: number
  discount_price?: number
  category?: string | Category
  unit?: string
  available?: boolean
  stock?: number
  preparation_time?: number
  sales_count?: number
  restaurant?: string
  supermarche?: string
}

export interface OrderItem {
  id: string
  product: Product
  quantity: number
  price: number
  line_total: number
}

export interface Order {
  id: string
  numero: string
  status: string
  restaurant_name?: string
  livreur_name?: string
  delivery_address_text: string
  distance_km: number
  estimated_duration_minutes: number
  products_amount: number
  delivery_fee: number
  platform_commission: number
  total_amount: number
  payment_mode: string
  payment_status: string
  special_instructions: string
  items: OrderItem[]
  date_created: string
  date_accepted: string | null
  date_delivered: string | null
  created_at?: string
  updated_at?: string
}

export interface Delivery {
  id: string
  order: Order
  livreur: Livreur
  pickup_address: Address
  delivery_address: Address
  distance: number
  estimated_time: number
  status: string
  current_position?: Location
  created_at: string
  completed_at?: string
}

export interface Livreur {
  id: string
  user: User
  vehicle_type: string
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_plate?: string
  vehicle_color?: string
  driver_license_number?: string
  driver_license_expiry?: string
  insurance_number?: string
  insurance_expiry?: string
  current_latitude?: number
  current_longitude?: number
  status: "HORS_LIGNE" | "EN_LIGNE" | "EN_LIVRAISON" | "EN_PAUSE"
  action_radius_km?: number
  average_rating?: number
  delivery_count?: number
  total_earnings?: number
  is_verified?: boolean
  is_active?: boolean
  current_position?: Location
  date_started?: string
  date_created?: string
}

export interface Address {
  id: string
  user_id?: string
  label: string
  street: string
  city: string
  neighborhood?: string
  postal_code: string
  country: string
  latitude?: number
  longitude?: number
  is_main: boolean
  delivery_instructions?: string
  created_at?: string
  updated_at?: string
}

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface Zone {
  id: string
  name: string
  polygon: any
  delivery_fee: number
  is_active: boolean
}
