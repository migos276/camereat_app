import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { restaurantService } from "../../services/restaurant-service"
import type { Restaurant, Product } from "../../types"

interface RestaurantState {
  restaurants: Restaurant[]
  allRestaurants: Restaurant[] // Exhaustive list for search screen
  currentRestaurant: Restaurant | null
  menu: Product[]
  searchResults: Restaurant[]
  menuSearchResults: Product[]
  isLoading: boolean
  error: string | null
  totalCount: number
  allRestaurantsCount: number
  allRestaurantsPage: number
  allRestaurantsHasMore: boolean
}

const initialState: RestaurantState = {
  restaurants: [],
  allRestaurants: [],
  currentRestaurant: null,
  menu: [],
  searchResults: [],
  menuSearchResults: [],
  isLoading: false,
  error: null,
  totalCount: 0,
  allRestaurantsCount: 0,
  allRestaurantsPage: 1,
  allRestaurantsHasMore: false, // Start as false until we know there are more
}

export const listRestaurants = createAsyncThunk("restaurant/list", async (page: number | undefined, { rejectWithValue }) => {
  try {
    return await restaurantService.listRestaurants(page ?? 1)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to fetch restaurants")
  }
})

export const getRestaurant = createAsyncThunk("restaurant/get", async (id: string, { rejectWithValue }) => {
  try {
    return await restaurantService.getRestaurant(id)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to fetch restaurant")
  }
})

export const getNearbyRestaurants = createAsyncThunk(
  "restaurant/nearby",
  async (
    { latitude, longitude, radiusKm }: { latitude: number; longitude: number; radiusKm?: number },
    { rejectWithValue },
  ) => {
    try {
      return await restaurantService.getNearbyRestaurants(latitude, longitude, radiusKm)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch nearby restaurants")
    }
  },
)

export const getRestaurantMenu = createAsyncThunk("restaurant/menu", async (id: string, { rejectWithValue }) => {
  try {
    return await restaurantService.getRestaurantMenu(id)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to fetch menu")
  }
})

export const searchRestaurants = createAsyncThunk("restaurant/search", async (query: string, { rejectWithValue }) => {
  try {
    return await restaurantService.searchRestaurants(query)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to search restaurants")
  }
})

export const searchMenuItems = createAsyncThunk("restaurant/searchMenu", async (query: string, { rejectWithValue }) => {
  try {
    return await restaurantService.searchMenuItems(query)
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to search menu items")
  }
})

export const loadAllRestaurants = createAsyncThunk(
  "restaurant/loadAll",
  async (page: number | undefined, { getState, rejectWithValue }) => {
    const state = getState() as { restaurant: RestaurantState }
    const currentPage = page ?? 1
    
    // If loading page 1, reset the page counter in state
    if (currentPage === 1) {
      // This is handled in the reducer
    }
    
    try {
      const result = await restaurantService.listRestaurants(currentPage)
      return { ...result, page: currentPage }
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to load restaurants")
    }
  },
)

const restaurantSlice = createSlice({
  name: "restaurant",
  initialState,
  reducers: {
    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null
      state.menu = []
    },
    clearError: (state) => {
      state.error = null
    },
    clearSearchResults: (state) => {
      state.searchResults = []
      state.menuSearchResults = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listRestaurants.pending, (state) => {
        state.isLoading = true
      })
      .addCase(listRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        // Safety check: ensure results is an array
        state.restaurants = Array.isArray(action.payload.results) ? action.payload.results : []
        state.totalCount = action.payload.count || state.restaurants.length
      })
      .addCase(listRestaurants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(getRestaurant.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getRestaurant.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentRestaurant = action.payload
      })
      .addCase(getRestaurant.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(getNearbyRestaurants.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getNearbyRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        state.restaurants = action.payload
      })
      .addCase(getNearbyRestaurants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(getRestaurantMenu.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getRestaurantMenu.fulfilled, (state, action) => {
        state.isLoading = false
        state.menu = action.payload
      })
      .addCase(getRestaurantMenu.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(searchRestaurants.pending, (state) => {
        state.isLoading = true
      })
      .addCase(searchRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        state.searchResults = action.payload
      })
      .addCase(searchRestaurants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(searchMenuItems.pending, (state) => {
        state.isLoading = true
      })
      .addCase(searchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.menuSearchResults = action.payload
      })
      .addCase(searchMenuItems.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(loadAllRestaurants.pending, (state) => {
        state.isLoading = true
      })
      .addCase(loadAllRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        // Safety check: ensure results is an array
        const newRestaurants = Array.isArray(action.payload.results) ? action.payload.results : []
        const page = action.payload.page || 1
        
        if (page === 1) {
          state.allRestaurants = newRestaurants
          state.allRestaurantsPage = 1
        } else {
          state.allRestaurants = [...state.allRestaurants, ...newRestaurants]
          state.allRestaurantsPage = page
        }
        state.allRestaurantsCount = action.payload.count || newRestaurants.length
        // Calculate hasMore AFTER updating the array with new items
        // If we loaded less than total count, there are more pages
        state.allRestaurantsHasMore = newRestaurants.length > 0 && 
          state.allRestaurants.length < (action.payload.count || newRestaurants.length)
      })
      .addCase(loadAllRestaurants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearCurrentRestaurant, clearError, clearSearchResults } = restaurantSlice.actions
export default restaurantSlice.reducer
