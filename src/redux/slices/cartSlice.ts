import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Product, Restaurant, Address } from "../../types"

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  selectedRestaurantId: string | null
  selectedSupermarketId: string | null
  restaurant: Restaurant | null
  supermarket: Restaurant | null
  deliveryAddress: Address | null
}

const initialState: CartState = {
  items: [],
  selectedRestaurantId: null,
  selectedSupermarketId: null,
  restaurant: null,
  supermarket: null,
  deliveryAddress: null,
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setRestaurant: (state, action: PayloadAction<Restaurant | null>) => {
      state.restaurant = action.payload
      if (action.payload) {
        state.selectedRestaurantId = action.payload.id
        state.selectedSupermarketId = null
        state.supermarket = null
      }
    },
    setSupermarket: (state, action: PayloadAction<Restaurant | null>) => {
      state.supermarket = action.payload
      if (action.payload) {
        state.selectedSupermarketId = action.payload.id
        state.selectedRestaurantId = null
        state.restaurant = null
      }
    },
    setDeliveryAddress: (state, action: PayloadAction<Address | null>) => {
      state.deliveryAddress = action.payload
    },
    addToCart: (
      state,
      action: PayloadAction<{
        product: Product
        quantity: number
        sourceId: string
        sourceType: "restaurant" | "supermarket"
      }>,
    ) => {
      const existingItem = state.items.find((item) => item.product.id === action.payload.product.id)
      const { sourceType } = action.payload

      // Check if switching sources
      if (sourceType === "restaurant" && state.selectedSupermarketId) {
        state.items = []
        state.selectedRestaurantId = action.payload.sourceId
        state.selectedSupermarketId = null
      } else if (sourceType === "supermarket" && state.selectedRestaurantId) {
        state.items = []
        state.selectedRestaurantId = null
        state.selectedSupermarketId = action.payload.sourceId
      } else {
        if (sourceType === "restaurant") state.selectedRestaurantId = action.payload.sourceId
        if (sourceType === "supermarket") state.selectedSupermarketId = action.payload.sourceId
      }

      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.product.id !== action.payload)
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((item) => item.product.id === action.payload.productId)
      if (item) {
        item.quantity = action.payload.quantity
        if (item.quantity <= 0) {
          state.items = state.items.filter((item) => item.product.id !== action.payload.productId)
        }
      }
    },
    clearCart: (state) => {
      state.items = []
      state.selectedRestaurantId = null
      state.selectedSupermarketId = null
      state.restaurant = null
      state.supermarket = null
      state.deliveryAddress = null
    },
  },
})

export const { setRestaurant, setSupermarket, setDeliveryAddress, addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer
