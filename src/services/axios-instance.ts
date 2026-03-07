import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { storage } from "../utils/storage"
import { API_BASE_URL } from "../config/env"

// Error codes for user deletion scenarios
export const AUTH_ERROR_CODES = {
  USER_NOT_FOUND: 'user_not_found',
  USER_DELETED: 'user_deleted',
  ACCOUNT_DEACTIVATED: 'account_deactivated',
} as const

type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES]

// Check if error response indicates user was deleted/deactivated
const isUserNotFoundError = (data: any): data is { code: AuthErrorCode; detail: string } => {
  if (typeof data !== 'object' || data === null) return false
  return (
    data.code === AUTH_ERROR_CODES.USER_NOT_FOUND ||
    data.code === AUTH_ERROR_CODES.USER_DELETED ||
    data.detail?.toLowerCase().includes('utilisateur') ||
    data.detail?.toLowerCase().includes('not found') ||
    data.detail?.toLowerCase().includes('deleted')
  )
}

class AxiosService {
  private axiosInstance: AxiosInstance

  constructor() {
    console.log("[AxiosService] Initialisation avec URL:", API_BASE_URL)
    
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    // Intercepteur de requête - ajoute le token et log les requêtes
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        console.log(`[Axios] ${config.method?.toUpperCase()} ${config.url}`)
        
        const token = await storage.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log("[Axios] Token d'authentification ajouté")
        }
        
        console.log("[Axios] Données de la requête:", config.data ? JSON.stringify(config.data) : "aucune donnée (requête GET/OPTIONS)")
        return config
      },
      (error: AxiosError) => {
        console.error("[Axios] Erreur de requête:", error.message)
        return Promise.reject(error)
      },
    )

    // Intercepteur de réponse - gère les erreurs et le refresh token
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Logger les données de réponse pour le débogage
        const responseData = response.data
        const responseSize = JSON.stringify(responseData).length
        console.log(`[Axios] Réponse ${response.status} pour ${response.config.url}`)
        console.log(`[Axios] Données de réponse:`, responseData ? `${responseSize} bytes` : "vide/null")
        if (responseData && typeof responseData === 'object') {
          // Afficher un résumé des clés pour les objects complexes
          console.log(`[Axios] Clés de réponse:`, Object.keys(responseData).join(', '))
        }
        return response
      },
      async (error: AxiosError) => {
        const errorConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
        
        // Logger les détails de l'erreur
        console.error(`[Axios] Erreur ${error.response?.status} pour ${errorConfig?.url}:`, error.message)
        
        // Logger le corps de la réponse d'erreur si disponible
        if (error.response?.data) {
          console.error("[Axios] Réponse d'erreur:", JSON.stringify(error.response.data, null, 2))
        }
        
        // Logger les headers de la réponse
        if (error.response?.headers) {
          console.error("[Axios] Headers de réponse:", JSON.stringify(error.response.headers, null, 2))
        }
        
        // Check if this is a user not found error (user was deleted)
        const errorData = error.response?.data
        if (
          error.response?.status === 401 &&
          errorData &&
          isUserNotFoundError(errorData)
        ) {
          console.error("[Axios] Utilisateur non trouvé (probablement supprimé). Nettoyage des tokens...")
          await storage.clearAll()
          // Create a special error to trigger logout
          const userNotFoundError = new Error('USER_NOT_FOUND') as AxiosError
          userNotFoundError.response = error.response
          return Promise.reject(userNotFoundError)
        }
        
        const originalRequest = errorConfig

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = await storage.getRefreshToken()
            if (refreshToken) {
              console.log("[Axios] Tentative de refresh du token...")
              const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                refresh: refreshToken,
              })

              const newAccessToken = response.data.access
              await storage.setAuthToken(newAccessToken)

              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              console.log("[Axios] Token rafraîchi avec succès")
              return this.axiosInstance(originalRequest)
            }
          } catch (refreshError) {
            console.error("[Axios] Échec du refresh token:", refreshError)
            await storage.clearAll()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance
  }
}

const axiosService = new AxiosService()
export default axiosService
