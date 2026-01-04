import axios from "axios"
import { API_BASE_URL } from "../../config/env"

/**
 * Utilitaire pour tester la connectivité réseau avec le backend
 * Utile pour diagnostiquer les problèmes de connexion
 */

export const testNetworkConnection = async (): Promise<{
  success: boolean
  message: string
  details?: any
}> => {
  console.log("[NetworkTest] Début du test de connectivité...")
  console.log("[NetworkTest] URL de base:", API_BASE_URL)

  // Test 1: Vérifier si le serveur est accessible (ping HTTP)
  try {
    console.log("[NetworkTest] Test 1: Ping HTTP vers", API_BASE_URL)
    const pingResponse = await axios.get(`${API_BASE_URL.replace("/api", "")}/api/schema/`, {
      timeout: 5000,
    })
    console.log("[NetworkTest] Ping réussi:", pingResponse.status)
  } catch (pingError: any) {
    console.warn("[NetworkTest] Ping échoué:", pingError.message)
  }

  // Test 2: Vérifier l'endpoint d'authentification
  try {
    console.log("[NetworkTest] Test 2: Connexion à l'endpoint d'authentification")
    const authResponse = await axios.post(
      `${API_BASE_URL}/auth/login/`,
      { email: "test@test.com", password: "test123" },
      { timeout: 5000 },
    )
    console.log("[NetworkTest] Auth endpoint accessible:", authResponse.status)
    return {
      success: true,
      message: "Connexion au serveur réussie!",
      details: { authEndpoint: "accessible" },
    }
  } catch (authError: any) {
    console.warn("[NetworkTest] Auth endpoint erreur:", authError.message)

    // Différencier les types d'erreurs
    if (authError.code === "ECONNREFUSED") {
      return {
        success: false,
        message: "Connexion refusée! Le serveur backend n'est peut-être pas démarré.",
        details: {
          error: authError.message,
          suggestion: "Exécutez: python manage.py runserver 0.0.0.0:8000",
        },
      }
    }

    if (authError.response) {
      // Le serveur a répondu mais avec une erreur (401, 400, etc.)
      // C'est bon signe - le serveur est accessible!
      return {
        success: true,
        message: "Serveur accessible! (Erreur attendue: utilisateur non trouvé)",
        details: {
          status: authError.response.status,
          serverReachable: true,
        },
      }
    }

    if (authError.request) {
      // La requête a été envoyée mais pas de réponse
      return {
        success: false,
        message: "Pas de réponse du serveur. Vérifiez votre connexion réseau.",
        details: {
          error: authError.message,
          suggestions: [
            "Vérifiez que le backend est démarré: python manage.py runserver 0.0.0.0:8000",
            "Vérifiez votre adresse IP dans la configuration",
            "Vérifiez le pare-feu",
            "Vérifiez que CORS est configuré correctement",
          ],
        },
      }
    }

    return {
      success: false,
      message: "Erreur de connexion: " + authError.message,
      details: { error: authError.message },
    }
  }
}

/**
 * Test simplifié pour un affichage rapide
 */
export const quickConnectivityCheck = async (): Promise<boolean> => {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/login/`,
      { email: "test@test.com", password: "test" },
      { timeout: 3000 },
    )
    return true
  } catch (error: any) {
    // Si on reçoit une réponse (même une erreur 401/400), le serveur est joignable
    if (error.response) {
      return true
    }
    return false
  }
}

/**
 * Obtenir des informations sur la configuration réseau actuelle
 */
export const getNetworkInfo = () => {
  return {
    apiBaseUrl: API_BASE_URL,
    isExpoGo: !!process.env.EXPO_PUBLIC_API_URL,
    timestamp: new Date().toISOString(),
  }
}

