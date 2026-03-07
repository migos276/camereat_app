import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { User, AuthResponse } from "../types"

const api = axiosService.getInstance()

// Mapping des types d'utilisateurs frontend vers les valeurs attendues par le backend
const USER_TYPE_MAPPING: Record<string, string> = {
  'client': 'CLIENT',
  'restaurant': 'RESTAURANT',
  'supermarket': 'SUPERMARCHE',
  'livreur': 'LIVREUR',
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log("[AuthService] Tentative de connexion pour:", email)
    const response = await api.post<AuthResponse>(ENDPOINTS.AUTH_LOGIN, {
      email,
      password,
    })
    console.log("[AuthService] Connexion réussie")
    return response.data
  },

  async register(userData: {
    email: string
    password: string
    phone: string
    first_name: string
    last_name: string
    user_type: string
  }): Promise<AuthResponse> {
    console.log("[AuthService] Début inscription pour:", userData.email)
    
    // Convertir user_type frontend vers la valeur attendue par le backend
    const backendUserType = USER_TYPE_MAPPING[userData.user_type.toLowerCase()] || userData.user_type.toUpperCase()
    
    console.log("[AuthService] Conversion user_type:", userData.user_type, "→", backendUserType)
    
    const normalizedData = {
      ...userData,
      user_type: backendUserType,
    }
    
    console.log("[AuthService] Données envoyées:", JSON.stringify(normalizedData, null, 2))
    
    const response = await api.post<AuthResponse>(ENDPOINTS.AUTH_REGISTER, normalizedData)
    console.log("[AuthService] Inscription réussie!")
    return response.data
  },

  async logout(): Promise<void> {
    await api.post(ENDPOINTS.AUTH_LOGOUT)
  },

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const response = await api.post(ENDPOINTS.AUTH_REFRESH, {
      refresh: refreshToken,
    })
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(ENDPOINTS.USERS_PROFILE)
    return response.data
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put<User>(ENDPOINTS.USERS_UPDATE_PROFILE, userData)
    return response.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post(ENDPOINTS.USERS_CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    })
  },

  async resetPassword(email: string): Promise<void> {
    await api.post(ENDPOINTS.AUTH_PASSWORD_RESET, { email })
  },

  async confirmPasswordReset(token: string, password: string, confirmPassword: string): Promise<void> {
    await api.post(ENDPOINTS.AUTH_PASSWORD_CONFIRM, {
      token,
      password,
      password_confirm: confirmPassword,
    })
  },
}
