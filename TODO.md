# TODO: Fix price.toFixed Error

## Completed Tasks
- [x] Identify screens using price.toFixed(2)
- [x] Add null checks in frontend screens
- [x] Modify serializer to ensure price is never null
- [x] Create formatPrice utility function in src/utils/priceFormatter.ts
- [x] Update productSlice.ts to normalize price data (convert string to number)
- [x] Update MenuScreen.tsx to use formatPrice helper
- [x] Update SupermarketProductsScreen.tsx to use formatPrice helper
- [x] Update ProductsScreen.tsx (supermarche) to use formatPrice helper

## Details
- Created `src/utils/priceFormatter.ts` with `formatPrice()` function that safely handles:
  - null/undefined prices
  - string prices (converts to number)
  - invalid number values
- Updated `src/redux/slices/productSlice.ts` to normalize product prices when receiving from API
- Updated all screens that display product prices to use `formatPrice()` helper
- Error "item.price.toFixed is not a function" should now be resolved
