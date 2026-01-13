import * as React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS } from "../constants/config"

import HomeScreen from "../screens/client/HomeScreen"
import SearchScreen from "../screens/client/SearchScreen"
import RestaurantDetailScreen from "../screens/client/RestaurantDetailScreen"
import RestaurantsMapScreen from "../screens/client/RestaurantsMapScreen"
import { CartScreen } from "../screens/client/CartScreen"
import { CheckoutScreen } from "../screens/client/CheckoutScreen"
import OrdersScreen from "../screens/client/OrdersScreen"
import OrderDetailScreen from "../screens/client/OrderDetailScreen"
import { OrderTrackingScreen } from "../screens/client/OrderTrackingScreen"
import { ProfileScreen } from "../screens/client/ProfileScreen"
import SettingsScreen from "../screens/client/SettingsScreen"
import { AddressesScreen } from "../screens/client/AddressesScreen"
import { AddAddressScreen } from "../screens/client/AddAddressScreen"
import { EditProfileScreen } from "../screens/client/EditProfileScreen"

export type ClientStackParamList = {
  Home: undefined
  Search: undefined
  RestaurantDetail: { id: string }
  Cart: undefined
  Checkout: undefined
  Orders: undefined
  OrderDetail: { id: string }
  OrderTracking: { id: string }
  Profile: undefined
  Settings: undefined
  Addresses: undefined
  AddAddress: { address?: import("../types").Address } | undefined
  EditProfile: undefined
  RestaurantsMap: undefined
}

const Stack = createNativeStackNavigator<ClientStackParamList>()
const Tab = createBottomTabNavigator()

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.dark,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RestaurantsMap" component={RestaurantsMapScreen} options={{ headerTitle: "Map" }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  )
}

const SearchStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.white,
        },
      }}
    >
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerTitle: "Search" }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  )
}

const OrdersStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.white,
        },
      }}
    >
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerTitle: "My Orders" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  )
}

const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.white,
        },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerTitle: "Profile" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerTitle: "Settings" }} />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ headerTitle: "My Addresses" }} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ headerTitle: "Add Address" }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: "Edit Profile" }} />
    </Stack.Navigator>
  )
}

const ClientNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home"
          if (route.name === "HomeStack") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "SearchStack") {
            iconName = focused ? "magnify" : "magnify"
          } else if (route.name === "OrdersStack") {
            iconName = focused ? "history" : "history"
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
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="SearchStack" component={SearchStack} options={{ tabBarLabel: "Search" }} />
      <Tab.Screen name="OrdersStack" component={OrdersStack} options={{ tabBarLabel: "Orders" }} />
      <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  )
}

export default ClientNavigator
