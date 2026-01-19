# RestaurantDetailScreen & CartScreen Fixes - TODO

## Backend Modifications:
- [x] Modifier `apps/restaurants/views.py` - endpoint `menu` pour montrer TOUS les produits
- [x] Modifier `apps/products/views.py` - endpoint `list` pour montrer tous les produits du restaurant

## Frontend Modifications:
- [x] Ajouter notification toast/feedback quand on ajoute au panier dans `RestaurantDetailScreen.tsx`
- [x] Ajouter indicateur de chargement sur le bouton pendant l'ajout
- [x] Afficher la quantité dans le panier pour chaque produit

## CartScreen Modifications (CRITIQUE):
- [x] **CORRECTION CRITIQUE**: CartScreen utilise maintenant les données réelles du Redux store au lieu de données statiques
- [x] Les boutons + et - fonctionnent pour modifier les quantités
- [x] Suppression du produit quand la quantité atteint 0
- [x] Affichage de l'image du produit
- [x] Textes traduits en français
- [x] Correction des constantes de couleurs

## Testing:
- [ ] Tester l'affichage de tous les produits
- [ ] Tester le bouton ajouter au panier
- [ ] Tester le CartScreen avec les vrais produits

