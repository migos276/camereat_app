import AsyncStorage from "@react-native-async-storage/async-storage"

const KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  USER_TYPE: "user_type",
  DARK_MODE: "dark_mode",
  LANGUAGE: "language",
}

export const storage = {
  async setAuthToken(token: string) {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token)
  },

  async getAuthToken() {
    return await AsyncStorage.getItem(KEYS.AUTH_TOKEN)
  },

  async setRefreshToken(token: string) {
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token)
  },

  async getRefreshToken() {
    return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN)
  },

  async setUserData(userData: any) {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData))
  },

  async getUserData() {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA)
    return data ? JSON.parse(data) : null
  },

  async setUserType(userType: string) {
    await AsyncStorage.setItem(KEYS.USER_TYPE, userType)
  },

  async getUserType() {
    return await AsyncStorage.getItem(KEYS.USER_TYPE)
  },

  async setDarkMode(isDark: boolean) {
    await AsyncStorage.setItem(KEYS.DARK_MODE, JSON.stringify(isDark))
  },

  async getDarkMode() {
    const data = await AsyncStorage.getItem(KEYS.DARK_MODE)
    return data ? JSON.parse(data) : false
  },

  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(KEYS))
  },
}
