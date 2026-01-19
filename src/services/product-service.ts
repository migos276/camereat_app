import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Product } from "../types"

const api = axiosService.getInstance()

export const productService = {
  // Create a product for restaurant or supermarket
  async createProduct(data: FormData | {
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
    image?: any
  }): Promise<Product> {
    // Check if data is already FormData (from the component)
    if (data instanceof FormData) {
      const response = await api.post<Product>(ENDPOINTS.PRODUCTS_LIST, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    }
    
    // If image is provided in object format, create FormData
    if ('image' in data && data.image) {
      const formData = new FormData()
      
      // Append all fields to FormData
      formData.append('name', data.name)
      formData.append('description', data.description || '')
      formData.append('price', data.price.toString())
      formData.append('category', data.category)
      formData.append('available', data.available.toString())
      
      if (data.stock !== undefined) formData.append('stock', data.stock.toString())
      if (data.unit) formData.append('unit', data.unit)
      if (data.preparation_time !== undefined) formData.append('preparation_time', data.preparation_time.toString())
      if (data.discount_percentage !== undefined) formData.append('discount_percentage', data.discount_percentage.toString())
      if (data.restaurant) formData.append('restaurant', data.restaurant)
      if (data.supermarche) formData.append('supermarche', data.supermarche)
      
      // Append image
      formData.append('image', data.image)

      const response = await api.post<Product>(ENDPOINTS.PRODUCTS_LIST, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Regular JSON request without image
      const response = await api.post<Product>(ENDPOINTS.PRODUCTS_LIST, data)
      return response.data
    }
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

  // Update product - supports both FormData and regular object
  async updateProduct(id: string, data: FormData | Partial<Product>): Promise<Product> {
    if (data instanceof FormData) {
      const response = await api.patch<Product>(ENDPOINTS.PRODUCTS_DETAIL(id), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    }
    
    const response = await api.patch<Product>(ENDPOINTS.PRODUCTS_DETAIL(id), data)
    return response.data
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    await api.delete(ENDPOINTS.PRODUCTS_DETAIL(id))
  },
}