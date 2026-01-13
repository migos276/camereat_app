// Charger les variables d'environnement pour Expo
// NOTE: Les variables .env doivent être définies dans le fichier .env à la racine
// et Expo les chargera automatiquement avec le préfixe EXPO_PUBLIC_

// Pour Expo, les variables d'environnement sont accessibles via process.env
// mais seulement si elles ont le préfixe EXPO_PUBLIC_

// Fallback URL si la variable d'environnement n'est pas définie
// IMPORTANT: Remplacer cette IP par votre adresse IP locale!
// Sur Linux/Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
// Sur Windows: ipconfig | findstr /R "IPv4 Address"

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
  if (envUrl) {
    console.log("[API Config] URL chargée depuis .env:", envUrl)
    return envUrl
  }
  
  // Fallback par défaut - À MODIFIER avec votre IP locale!
  const defaultUrl = "http://20.20.20.204:8000/api"
  console.log("[API Config] URL par défaut utilisée:", defaultUrl)
  return defaultUrl
}

const getSocketUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL
  if (envUrl) {
    return envUrl
  }
  return "http://20.20.20.204:8000"
}

export const API_BASE_URL = getApiBaseUrl()
export const SOCKET_URL = getSocketUrl()

// Timeout des requêtes API (en millisecondes)
export const API_TIMEOUT = 15000

// Activer les logs de débogage en mode développement
export const DEBUG_MODE = __DEV__

// Clés de stockage
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  USER_TYPE: "user_type",
}

// URL de l'API (exportée pour compatibilité)
export { API_BASE_URL as default }

