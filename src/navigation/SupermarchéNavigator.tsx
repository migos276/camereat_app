import type React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS } from "../constants/config"

import SupermarketHomeScreen from "../screens/supermarket/SupermarketHomeScreen"
import SupermarketOrdersScreen from "../screens/supermarket/SupermarketOrdersScreen"
import SupermarketOrderDetailScreen from "../screens/supermarket/SupermarketOrderDetailScreen"
import SupermarketProductsScreen from "../screens/supermarket/SupermarketProductsScreen"
import SupermarketProfileScreen from "../screens/supermarket/SupermarketProfileScreen"
import AddProductScreen from "../screens/supermarche/AddProductScreen"

export type SupermarchéStackParamList = {
  SupermarketHome: undefined
  SupermarketOrders: undefined
  SupermarketOrderDetail: { id: string }
  SupermarketProducts: undefined
  AddProduct: undefined
  SupermarketProfile: undefined
}

const Stack = createNativeStackNavigator<SupermarchéStackParamList>()
const Tab = createBottomTabNavigator()

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="SupermarketHome" component={SupermarketHomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const OrdersStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen name="SupermarketOrders" component={SupermarketOrdersScreen} options={{ headerTitle: "Orders" }} />
      <Stack.Screen name="SupermarketOrderDetail" component={SupermarketOrderDetailScreen} />
    </Stack.Navigator>
  )
}

const ProductsStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen
        name="SupermarketProducts"
        component={SupermarketProductsScreen}
        options={{ headerTitle: "Products" }}
      />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerTitle: "Add Product" }} />
    </Stack.Navigator>
  )
}

const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: COLORS.white } }}>
      <Stack.Screen
        name="SupermarketProfile"
        component={SupermarketProfileScreen}
        options={{ headerTitle: "Profile" }}
      />
    </Stack.Navigator>
  )
}

const SupermarchéNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home"
          if (route.name === "HomeStack") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "OrdersStack") {
            iconName = focused ? "clipboard-list" : "clipboard-list"
          } else if (route.name === "ProductsStack") {
            iconName = focused ? "shopping" : "shopping"
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
      <Tab.Screen name="ProductsStack" component={ProductsStack} options={{ tabBarLabel: "Products" }} />
      <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  )
}

export default SupermarchéNavigator
