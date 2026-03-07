#!/bin/bash

echo "🗑️  Désinstallation de l'ancienne Expo CLI..."
npm uninstall -g expo-cli

echo "🧹 Nettoyage des caches..."
rm -rf node_modules package-lock.json yarn.lock .expo .expo-shared
rm -rf $TMPDIR/metro-* $TMPDIR/react-* $TMPDIR/haste-* ~/.rncache 2>/dev/null
npm cache clean --force
watchman watch-del-all 2>/dev/null

echo "📦 Installation des dépendances de base..."
npm install --legacy-peer-deps

echo "📱 Installation des packages Expo SDK 54..."
npx expo install expo@~54.0.0
npx expo install @expo/vector-icons
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-picker/picker
npx expo install expo-constants
npx expo install expo-device
npx expo install expo-font
npx expo install expo-image-picker
npx expo install expo-location
npx expo install expo-media-library
npx expo install expo-notifications
npx expo install react-native-gesture-handler
npx expo install react-native-maps
npx expo install react-native-reanimated
npx expo install react-native-safe-area-context
npx expo install react-native-screens
npx expo install react-native-svg
npx expo install react-native-worklets-core

echo "✅ Installation terminée!"
echo "🚀 Démarrage de l'application..."
npx expo start -c