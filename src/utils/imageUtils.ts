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
  console.log("[getFullImageUrl] Input URL:", imageUrl)
  console.log("[getFullImageUrl] API_BASE_URL:", API_BASE_URL)
  
  if (!imageUrl) {
    console.log("[getFullImageUrl] No image URL, returning null")
    return null
  }

  const cleanedUrl = imageUrl.trim()
  if (!cleanedUrl) {
    console.log("[getFullImageUrl] Empty after trim, returning null")
    return null
  }

  // Local files selected from device gallery/camera
  if (cleanedUrl.startsWith("file://") || cleanedUrl.startsWith("content://")) {
    console.log("[getFullImageUrl] Local file URL, returning as-is")
    return cleanedUrl
  }

  // If already an absolute URL (starts with http:// or https://), return as-is
  if (cleanedUrl.startsWith("http://") || cleanedUrl.startsWith("https://")) {
    try {
      const image = new URL(cleanedUrl)
      // Backend can sometimes return localhost URLs, which are not reachable on device.
      if (["localhost", "127.0.0.1", "0.0.0.0"].includes(image.hostname)) {
        const mediaBase = new URL(getMediaBaseUrl())
        image.protocol = mediaBase.protocol
        image.hostname = mediaBase.hostname
        image.port = mediaBase.port
        console.log("[getFullImageUrl] Converted localhost URL to:", image.toString())
        return image.toString()
      }
    } catch {
      // Fallback to original absolute URL if parsing fails
    }
    console.log("[getFullImageUrl] Absolute URL, returning as-is:", cleanedUrl)
    return cleanedUrl
  }

  // If it's a relative URL (starts with /), prefix with media base URL (without /api)
  if (cleanedUrl.startsWith('/')) {
    const fullUrl = `${getMediaBaseUrl()}${cleanedUrl}`
    console.log("[getFullImageUrl] Relative URL converted to:", fullUrl)
    return fullUrl
  }

  // Handle "media/..." or other non-root relative paths
  if (!cleanedUrl.includes("://")) {
    const fullUrl = `${getMediaBaseUrl()}/${cleanedUrl.replace(/^\/+/, "")}`
    console.log("[getFullImageUrl] Non-standard path converted to:", fullUrl)
    return fullUrl
  }

  // For any other case, return the original URL
  console.log("[getFullImageUrl] Fallback, returning:", cleanedUrl)
  return cleanedUrl
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
