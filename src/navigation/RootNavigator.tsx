"use client"

import type React from "react"
import { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import type { RootState } from "../redux/store"
import { useAppDispatch, useAppSelector } from "../hooks"
import { getCurrentUser, logout } from "../redux/slices/authSlice"
import { storage } from "../utils/storage"
import AuthNavigator from "./AuthNavigator"
import ClientNavigator from "./ClientNavigator"
import LivreurNavigator from "./LivreurNavigator"
import RestaurantNavigator from "./RestaurantNavigator"
import SupermarchéNavigator from "./SupermarchéNavigator"
import SplashScreen from "../screens/SplashScreen"

const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state: RootState) => state.auth)

  useEffect(() => {
    bootstrapAsync()
  }, [])

  const bootstrapAsync = async () => {
    try {
      const storedToken = await storage.getAuthToken()
      if (storedToken) {
        dispatch(getCurrentUser())
      }
    } catch (e) {
      console.error("Failed to restore token:", e)
      await storage.clearAll()
    }
  }

  // Handle user deleted error - auto logout
  useEffect(() => {
    if (error === 'USER_DELETED' || error?.includes('utilisateur')) {
      console.log("[RootNavigator] Compte utilisateur supprimé - déconnexion...")
      dispatch(logout())
    }
  }, [error, dispatch])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.user_type?.toLowerCase() === "client" ? (
        <ClientNavigator />
      ) : user?.user_type?.toLowerCase() === "livreur" ? (
        <LivreurNavigator />
      ) : user?.user_type?.toLowerCase() === "restaurant" ? (
        <RestaurantNavigator />
      ) : user?.user_type?.toLowerCase() === "supermarche" ? (
        <SupermarchéNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  )
}

export default RootNavigator
