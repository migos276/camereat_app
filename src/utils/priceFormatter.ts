/**
 * Utility function to safely format prices
 * Handles cases where price is undefined, null, string, or a number
 */

/**
 * Safely formats a price value to a fixed decimal string
 * @param price - The price value (number, string, or undefined/null)
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback text if price is invalid (default: 'N/A')
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number | string | null | undefined,
  decimals: number = 2,
  fallback: string = 'N/A'
): string => {
  if (price === null || price === undefined) {
    return fallback
  }

  // Convert string to number if needed
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price

  // Check if it's a valid number
  if (isNaN(numericPrice) || !isFinite(numericPrice)) {
    return fallback
  }

  return numericPrice.toFixed(decimals)
}

/**
 * Calculate discount price
 * @param price - Original price
 * @param discountPercentage - Discount percentage (0-100)
 * @returns Discounted price or null if invalid
 */
export const calculateDiscountPrice = (
  price: number | string | null | undefined,
  discountPercentage: number | string | null | undefined
): number | null => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  const numericDiscount = typeof discountPercentage === 'string' ? parseFloat(discountPercentage) : discountPercentage

  if (
    numericPrice === null ||
    numericPrice === undefined ||
    numericDiscount === null ||
    numericDiscount === undefined ||
    isNaN(numericPrice) ||
    isNaN(numericDiscount) ||
    numericDiscount <= 0
  ) {
    return null
  }

  return numericPrice * (1 - numericDiscount / 100)
}

/**
 * Get display price (original or discounted if available)
 * @param price - Original price
 * @param discountPercentage - Optional discount percentage
 * @returns The price to display
 */
export const getDisplayPrice = (
  price: number | string | null | undefined,
  discountPercentage?: number | string | null | undefined
): number => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : (price || 0)
  
  if (discountPercentage !== undefined && discountPercentage !== null) {
    const discountPrice = calculateDiscountPrice(price, discountPercentage)
    if (discountPrice !== null) {
      return discountPrice
    }
  }
  
  return numericPrice
}

