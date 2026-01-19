# TODO: Make Product Image Required for Restaurants

## Tasks
- [ ] Modify ProduitCreateUpdateSerializer to make image required when restaurant is provided
- [ ] Add image upload functionality to restaurant AddProductScreen
- [ ] Update product-service.ts to handle FormData for image uploads
- [ ] Test that image is required for restaurants but not supermarkets
- [ ] Verify image upload works correctly

## Files to Modify
- apps/products/serializers.py
- src/screens/restaurant/AddProductScreen.tsx
- src/services/product-service.ts
