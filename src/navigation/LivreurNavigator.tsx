import type React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS } from "../constants/config"

import LivreurHomeScreen from "../screens/livreur/LivreurHomeScreen"
import DeliveriesScreen from "../screens/livreur/DeliveriesScreen"
import DeliveryDetailScreen from "../screens/livreur/DeliveryDetailScreen"
import { ActiveDeliveryScreen } from "../screens/livreur/ActiveDeliveryScreen"
import { EarningsScreen } from "../screens/livreur/EarningsScreen"
import LivreurProfileScreen from "../screens/livreur/LivreurProfileScreen"
import LivreurSettingsScreen from "../screens/livreur/LivreurSettingsScreen"

export type LivreurStackParamList = {
  LivreurHome: undefined
  Deliveries: undefined
  DeliveryDetail: { id: string }
  ActiveDelivery: { id: string }
  Earnings: undefined
  LivreurProfile: undefined
  LivreurSettings: undefined
}

const Stack = createNativeStackNavigator<LivreurStackParamList>()
const Tab = createBottomTabNavigator()

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Stack.Screen name="LivreurHome" component={LivreurHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </Stack.Navigator>
  )
}

const DeliveriesStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} options={{ headerTitle: "Available" }} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    </Stack.Navigator>
  )
}

const EarningsStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="Earnings" component={EarningsScreen} options={{ headerTitle: "Earnings" }} />
    </Stack.Navigator>
  )
}

const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="LivreurProfile" component={LivreurProfileScreen} options={{ headerTitle: "Profile" }} />
      <Stack.Screen name="LivreurSettings" component={LivreurSettingsScreen} options={{ headerTitle: "Settings" }} />
    </Stack.Navigator>
  )
}

const LivreurNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home"
          if (route.name === "HomeStack") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "DeliveriesStack") {
            iconName = focused ? "truck-delivery" : "truck-delivery-outline"
          } else if (route.name === "EarningsStack") {
            iconName = focused ? "wallet" : "wallet-outline"
          } else if (route.name === "ProfileStack") {
            iconName = focused ? "account" : "account-outline"
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.lightGray,
        },
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="DeliveriesStack" component={DeliveriesStack} options={{ tabBarLabel: "Deliveries" }} />
      <Tab.Screen name="EarningsStack" component={EarningsStack} options={{ tabBarLabel: "Earnings" }} />
      <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  )
}

export default LivreurNavigator
