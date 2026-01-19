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

// Helper to parse product data (convert strings to numbers and handle backend response)
const parseProductData = (products: any[]): Product[] => {
  return products.map((p) => ({
    id: String(p.id),
    name: p.name || p.product_name || "Produit sans nom",
    description: p.description || "",
    image: p.image || null,
    price: parseFloat(String(p.price)) || 0,
    discount_percentage: p.discount_percentage ? parseFloat(String(p.discount_percentage)) : undefined,
    discount_price: p.discount_price ? parseFloat(String(p.discount_price)) : undefined,
    category: p.category || "",
    unit: p.unit || "UNITE",
    available: p.available !== undefined ? p.available : true,
    stock: p.stock || null,
    preparation_time: p.preparation_time || null,
    sales_count: p.sales_count || 0,
    restaurant: p.restaurant || null,
    supermarche: p.supermarche || null,
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
    // Check if we have file data (uri indicates a new image was picked)
    const hasFileData = data.logo && typeof data.logo === 'string' && data.logo.startsWith('file://') ||
                       data.cover_image && typeof data.cover_image === 'string' && data.cover_image.startsWith('file://');

    if (hasFileData) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof Restaurant];
        if (key !== 'logo' && key !== 'cover_image' && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Add logo file
      if (data.logo && typeof data.logo === 'string' && data.logo.startsWith('file://')) {
        const filename = data.logo.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('logo', {
          uri: data.logo,
          name: filename,
          type,
        } as any);
      }

      // Add cover_image file
      if (data.cover_image && typeof data.cover_image === 'string' && data.cover_image.startsWith('file://')) {
        const filename = data.cover_image.split('/').pop() || 'cover.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('cover_image', {
          uri: data.cover_image,
          name: filename,
          type,
        } as any);
      }

      const response = await api.put<Restaurant>(ENDPOINTS.RESTAURANTS_UPDATE_PROFILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    // Regular JSON update
    const response = await api.put<Restaurant>(ENDPOINTS.RESTAURANTS_UPDATE_PROFILE, data);
    return response.data;
  },

  async uploadLogo(uri: string): Promise<Restaurant> {
    const filename = uri.split('/').pop() || 'logo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('logo', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await api.post<Restaurant>(ENDPOINTS.RESTAURANTS_UPLOAD_LOGO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadCoverImage(uri: string): Promise<Restaurant> {
    const filename = uri.split('/').pop() || 'cover.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('cover_image', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await api.post<Restaurant>(ENDPOINTS.RESTAURANTS_UPLOAD_COVER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async registerRestaurantProfile(data: {
    commercial_name: string
    legal_name?: string
    description?: string
    rccm_number?: string
    tax_number?: string
    restaurant_license?: string
    cuisine_type: string
    full_address?: string
    latitude?: number
    longitude?: number
    delivery_radius_km?: number
    avg_preparation_time?: number
    opening_hours?: Record<string, any>
    price_level?: string
    base_delivery_fee?: number
    min_order_amount?: number
    bank_account?: Record<string, any>
    logo?: string | null
    cover_image?: string | null
  }): Promise<Restaurant> {
    const response = await api.post<Restaurant>(ENDPOINTS.RESTAURANTS_REGISTER_PROFILE, data)
    return response.data
  },
}
