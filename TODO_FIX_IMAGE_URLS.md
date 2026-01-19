# Fix Image URLs & Product Display - Task List

## Problem 1: Product Images Not Loading
Product images fail to load because URLs contain `/api` in the path:
- Wrong: `http://172.20.10.3:8000/api/media/products/xxx.png`
- Correct: `http://172.20.10.3:8000/media/products/xxx.png`

### Solution for Problem 1
- [x] Update `src/utils/imageUtils.ts` - Add `getMediaBaseUrl` function
- [x] Update `src/screens/client/RestaurantDetailScreen.tsx` - Fix `getImageUrl`
- [x] Update `src/screens/restaurant/MenuScreen.tsx` - Fix `getImageUrl`
- [x] Update `src/screens/restaurant/RestaurantProfileScreen.tsx` - Fix `getImageUrl`
- [x] Update `src/screens/restaurant/EditProfileScreen.tsx` - Fix `getImageUrl`

## Problem 2: Product Names and Cart Quantities Not Visible
Product names and cart quantities were not displaying properly.

### Solution for Problem 2
- [x] Fixed `src/screens/client/RestaurantDetailScreen.tsx`:
  - Fixed cart quantity lookup to use `String()` comparison for ID type mismatches
  - Added fallback text for when `item.name` or `item.description` is undefined
  - Added `numberOfLines` props to limit text display
  - Formatted price properly with `.toFixed(2)`
  - Created better cart quantity indicator with badge-style container showing cart icon and quantity

## Problem 3: Product Data Not Parsed Correctly
Product data from backend was not being parsed correctly in some cases.

### Solution for Problem 3
- [x] Fixed `src/services/restaurant-service.ts` - Updated `parseProductData` function:
  - Added fallback for `product_name` field (sometimes backend uses this instead of `name`)
  - Added fallback for all fields to ensure defaults are provided
  - Added `String()` conversion for parseFloat to handle numeric values properly
  - Added debug logging in `restaurantSlice.ts` to help troubleshoot data issues

