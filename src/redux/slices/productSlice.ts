import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { productService } from "../../services/product-service"
import type { Product } from "../../types"

interface ProductState {
  products: Product[]
  isLoading: boolean
  error: string | null
  currentPage: number
  totalCount: number
}

const initialState: ProductState = {
  products: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalCount: 0,
}

/**
 * Normalize product price to ensure it's always a number
 */
const normalizeProductPrice = (product: Product): Product => {
  let price = product.price
  
  // If price is a string, convert to number
  if (typeof price === 'string') {
    const parsed = parseFloat(price)
    price = isNaN(parsed) ? 0 : parsed
  }
  
  // If price is null or undefined, default to 0
  if (price === null || price === undefined) {
    price = 0
  }
  
  return {
    ...product,
    price,
  }
}

/**
 * Normalize products array to ensure all prices are numbers
 */
const normalizeProducts = (products: Product[]): Product[] => {
  return products.map(normalizeProductPrice)
}

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params: { restaurant?: string; supermarche?: string; page?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to fetch products")
    }
  },
)

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }: { id: string; data: Partial<Product> }, { rejectWithValue }) => {
    try {
      const updatedProduct = await productService.updateProduct(id, data)
      return updatedProduct
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to update product")
    }
  },
)

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetProducts: (state) => {
      state.products = []
      state.currentPage = 1
      state.totalCount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.products = normalizeProducts(action.payload.results)
        state.totalCount = action.payload.count
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false
        const normalizedProduct = normalizeProductPrice(action.payload)
        const index = state.products.findIndex(product => product.id === normalizedProduct.id)
        if (index !== -1) {
          state.products[index] = normalizedProduct
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, resetProducts } = productSlice.actions
export default productSlice.reducer
