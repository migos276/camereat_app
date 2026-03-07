import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Order } from "../types"

const api = axiosService.getInstance()

type CreateOrderPayload = {
  restaurant_id?: string
  supermarket_id?: string
  restaurant?: string
  supermarche?: string
  items: Array<{ product_id?: string; produit?: string; quantity: number; special_instructions?: string }>
  delivery_address_id?: string
  delivery_address_text?: string
  payment_mode?: string
  payment_phone?: string
  total_amount?: number
  special_instructions?: string
}

const normalizeCreateOrderPayload = (orderData: CreateOrderPayload) => {
  const fallbackAddress = "Adresse non précisée"
  const mappedItems = orderData.items.map((item) => ({
    produit: item.produit || item.product_id,
    quantity: item.quantity,
    special_instructions: item.special_instructions || "",
  }))

  const payload: Record<string, any> = {
    items: mappedItems,
    delivery_address_text: orderData.delivery_address_text || fallbackAddress,
    payment_mode: orderData.payment_mode,
    payment_phone: orderData.payment_phone,
    total_amount: orderData.total_amount,
    special_instructions: orderData.special_instructions || "",
    restaurant: orderData.restaurant || orderData.restaurant_id,
    supermarche: orderData.supermarche || orderData.supermarket_id,
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key]
    }
  })

  return payload
}

export const orderService = {
  async createOrder(orderData: CreateOrderPayload): Promise<Order> {
    const payload = normalizeCreateOrderPayload(orderData)
    const response = await api.post<Order>(ENDPOINTS.ORDERS_CREATE, payload)
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

  async checkPaymentStatus(id: string): Promise<any> {
    const response = await api.get(ENDPOINTS.ORDERS_CHECK_PAYMENT(id))
    return response.data
  },
}
