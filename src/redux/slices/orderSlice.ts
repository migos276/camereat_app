import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { orderService } from "../../services/order-service"
import type { Order } from "../../types"

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  totalCount: number
  page: number
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  page: 1,
}

export const createOrder = createAsyncThunk(
  "order/create",
  async (
    orderData: {
      restaurant_id?: string
      supermarket_id?: string
      items: Array<{ product_id: string; quantity: number }>
      delivery_address_id: string
    },
    { rejectWithValue },
  ) => {
    try {
      return await orderService.createOrder(orderData)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to create order")
    }
  },
)

export const listOrders = createAsyncThunk(
  "order/list",
  async ({ page = 1, status }: { page?: number; status?: string }, { rejectWithValue }) => {
    try {
      return await orderService.listOrders(page, status)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch orders")
    }
  },
)

export const getOrder = createAsyncThunk("order/get", async (id: string, { rejectWithValue }) => {
  try {
    return await orderService.getOrder(id)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to fetch order")
  }
})

export const cancelOrder = createAsyncThunk("order/cancel", async (id: string, { rejectWithValue }) => {
  try {
    return await orderService.cancelOrder(id)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to cancel order")
  }
})

export const trackOrder = createAsyncThunk("order/track", async (id: string, { rejectWithValue }) => {
  try {
    return await orderService.trackOrder(id)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to track order")
  }
})

export const validateOTP = createAsyncThunk(
  "order/validateOTP",
  async ({ id, otp }: { id: string; otp: string }, { rejectWithValue }) => {
    try {
      return await orderService.validateOTP(id, otp)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to validate OTP")
    }
  },
)

export const rateOrder = createAsyncThunk(
  "order/rate",
  async ({ id, rating, comment }: { id: string; rating: number; comment?: string }, { rejectWithValue }) => {
    try {
      return await orderService.rateOrder(id, rating, comment)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to rate order")
    }
  },
)

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(listOrders.pending, (state) => {
        state.isLoading = true
      })
      .addCase(listOrders.fulfilled, (state, action) => {
        state.isLoading = false
        // Handle both paginated { results: [...], count: X } and non-paginated [...] responses
        if (Array.isArray(action.payload)) {
          state.orders = action.payload
          state.totalCount = action.payload.length
        } else if (action.payload.results && Array.isArray(action.payload.results)) {
          state.orders = action.payload.results
          state.totalCount = action.payload.count || action.payload.results.length
        } else {
          state.orders = []
          state.totalCount = 0
        }
      })
      .addCase(listOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(getOrder.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(getOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.currentOrder = { ...state.currentOrder, ...action.payload } as Order
      })
      .addCase(validateOTP.pending, (state) => {
        state.isLoading = true
      })
      .addCase(validateOTP.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(validateOTP.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(rateOrder.pending, (state) => {
        state.isLoading = true
      })
      .addCase(rateOrder.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(rateOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearCurrentOrder, clearError } = orderSlice.actions
export default orderSlice.reducer
