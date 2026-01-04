import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { authService } from "../../services/auth-service"
import { storage } from "../../utils/storage"
import type { User } from "../../types"

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
}

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password)
      await storage.setAuthToken(response.access)
      await storage.setRefreshToken(response.refresh)
      await storage.setUserData(response.user)
      await storage.setUserType(response.user.user_type)
      return response
    } catch (error: any) {
      console.error("[AuthSlice] Erreur de connexion:", error)
      
      // Extraire le message d'erreur du backend de manière plus robuste
      let errorMessage = "Login failed"
      
      if (error.response) {
        const responseData = error.response.data
        
        // Essayer différentes structures de réponse d'erreur
        if (typeof responseData === 'string') {
          errorMessage = responseData
        } else if (typeof responseData === 'object') {
          // Format: {"error": "message"}
          if (responseData.error) {
            errorMessage = responseData.error
          }
          // Format: {"detail": "message"}
          else if (responseData.detail) {
            errorMessage = responseData.detail
          }
          // Format: {"non_field_errors": ["message"]}
          else if (responseData.non_field_errors && Array.isArray(responseData.non_field_errors)) {
            errorMessage = responseData.non_field_errors[0]
          }
          // Format: {"email": ["message"], "password": ["message"]}
          else if (responseData.email) {
            errorMessage = Array.isArray(responseData.email) ? responseData.email[0] : responseData.email
          } else if (responseData.password) {
            errorMessage = Array.isArray(responseData.password) ? responseData.password[0] : responseData.password
          }
          // Sinon, convertir l'objet en string
          else {
            try {
              errorMessage = JSON.stringify(responseData)
            } catch (e) {
              errorMessage = "Une erreur est survenue"
            }
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.error("[AuthSlice] Message d'erreur extrait:", errorMessage)
      return rejectWithValue(errorMessage)
    }
  },
)

export const register = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      email: string
      password: string
      phone: string  // CORRIGÉ: phone au lieu de phone_number
      first_name: string
      last_name: string
      user_type: string
      password_confirm?: string  // Added for registration
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("[AuthSlice] Données reçues pour inscription:", JSON.stringify(userData, null, 2))
      const response = await authService.register(userData)
      await storage.setAuthToken(response.access)
      await storage.setRefreshToken(response.refresh)
      await storage.setUserData(response.user)
      await storage.setUserType(response.user.user_type)
      return response
    } catch (error: any) {
      console.error("[AuthSlice] Erreur lors de l'inscription:", error)
      return rejectWithValue(error.response?.data || "Registration failed")
    }
  },
)

export const getCurrentUser = createAsyncThunk("auth/getCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const user = await authService.getCurrentUser()
    await storage.setUserData(user)
    return user
  } catch (error: any) {
    // Check if this is a user not found error (account deleted)
    const errorData = error.response?.data
    const isUserNotFound = 
      errorData?.code === 'user_not_found' ||
      errorData?.detail?.toLowerCase().includes('utilisateur') ||
      errorData?.detail?.toLowerCase().includes('not found') ||
      errorData?.detail?.toLowerCase().includes('deleted') ||
      error.message === 'USER_NOT_FOUND'
    
    if (isUserNotFound) {
      console.error("[AuthSlice] Utilisateur non trouvé - déconnexion automatique")
      // Clear all storage
      await storage.clearAll()
      // Return a special rejected value to trigger logout in extraReducers
      return rejectWithValue('USER_DELETED')
    }
    
    return rejectWithValue(error.response?.data?.detail || "Failed to fetch user")
  }
})

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await authService.logout()
    await storage.clearAll()
  } catch (error: any) {
    // Still clear storage even if logout API call fails
    await storage.clearAll()
  }
})

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(userData)
      await storage.setUserData(updatedUser)
      return updatedUser
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update profile")
    }
  },
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.access
        state.refreshToken = action.payload.refresh
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.access
        state.refreshToken = action.payload.refresh
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setTokens, clearError } = authSlice.actions
export default authSlice.reducer
