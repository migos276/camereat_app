import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Livreur, Delivery } from "../types"

const api = axiosService.getInstance()

export const livreurService = {
  async getProfile(): Promise<Livreur> {
    const response = await api.get<Livreur>(ENDPOINTS.LIVREURS_PROFILE)
    return response.data
  },

  async updateProfile(profileData: Partial<Livreur>): Promise<Livreur> {
    const response = await api.put<Livreur>(ENDPOINTS.LIVREURS_UPDATE_PROFILE, profileData)
    return response.data
  },

  async getNearbyDeliveries(latitude: number, longitude: number, radiusKm = 10): Promise<Delivery[]> {
    const response = await api.get<Delivery[]>(
      `${ENDPOINTS.LIVREURS_NEARBY_DELIVERIES}?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`,
    )
    return response.data
  },

  async getAvailableDeliveries(): Promise<Delivery[]> {
    const response = await api.get<Delivery[]>(ENDPOINTS.LIVREURS_AVAILABLE_DELIVERIES)
    return response.data
  },

  async acceptDelivery(id: string): Promise<Delivery> {
    const response = await api.post<Delivery>(ENDPOINTS.LIVREURS_ACCEPT_DELIVERY(id))
    return response.data
  },

  async rejectDelivery(id: string, reason?: string): Promise<void> {
    await api.post(ENDPOINTS.LIVREURS_REJECT_DELIVERY(id), { reason })
  },

  async updatePosition(latitude: number, longitude: number): Promise<void> {
    await api.post(ENDPOINTS.LIVREURS_UPDATE_POSITION, {
      latitude,
      longitude,
    })
  },

  async updateDeliveryStatus(id: string, status: string): Promise<Delivery> {
    const response = await api.post<Delivery>(ENDPOINTS.LIVREURS_DELIVERY_STATUS(id), {
      status,
    })
    return response.data
  },

  async getStatistics(): Promise<any> {
    const response = await api.get(ENDPOINTS.LIVREURS_STATS)
    return response.data
  },

  async getEarnings(): Promise<any> {
    const response = await api.get(ENDPOINTS.LIVREURS_EARNINGS)
    return response.data
  },

  async updateOnlineStatus(status: string): Promise<any> {
    const response = await api.put(ENDPOINTS.LIVREURS_UPDATE_STATUS, { status })
    return response.data
  },
}
