import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Product } from "../types"

const api = axiosService.getInstance()

export const productService = {
  // Create a product for restaurant or supermarket
  async createProduct(data: {
    name: string
    description?: string
    price: number
    category: string
    available: boolean
    stock?: number
    unit?: string
    preparation_time?: number
    discount_percentage?: number
    restaurant?: string
    supermarche?: string
  }): Promise<Product> {
    const response = await api.post<Product>(ENDPOINTS.PRODUCTS_LIST, data)
    return response.data
  },

  // Get all products with optional filters
  async getProducts(params?: {
    restaurant?: string
    supermarche?: string
    page?: number
  }): Promise<{ results: Product[]; count: number }> {
    const response = await api.get<{ results: Product[]; count: number }>(ENDPOINTS.PRODUCTS_LIST, { params })
    return response.data
  },

  // Get single product
  async getProduct(id: string): Promise<Product> {
    const response = await api.get<Product>(ENDPOINTS.PRODUCTS_DETAIL(id))
    return response.data
  },

  // Update product
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await api.patch<Product>(ENDPOINTS.PRODUCTS_DETAIL(id), data)
    return response.data
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    await api.delete(ENDPOINTS.PRODUCTS_DETAIL(id))
  },
}

