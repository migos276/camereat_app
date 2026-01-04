import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { livreurService } from "../../services/livreur-service"
import type { Livreur, Delivery } from "../../types"

interface LivreurState {
  profile: Livreur | null
  availableDeliveries: Delivery[]
  activeDelivery: Delivery | null
  deliveryHistory: Delivery[]
  statistics: any | null
  isLoading: boolean
  error: string | null
  isOnline: boolean
  currentPosition: { latitude: number; longitude: number } | null
}

const initialState: LivreurState = {
  profile: null,
  availableDeliveries: [],
  activeDelivery: null,
  deliveryHistory: [],
  statistics: null,
  isLoading: false,
  error: null,
  isOnline: false,
  currentPosition: null,
}

// <CHANGE> Async thunks for livreur profile management
export const getLivreurProfile = createAsyncThunk(
  "livreur/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await livreurService.getProfile()
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to fetch profile")
    }
  },
)

export const updateLivreurProfile = createAsyncThunk(
  "livreur/updateProfile",
  async (profileData: Partial<Livreur>, { rejectWithValue }) => {
    try {
      return await livreurService.updateProfile(profileData)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update profile")
    }
  },
)

// <CHANGE> Async thunks for delivery management
export const getAvailableDeliveries = createAsyncThunk(
  "livreur/getAvailableDeliveries",
  async (_, { rejectWithValue, getState }) => {
    try {
      // First check if user is a livreur type
      const state = getState() as { auth: { user: any } }
      const user = state.auth.user
      
      if (!user || user.user_type !== 'LIVREUR') {
        return rejectWithValue({
          error: 'not_livreur',
          detail: 'Vous devez être connecté en tant que livreur pour accéder à cette fonctionnalité.',
          code: 'NOT_LIVREUR'
        })
      }
      
      // Check if profile exists
      const state2 = getState() as { livreur: { profile: any } }
      if (!state2.livreur.profile) {
        return rejectWithValue({
          error: 'profile_not_found',
          detail: 'Profil livreur non trouvé. Veuillez compléter votre inscription.',
          code: 'PROFILE_NOT_FOUND',
          action: 'complete_profile'
        })
      }
      
      return await livreurService.getAvailableDeliveries()
    } catch (error: any) {
      const errorData = error.response?.data
      
      // Parse specific error codes from backend
      if (errorData) {
        if (errorData.code === 'profile_not_found') {
          return rejectWithValue({
            error: 'profile_not_found',
            detail: errorData.detail || 'Profil livreur non trouvé.',
            code: 'PROFILE_NOT_FOUND',
            action: 'complete_profile'
          })
        }
        if (errorData.code === 'account_inactive') {
          return rejectWithValue({
            error: 'account_inactive',
            detail: errorData.detail || 'Votre compte est désactivé.',
            code: 'ACCOUNT_INACTIVE'
          })
        }
        if (errorData.code === 'pending') {
          return rejectWithValue({
            error: 'pending_approval',
            detail: errorData.detail || 'Votre compte est en attente d\'approbation.',
            code: 'PENDING_APPROVAL',
            status: errorData.status
          })
        }
        if (errorData.code === 'rejected') {
          return rejectWithValue({
            error: 'rejected',
            detail: errorData.detail || 'Votre compte a été rejeté.',
            code: 'REJECTED',
            status: errorData.status
          })
        }
      }
      
      return rejectWithValue(errorData || {
        error: 'unknown',
        detail: 'Une erreur est survenue lors de la récupération des commandes.',
        code: 'UNKNOWN_ERROR'
      })
    }
  },
)

export const getNearbyDeliveries = createAsyncThunk(
  "livreur/getNearbyDeliveries",
  async (
    { latitude, longitude, radiusKm }: { latitude: number; longitude: number; radiusKm?: number },
    { rejectWithValue },
  ) => {
    try {
      return await livreurService.getNearbyDeliveries(latitude, longitude, radiusKm)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch nearby deliveries")
    }
  },
)

export const acceptDelivery = createAsyncThunk(
  "livreur/acceptDelivery",
  async (id: string, { rejectWithValue }) => {
    try {
      return await livreurService.acceptDelivery(id)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to accept delivery")
    }
  },
)

export const rejectDelivery = createAsyncThunk(
  "livreur/rejectDelivery",
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      await livreurService.rejectDelivery(id, reason)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to reject delivery")
    }
  },
)

export const updateDeliveryStatus = createAsyncThunk(
  "livreur/updateDeliveryStatus",
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      return await livreurService.updateDeliveryStatus(id, status)
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update delivery status")
    }
  },
)

// <CHANGE> Async thunks for position tracking
export const updatePosition = createAsyncThunk(
  "livreur/updatePosition",
  async ({ latitude, longitude }: { latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      await livreurService.updatePosition(latitude, longitude)
      return { latitude, longitude }
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update position")
    }
  },
)

// <CHANGE> Async thunk for statistics
export const getStatistics = createAsyncThunk(
  "livreur/getStatistics",
  async (_, { rejectWithValue }) => {
    try {
      return await livreurService.getStatistics()
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch statistics")
    }
  },
)

const livreurSlice = createSlice({
  name: "livreur",
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },
    clearActiveDelivery: (state) => {
      state.activeDelivery = null
    },
    clearError: (state) => {
      state.error = null
    },
    clearProfile: (state) => {
      state.profile = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // <CHANGE> Handle profile actions
      .addCase(getLivreurProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getLivreurProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(getLivreurProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateLivreurProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateLivreurProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(updateLivreurProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // <CHANGE> Handle delivery listing actions
      .addCase(getAvailableDeliveries.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getAvailableDeliveries.fulfilled, (state, action) => {
        state.isLoading = false
        state.availableDeliveries = action.payload
      })
      .addCase(getAvailableDeliveries.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(getNearbyDeliveries.fulfilled, (state, action) => {
        state.availableDeliveries = action.payload
      })
      // <CHANGE> Handle delivery accept/reject actions
      .addCase(acceptDelivery.pending, (state) => {
        state.isLoading = true
      })
      .addCase(acceptDelivery.fulfilled, (state, action) => {
        state.isLoading = false
        state.activeDelivery = action.payload
        state.availableDeliveries = state.availableDeliveries.filter((d) => d.id !== action.payload.id)
      })
      .addCase(acceptDelivery.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(rejectDelivery.fulfilled, (state, action) => {
        state.availableDeliveries = state.availableDeliveries.filter((d) => d.id !== action.payload)
      })
      // <CHANGE> Handle delivery status updates
      .addCase(updateDeliveryStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.activeDelivery = action.payload
        if (action.payload.status === "delivered") {
          state.deliveryHistory.unshift(action.payload)
          state.activeDelivery = null
        }
      })
      .addCase(updateDeliveryStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // <CHANGE> Handle position updates
      .addCase(updatePosition.fulfilled, (state, action) => {
        state.currentPosition = action.payload
      })
      // <CHANGE> Handle statistics
      .addCase(getStatistics.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getStatistics.fulfilled, (state, action) => {
        state.isLoading = false
        state.statistics = action.payload
      })
      .addCase(getStatistics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setOnlineStatus, clearActiveDelivery, clearError, clearProfile } = livreurSlice.actions
export default livreurSlice.reducer
