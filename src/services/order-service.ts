import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Order } from "../types"

const api = axiosService.getInstance()

export const orderService = {
  async createOrder(orderData: {
    restaurant_id?: string
    supermarket_id?: string
    items: Array<{ product_id: string; quantity: number }>
    delivery_address_id: string
  }): Promise<Order> {
    const response = await api.post<Order>(ENDPOINTS.ORDERS_CREATE, orderData)
    return response.data
  },

  async listOrders(page = 1, status?: string): Promise<{ results: Order[]; count: number }> {
    let url = `${ENDPOINTS.ORDERS_LIST}?page=${page}`
    if (status) {
      url += `&status=${status}`
    }
    const response = await api.get<{ results: Order[]; count: number }>(url)
    return response.data
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get<Order>(ENDPOINTS.ORDERS_DETAIL(id))
    return response.data
  },

  async cancelOrder(id: string): Promise<Order> {
    const response = await api.post<Order>(ENDPOINTS.ORDERS_CANCEL(id))
    return response.data
  },

  async trackOrder(id: string): Promise<any> {
    const response = await api.get(ENDPOINTS.ORDERS_TRACK(id))
    return response.data
  },

  async validateOTP(id: string, otp: string): Promise<Order> {
    const response = await api.post<Order>(ENDPOINTS.ORDERS_VALIDATE_OTP(id), { otp })
    return response.data
  },

  async rateOrder(id: string, rating: number, comment?: string): Promise<any> {
    const response = await api.post(ENDPOINTS.ORDERS_RATE(id), {
      rating,
      comment,
    })
    return response.data
  },
}
