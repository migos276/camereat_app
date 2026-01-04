import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { storage } from '../../utils/storage'

interface ThemeState {
  darkMode: boolean
  loading: boolean
}

const initialState: ThemeState = {
  darkMode: false,
  loading: false,
}

// Async thunk to load dark mode preference from storage
export const loadDarkModePreference = createAsyncThunk(
  'theme/loadDarkMode',
  async () => {
    const isDark = await storage.getDarkMode()
    return isDark
  }
)

// Async thunk to save dark mode preference to storage
export const saveDarkModePreference = createAsyncThunk(
  'theme/saveDarkMode',
  async (isDark: boolean) => {
    await storage.setDarkMode(isDark)
    return isDark
  }
)

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDarkModePreference.pending, (state) => {
        state.loading = true
      })
      .addCase(loadDarkModePreference.fulfilled, (state, action) => {
        state.darkMode = action.payload
        state.loading = false
      })
      .addCase(loadDarkModePreference.rejected, (state) => {
        state.loading = false
      })
      .addCase(saveDarkModePreference.fulfilled, (state, action) => {
        state.darkMode = action.payload
      })
  },
})

export const { toggleDarkMode, setDarkMode } = themeSlice.actions
export default themeSlice.reducer

