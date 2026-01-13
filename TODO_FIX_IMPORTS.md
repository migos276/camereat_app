# Fix Import/Export Mismatch Errors - TODO List

## Problem
Error: "Element type is invalid: expected a string or class/function but got: object"
This indicates a mismatch between import and export types in React components.

## Root Cause Analysis
The error comes from `withDevTools(Anonymous)` wrapper, suggesting Redux DevTools integration. The root cause is inconsistent import/export patterns in navigator files:
- Mixed default and named imports in `ClientNavigator.tsx`
- `SettingsScreen.tsx` has both named and default exports causing confusion

## Fix Plan

### Phase 1: Fix ClientNavigator.tsx
- [ ] 1.1 Standardize all imports to match export types
- [ ] 1.2 Update SettingsScreen import to match its actual export

### Phase 2: Fix SettingsScreen.tsx
- [ ] 2.1 Remove duplicate export (keep only named export)
- [ ] 2.2 Verify consistent export pattern

### Phase 3: Verify Other Navigators
- [ ] 3.1 Check AuthNavigator.tsx for consistency
- [ ] 3.2 Check RestaurantNavigator.tsx for consistency  
- [ ] 3.3 Check LivreurNavigator.tsx for consistency
- [ ] 3.4 Check SupermarchéNavigator.tsx for consistency

### Phase 4: Test Fix
- [ ] 4.1 Run Expo development server
- [ ] 4.2 Verify error is resolved
- [ ] 4.3 Test navigation between screens

## Current Status
🔴 Not Started - Need to fix ClientNavigator.tsx import inconsistencies

