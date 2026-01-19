# TODO - Affichage de l'image Cover dans RestaurantDetailScreen

## Objectif
Faire en sorte que la grande image en haut de l'écran RestaurantDetailScreen affiche l'image cover de chaque restaurant de manière unique.

## Étapes effectuées

### 1. Analyse du code existant
- ✅ Fichier `RestaurantDetailScreen.tsx` analysé
- ✅ Modèle `Restaurant` vérifié (champ `cover_image` présent)
- ✅ Serializer `RestaurantDetailSerializer` vérifié (champ `cover_image` inclus)
- ✅ Service `restaurant-service.ts` vérifié (parse correctement `cover_image`)
- ✅ Types TypeScript vérifiés (interface `Restaurant` avec `cover_image?: string`)

### 2. Modifications du code
- ✅ **Modifié le fichier `src/screens/client/RestaurantDetailScreen.tsx`**
- ✅ Amélioration de la section bannière pour prioriser `cover_image`
- ✅ Ajout de logs de débogage pour vérifier les données
- ✅ Meilleure gestion des images avec fallback logique

## Modifications apportées

### Fichier modifié : `src/screens/client/RestaurantDetailScreen.tsx`

#### Section Bannière (lignes ~170-227)

**Avant :**
```tsx
{/* Bannière */}
<View style={styles.bannerContainer}>
  {currentRestaurant?.cover_image ? (
    <Image
      source={{ uri: getImageUrl(currentRestaurant.cover_image) || undefined }}
      style={styles.bannerImage as ImageStyle}
      resizeMode="cover"
    />
  ) : currentRestaurant?.logo ? (
    <Image
      source={{ uri: getImageUrl(currentRestaurant.logo) || undefined }}
      style={styles.bannerImage as ImageStyle}
      resizeMode="cover"
    />
  ) : (
    <View style={styles.bannerPlaceholder}>
      <MaterialIcons name="restaurant" size={60} color={COLORS.gray} />
    </View>
  )}
</View>
```

**Après :**
```tsx
{/* Bannière - Image Cover du restaurant */}
<View style={styles.bannerContainer}>
  {(() => {
    const coverImageUrl = getImageUrl(currentRestaurant?.cover_image)
    const logoImageUrl = getImageUrl(currentRestaurant?.logo)
    
    // Log de débogage en mode développement
    if (__DEV__) {
      console.log('[RestaurantDetailScreen] Données restaurant:', {
        id: currentRestaurant?.id,
        commercial_name: currentRestaurant?.commercial_name,
        cover_image: currentRestaurant?.cover_image,
        coverImageUrl,
        logo: currentRestaurant?.logo,
        logoImageUrl
      })
    }
    
    // Priorité 1: Image cover
    if (coverImageUrl) {
      return (
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.bannerImage as ImageStyle}
          resizeMode="cover"
          onError={(e) => {
            console.log('[RestaurantDetailScreen] Erreur chargement cover:', e.nativeEvent.error)
          }}
        />
      )
    }
    
    // Priorité 2: Logo si pas de cover
    if (logoImageUrl) {
      return (
        <Image
          source={{ uri: logoImageUrl }}
          style={styles.bannerImage as ImageStyle}
          resizeMode="cover"
          onError={(e) => {
            console.log('[RestaurantDetailScreen] Erreur chargement logo:', e.nativeEvent.error)
          }}
        />
      )
    }
    
    // Priorité 3: Placeholder par défaut
    return (
      <View style={styles.bannerPlaceholder}>
        <MaterialIcons name="restaurant" size={60} color={COLORS.gray} />
      </View>
    )
  })()}
</View>
```

## Résultat

✅ **Les modifications ont été appliquées avec succès !**

### Logique d'affichage implémentée :
1. **Priorité 1** : Afficher l'image `cover_image` du restaurant si elle existe
2. **Priorité 2** : Si pas de cover, afficher le `logo` du restaurant
3. **Priorité 3** : Si ni cover ni logo, afficher un placeholder avec icône de restaurant

### Fonctionnalités de débogage :
- Les logs de développement affichent les données du restaurant (id, nom, cover_image, logo, URLs)
- Les erreurs de chargement d'image sont capturées et loggées
- Cela permet de diagnostiquer rapidement les problèmes d'affichage

## Prochaines étapes

1. **Tester l'application** pour vérifier que les images cover s'affichent correctement
2. **Vérifier les logs console** en mode développement pour diagnostiquer d'éventuels problèmes
3. **Si les images ne s'affichent toujours pas**, vérifier :
   - Que les restaurants ont bien une image cover configurée dans l'admin Django
   - Que le champ `cover_image` est bien présent dans les réponses API
   - Que les URLs des images sont correctes et accessibles

## Commandes de test

```bash
# Lancer l'application en mode développement
cd /home/migos/Bureau/FOTSO/Nouveau\ dossier/final
npx expo start

# Ou avec npm
npm start
```

## Notes

- Les modifications sont **rétrocompatibles** - si un restaurant n'a pas d'image cover, le logo sera affiché
- Si ni cover ni logo n'est présent, un placeholder avec icône de restaurant s'affiche
- Les logs de débogage ne s'affichent qu'en mode développement (`__DEV__`)
