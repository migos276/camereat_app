import type React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS } from "../constants/config"

import RestaurantHomeScreen from "../screens/restaurant/RestaurantHomeScreen"
import RestaurantOrdersScreen from "../screens/restaurant/OrdersScreen"
import OrderDetailScreen from "../screens/restaurant/OrderDetailScreen"
import { RestaurantMenuScreen as MenuScreen } from "../screens/restaurant/MenuScreen"
import RestaurantProfileScreen from "../screens/restaurant/RestaurantProfileScreen"
import AddProductScreen from "../screens/restaurant/AddProductScreen"
import { EditProfileScreen } from "../screens/restaurant/EditProfileScreen"

export type RestaurantStackParamList = {
  RestaurantHome: undefined
  Orders: undefined
  OrderDetail: { id: string }
  Menu: undefined
  AddProduct: undefined
  RestaurantProfile: undefined
  EditProfile: undefined
}

const Stack = createNativeStackNavigator<RestaurantStackParamList>()
const Tab = createBottomTabNavigator()

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="RestaurantHome" component={RestaurantHomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const OrdersStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="Orders" component={RestaurantOrdersScreen} options={{ headerTitle: "Orders" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  )
}

const MenuStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="Menu" component={MenuScreen} options={{ headerTitle: "Menu" }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerTitle: "Add Product" }} />
    </Stack.Navigator>
  )
}

const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="RestaurantProfile" component={RestaurantProfileScreen} options={{ headerTitle: "Profile" }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: "Edit Profile" }} />
    </Stack.Navigator>
  )
}

const RestaurantNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "home"
          if (route.name === "HomeStack") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "OrdersStack") {
            iconName = focused ? "clipboard-list" : "clipboard-list"
          } else if (route.name === "MenuStack") {
            iconName = focused ? "menu" : "menu"
          } else if (route.name === "ProfileStack") {
            iconName = focused ? "account" : "account-outline"
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />
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
      <Tab.Screen name="OrdersStack" component={OrdersStack} options={{ tabBarLabel: "Orders" }} />
      <Tab.Screen name="MenuStack" component={MenuStack} options={{ tabBarLabel: "Menu" }} />
      <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  )
}

export default RestaurantNavigator
