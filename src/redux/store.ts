import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import orderReducer from "./slices/orderSlice"
import restaurantReducer from "./slices/restaurantSlice"
import cartReducer from "./slices/cartSlice"
// <CHANGE> Import livreur reducer
import livreurReducer from "./slices/livreurSlice"
import themeReducer from "./slices/themeSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    order: orderReducer,
    restaurant: restaurantReducer,
    cart: cartReducer,
    // <CHANGE> Add livreur reducer to store
    livreur: livreurReducer,
    theme: themeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
