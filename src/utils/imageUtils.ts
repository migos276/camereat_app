import { API_BASE_URL } from "../config/env"

/**
 * Get the media base URL (without /api suffix)
 * Media files are served from the root, not from /api/
 * e.g., http://172.20.10.3:8000 instead of http://172.10.10.3:8000/api
 */
export const getMediaBaseUrl = (): string => {
  // Remove /api suffix if present
  let baseUrl = API_BASE_URL
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4) // Remove '/api'
  }
  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }
  return baseUrl
}

/**
 * Transform a relative image URL to an absolute URL
 * The backend returns relative URLs like "/media/products/image.jpg"
 * but React Native's Image component needs full URLs
 * 
 * IMPORTANT: Media files (images) are served from the root URL, not /api/
 * So /media/products/image.jpg becomes http://host:port/media/products/image.jpg
 * NOT http://host:port/api/media/products/image.jpg
 * 
 * @param imageUrl - The image URL from the backend (can be relative or absolute)
 * @returns The full absolute URL for the image
 */
export const getFullImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) {
    return null
  }

  // If already an absolute URL (starts with http:// or https://), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it's a relative URL (starts with /), prefix with media base URL (without /api)
  if (imageUrl.startsWith('/')) {
    return `${getMediaBaseUrl()}${imageUrl}`
  }

  // For any other case, return the original URL
  return imageUrl
}

/**
 * Get a placeholder image URL for products
 * @returns A placeholder image URL or null
 */
export const getProductPlaceholder = (): string | null => {
  // You can return a local placeholder or a remote one
  // For now, return null to show nothing when no image is available
  return null
}

