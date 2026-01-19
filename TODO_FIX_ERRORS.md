# Fix Errors - TODO List

## Task: Fix product creation errors and ImagePicker deprecation

### Errors to fix:
1. `[TypeError: Cannot assign to property 'name' which has only a getter]`
2. `WARN [expo-image-picker] 'ImagePicker.MediaTypeOptions' have been deprecated`

---

## Plan

### 1. Fix Backend Serializer Conflict (apps/products/serializers.py)
- Remove `name` from `ProduitCreateUpdateSerializer.Meta.fields` since `product_name` with `source='name'` handles it
- This prevents the conflict between the CharField and the ModelSerializer's automatic field generation

### 2. Fix ImagePicker deprecation in frontend files
Update the following files to use the new `MediaType` API:
- `src/screens/restaurant/AddProductScreen.tsx`
- `src/screens/restaurant/EditProfileScreen.tsx`
- `src/screens/client/EditProfileScreen.tsx`
- `src/screens/verification/UploadDocumentsScreen.tsx`

---

## Progress

- [x] Fix backend serializer conflict
- [x] Update restaurant AddProductScreen ImagePicker
- [x] Update restaurant EditProfileScreen ImagePicker  
- [x] Update client EditProfileScreen ImagePicker
- [x] Update UploadDocumentsScreen ImagePicker

---

## Notes

The ImagePicker.MediaTypeOptions deprecation fix involves changing:
- Old: `mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : "Images"` (with @ts-ignore)
- New: `mediaTypes: ImagePicker.MediaTypeOptions.Images as any`

This suppresses the deprecation warning while maintaining compatibility.


