"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { loadAllRestaurants } from "../../redux/slices/restaurantSlice"
import type { ClientStackParamList } from "../../navigation/ClientNavigator"
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/config"
import RestaurantCard from "../../components/RestaurantCard"
import type { Restaurant } from "../../types"

type Props = NativeStackScreenProps<ClientStackParamList, "Search">

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const { allRestaurants, allRestaurantsCount, allRestaurantsPage, allRestaurantsHasMore, isLoading } = useAppSelector(
    (state) => state.restaurant,
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  // Refs to prevent duplicate calls
  const isLoadingRef = useRef(false)
  const hasInitialLoadRef = useRef(false)

  // Load restaurants only once when screen mounts
  useEffect(() => {
    if (!hasInitialLoadRef.current && allRestaurants.length === 0 && !isLoading) {
      hasInitialLoadRef.current = true
      dispatch(loadAllRestaurants(1))
    }
  }, [dispatch, allRestaurants.length, isLoading])

  // Track when loading is complete
  useEffect(() => {
    if (!isLoading && hasInitialLoadRef.current) {
      setIsInitialLoading(false)
      // Only update filteredRestaurants if we have data and haven't filtered
      if (allRestaurants.length > 0 && !searchQuery.trim()) {
        // Filter out any null/undefined entries
        const validRestaurants = allRestaurants.filter((r) => r && r.id && r.commercial_name)
        setFilteredRestaurants(validRestaurants)
      }
    }
  }, [isLoading, allRestaurants, searchQuery])

  // Handle search filter
  const handleSearch = useCallback((query: string, restaurants: Restaurant[]) => {
    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery) {
      // Filter out invalid entries
      const validRestaurants = restaurants.filter((r) => r && r.id && r.commercial_name)
      setFilteredRestaurants(validRestaurants)
      setIsSearching(false)
    } else {
      const filtered = restaurants.filter((restaurant) => {
        if (!restaurant || !restaurant.id) return false
        const name = (restaurant.commercial_name || restaurant.name || "").toLowerCase()
        const cuisine = (restaurant.cuisine_type || "").toLowerCase()
        const address = (restaurant.full_address || "").toLowerCase()
        return (
          name.includes(trimmedQuery) ||
          cuisine.includes(trimmedQuery) ||
          address.includes(trimmedQuery)
        )
      })
      setFilteredRestaurants(filtered)
      setIsSearching(true)
    }
  }, [])

  // Update filtered restaurants when search query changes
  useEffect(() => {
    handleSearch(searchQuery, allRestaurants)
  }, [searchQuery, allRestaurants, handleSearch])

  const onRefresh = async () => {
    hasInitialLoadRef.current = false
    setIsInitialLoading(true)
    dispatch(loadAllRestaurants(1))
  }

  const loadMore = useCallback(() => {
    // Prevent duplicate calls
    if (isLoadingRef.current || !allRestaurantsHasMore || isLoading) {
      return
    }
    isLoadingRef.current = true
    dispatch(loadAllRestaurants(allRestaurantsPage + 1))
    // Reset the ref after a short delay to allow the next load
    setTimeout(() => {
      isLoadingRef.current = false
    }, 1000)
  }, [allRestaurantsHasMore, allRestaurantsPage, isLoading])

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <RestaurantCard
      restaurant={item}
      onPress={() => navigation.navigate("RestaurantDetail", { id: item.id })}
    />
  )

  const renderFooter = () => {
    if (!isLoading) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    )
  }

  const renderLoadMore = () => {
    if (isLoading || !allRestaurantsHasMore) return null
    return (
      <TouchableOpacity 
        style={styles.loadMoreButton} 
        onPress={loadMore}
        disabled={isLoading}
      >
        <Text style={styles.loadMoreText}>Load More</Text>
      </TouchableOpacity>
    )
  }

  const renderEmpty = () => {
    if (isInitialLoading || (isLoading && allRestaurants.length === 0)) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      )
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>No Restaurants Found</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? `No restaurants match "${searchQuery}"`
            : "No restaurants available at the moment"}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisine..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery("")
                setIsSearching(false)
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {isSearching
              ? `${filteredRestaurants.length} result${filteredRestaurants.length !== 1 ? "s" : ""} for "${searchQuery}"`
              : `${allRestaurantsCount} restaurant${allRestaurantsCount !== 1 ? "s" : ""} available`}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={renderRestaurant}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading && allRestaurants.length > 0} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]} 
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {renderLoadMore()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  statsContainer: {
    marginTop: SPACING.sm,
  },
  statsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING["2xl"],
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingFooter: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  loadMoreText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600" as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray,
    textAlign: "center",
  },
})

export default SearchScreen

