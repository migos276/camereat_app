import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Address } from "../types"

const api = axiosService.getInstance()

export const userService = {
  async uploadDocument(documentType: string, file: any, expiryDate?: string): Promise<any> {
    const formData = new FormData()
    formData.append("document_type", documentType)
    formData.append("file", file)
    if (expiryDate) {
      formData.append("expiry_date", expiryDate)
    }

    const response = await api.post(ENDPOINTS.USERS_UPLOAD_DOCUMENT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },

  async getAddresses(): Promise<Address[]> {
    const response = await api.get<Address[]>(ENDPOINTS.USERS_ADDRESSES)
    // Ensure response.data is always an array to prevent "map is not a function" error
    const data = response.data
    if (Array.isArray(data)) {
      return data
    }
    // If response is wrapped in an object (e.g., { addresses: [...] }), extract it
    if (data && typeof data === 'object') {
      const potentiallyWrapped = (data as any).addresses || (data as any).results || (data as any).data
      if (Array.isArray(potentiallyWrapped)) {
        return potentiallyWrapped
      }
    }
    // Return empty array as fallback
    console.warn("[UserService] getAddresses: response.data is not an array, returning empty array")
    return []
  },

  async createAddress(address: Omit<Address, "id" | "created_at" | "user_id">): Promise<Address> {
    const response = await api.post<Address>(ENDPOINTS.USERS_ADDRESS_CREATE, address)
    return response.data
  },

  async updateAddress(id: string, address: Partial<Omit<Address, "id" | "created_at" | "user_id">>): Promise<Address> {
    const response = await api.put<Address>(ENDPOINTS.USERS_ADDRESS_UPDATE(id), address)
    return response.data
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(ENDPOINTS.USERS_ADDRESS_DELETE(id))
  },
}
