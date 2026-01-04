import * as Location from "expo-location"
import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"

const api = axiosService.getInstance()

export const geolocationService = {
  async requestLocationPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === "granted"
  },

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      return location
    } catch (error) {
      console.error("Error getting location:", error)
      return null
    }
  },

  async startLocationTracking(callback: (location: Location.LocationObject) => void) {
    try {
      return Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback,
      )
    } catch (error) {
      console.error("Error starting location tracking:", error)
      return null
    }
  },

  async geocodeAddress(address: string): Promise<any> {
    const response = await api.post(ENDPOINTS.GEOLOCATION_GEOCODE, {
      address,
    })
    return response.data
  },

  async reverseGeocodeLocation(latitude: number, longitude: number): Promise<any> {
    const response = await api.post(ENDPOINTS.GEOLOCATION_REVERSE_GEOCODE, {
      latitude,
      longitude,
    })
    return response.data
  },

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const address = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (address.length > 0) {
        const addr = address[0]
        return `${addr.name}, ${addr.city}, ${addr.region}`
      }
      return "Unknown Location"
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      return "Unknown Location"
    }
  },
}
