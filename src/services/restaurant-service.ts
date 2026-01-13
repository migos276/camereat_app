import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Restaurant, Product, RestaurantDashboardStats, RestaurantOrder } from "../types"

const api = axiosService.getInstance()

// Helper to parse GeoJSON response to Restaurant array
const parseGeoJSONRestaurants = (data: any): Restaurant[] => {
  // Check if response is GeoJSON format
  if (data && data.type === "FeatureCollection" && Array.isArray(data.features)) {
    return data.features
      .filter((feature: any) => feature && feature.properties && feature.id)
      .map((feature: any) => {
        const props = feature.properties || {}
        return {
          id: String(feature.id),
          commercial_name: props.commercial_name || props.name || "Restaurant",
          legal_name: props.legal_name,
          description: props.description,
          logo: props.logo,
          cover_image: props.cover_image,
          latitude: props.latitude,
          longitude: props.longitude,
          full_address: props.full_address,
          delivery_radius_km: props.delivery_radius_km,
          avg_preparation_time: props.avg_preparation_time || 30,
          average_rating: props.average_rating ? parseFloat(String(props.average_rating)) : 0,
          review_count: props.review_count || 0,
          price_level: props.price_level,
          base_delivery_fee: props.base_delivery_fee ? parseFloat(String(props.base_delivery_fee)) : 0,
          min_order_amount: props.min_order_amount,
          cuisine_type: props.cuisine_type,
          is_open: props.is_open !== undefined ? props.is_open : true,
          is_active: props.is_active,
          distance_km: props.distance_km || 0,
        }
      })
  }
  // Return as is if already an array
  return data || []
}

// Helper to parse product data (convert strings to numbers)
const parseProductData = (products: any[]): Product[] => {
  return products.map((p) => ({
    id: String(p.id),
    name: p.name,
    description: p.description,
    image: p.image,
    price: parseFloat(p.price) || 0,
    discount_percentage: p.discount_percentage ? parseFloat(p.discount_percentage) : undefined,
    discount_price: p.discount_price ? parseFloat(p.discount_price) : undefined,
    category: p.category,
    unit: p.unit,
    available: p.available,
    stock: p.stock,
    preparation_time: p.preparation_time,
    sales_count: p.sales_count,
    restaurant: p.restaurant,
    supermarche: p.supermarche,
  }))
}

export const restaurantService = {
  async listRestaurants(page = 1): Promise<{ results: Restaurant[]; count: number }> {
    const response = await api.get<any>(
      `${ENDPOINTS.RESTAURANTS_LIST}?page=${page}`,
    )
    // Handle different response formats
    const data = response.data
    if (Array.isArray(data)) {
      // Backend returned array directly
      return { results: data, count: data.length }
    }
    if (data && data.results) {
      // Check if results is a GeoJSON FeatureCollection (from GeoFeatureModelSerializer with pagination)
      if (
        data.results.type === "FeatureCollection" &&
        Array.isArray(data.results.features)
      ) {
        // Parse the GeoJSON features to Restaurant array
        const parsedRestaurants = parseGeoJSONRestaurants(data.results)
        return {
          results: parsedRestaurants,
          count: data.count || parsedRestaurants.length,
        }
      }
      // Backend returned { results: [...], count: n } as plain array
      if (Array.isArray(data.results)) {
        return {
          results: data.results,
          count: data.count || data.results.length,
        }
      }
    }
    // Fallback: return empty result
    console.warn("Unexpected restaurant list response format:", data)
    return { results: [], count: 0 }
  },

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    const response = await api.get<any>(ENDPOINTS.RESTAURANTS_SEARCH, {
      params: { q: query },
    })
    return parseGeoJSONRestaurants(response.data)
  },

  async searchMenuItems(query: string): Promise<Product[]> {
    const response = await api.get<any[]>(ENDPOINTS.MENU_SEARCH, {
      params: { q: query },
    })
    return parseProductData(response.data)
  },

  async getRestaurant(id: string): Promise<Restaurant> {
    const response = await api.get<Restaurant>(ENDPOINTS.RESTAURANTS_DETAIL(id))
    return response.data
  },

  async getNearbyRestaurants(latitude: number, longitude: number, radiusKm = 5): Promise<Restaurant[]> {
    const response = await api.get<any>(
      `${ENDPOINTS.RESTAURANTS_NEARBY}?lat=${latitude}&lon=${longitude}&radius=${radiusKm}`,
    )
    return parseGeoJSONRestaurants(response.data)
  },

  async getRestaurantMenu(id: string): Promise<Product[]> {
    const response = await api.get<any[]>(ENDPOINTS.RESTAURANTS_MENU(id))
    return parseProductData(response.data)
  },

  async getRestaurantProducts(id: string, page = 1): Promise<{ results: Product[]; count: number }> {
    const response = await api.get<{ results: any[]; count: number }>(
      `${ENDPOINTS.RESTAURANTS_PRODUCTS(id)}?page=${page}`,
    )
    return {
      results: parseProductData(response.data.results),
      count: response.data.count,
    }
  },

  async getRatings(id: string): Promise<any> {
    const response = await api.get(ENDPOINTS.RESTAURANTS_RATINGS(id))
    return response.data
  },

  async getDashboardStats(): Promise<RestaurantDashboardStats> {
    const response = await api.get<RestaurantDashboardStats>(ENDPOINTS.RESTAURANTS_DASHBOARD_STATS)
    return response.data
  },

  async getRecentOrders(): Promise<RestaurantOrder[]> {
    const response = await api.get<RestaurantOrder[]>(ENDPOINTS.RESTAURANTS_RECENT_ORDERS)
    return response.data
  },

  async getOrders(): Promise<RestaurantOrder[]> {
    const response = await api.get<RestaurantOrder[]>(ENDPOINTS.RESTAURANTS_ORDERS)
    return response.data
  },

  async getMyRestaurant(): Promise<Restaurant> {
    const response = await api.get<Restaurant>(ENDPOINTS.RESTAURANTS_MY_RESTAURANT)
    return response.data
  },

  async updateRestaurantProfile(data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await api.put<Restaurant>(ENDPOINTS.RESTAURANTS_UPDATE_PROFILE, data)
    return response.data
  },
}
