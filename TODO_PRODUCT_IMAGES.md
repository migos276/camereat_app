# Task: Add Product Images to RestaurantDetailScreen

## Status: ✅ COMPLETED - FIXED

### Files Modified:
1. `src/utils/imageUtils.ts` - Utility function to convert relative image URLs to absolute URLs
2. `src/screens/client/RestaurantDetailScreen.tsx` - Now displays product images correctly

### Changes Made:

#### 1. New Utility Function (`src/utils/imageUtils.ts`):
```typescript
export const getFullImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) {
    return null
  }

  // If already an absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If relative URL (starts with /), prefix with API base URL
  if (imageUrl.startsWith('/')) {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    return `${baseUrl}${imageUrl}`
  }

  return imageUrl
}
```

#### 2. Updated RestaurantDetailScreen.tsx:
- Added import: `import { getFullImageUrl } from "../../utils/imageUtils"`
- In `renderMenuItem` function - used for product images:
  ```typescript
  const fullImageUrl = getFullImageUrl(item.image)
  {fullImageUrl ? (
    <Image source={{ uri: fullImageUrl }} ... />
  ) : (
    // placeholder
  )}
  ```
- In banner section - used for restaurant cover_image and logo:
  ```typescript
  <Image source={{ uri: getFullImageUrl(currentRestaurant.cover_image) || undefined }} ... />
  <Image source={{ uri: getFullImageUrl(currentRestaurant.logo) || undefined }} ... />
  ```

### Problem Solved:
- Backend returns relative URLs like `/media/products/pizza.jpg`
- React Native's Image component needs full URLs like `http://172.20.10.3:8000/media/products/pizza.jpg`
- The utility function now properly prefixes relative URLs with the API base URL

### How it works:
1. When a product has an image, `getFullImageUrl()` is called with the backend URL
2. If the URL is relative (starts with `/`), it's prefixed with `http://172.20.10.3:8000`
3. The full URL is passed to React Native's Image component
4. Images now load correctly in the RestaurantDetailScreen

---

## Implementation Details

### Files Created:
- `src/utils/imageUtils.ts` - Utility function to prefix relative image URLs

### Files Edited:
- `src/screens/client/RestaurantDetailScreen.tsx` - Apply URL transformation to all images (products, banner, logo)

---

## Technical Notes

The issue was that the backend returns relative image URLs like `/media/products/image.jpg`, but React Native's `Image` component needs full URLs like `http://172.20.10.3:8000/media/products/image.jpg`.

### Solution:
1. Create a utility function that checks if an image URL is relative
2. If relative, prefix with the API base URL
3. Apply this transformation when rendering all images

### API Base URL:
- From `src/config/env.ts`: `http://172.20.10.3:8000/api`

### ✅ FIXED:
- All product images now display correctly
- Restaurant banner images now display correctly
- Restaurant logo images now display correctly
- Fallback to placeholder icons when no image is available

