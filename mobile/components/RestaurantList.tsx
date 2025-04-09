import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantWithAvailability, BranchWithAvailability } from '../shared/types';
import { getRestaurants, getSavedRestaurants, SavedRestaurantItem } from '../shared/api/client';

interface RestaurantListProps {
  searchQuery?: string;
  cityFilter?: string;
  cuisineFilter?: string;
  priceFilter?: string;
  date?: Date;
  time?: string;
  partySize?: number;
  showSavedOnly?: boolean;
}

export function RestaurantList({
  searchQuery,
  cityFilter,
  cuisineFilter,
  priceFilter,
  date = new Date(),
  time,
  partySize = 2,
  showSavedOnly = false,
}: RestaurantListProps) {
  console.log('[RestaurantList] rendering', { showSavedOnly });
  
  // Query for all restaurants with availability
  const { data: restaurants, isLoading } = useQuery<RestaurantWithAvailability[]>({
    queryKey: ['restaurants', searchQuery, cityFilter, cuisineFilter, priceFilter, date, time, partySize, showSavedOnly],
    queryFn: async () => {
      console.log('[RestaurantList] Fetching with search query:', searchQuery);
      console.log('[RestaurantList] Show saved only:', showSavedOnly);
      
      // If showSavedOnly is true, return saved restaurants only
      if (showSavedOnly) {
        const savedData = await getSavedRestaurants();
        console.log('Raw saved restaurants data:', savedData);
        
        if (!savedData || savedData.length === 0) {
          console.log('No saved restaurants found');
          return [];
        }
        
        // Transform the saved restaurants data to match the expected format
        const transformedData = savedData.map((item: SavedRestaurantItem) => {
          console.log(`Processing saved restaurant: ${item.restaurant?.name || 'unnamed'}, ID: ${item.restaurantId}`);
          
          // Extract the restaurant object from the saved item
          const restaurant = item.restaurant as unknown as RestaurantWithAvailability;
          
          // Copy profile properties to the top level
          if (restaurant.profile) {
            console.log(`Restaurant profile: ${JSON.stringify(restaurant.profile)}`);
            restaurant.cuisine = restaurant.profile.cuisine;
            restaurant.priceRange = restaurant.profile.priceRange;
            restaurant.description = restaurant.profile.description;
            restaurant.imageUrl = restaurant.profile.logo;
            restaurant.rating = restaurant.profile.rating;
          } else {
            console.log(`No profile found for restaurant ${restaurant.name}`);
          }
          
          // Ensure restaurant has branches array (even if empty)
          if (!restaurant.branches) {
            console.log(`No branches found for restaurant ${restaurant.name}, creating empty array`);
            restaurant.branches = [];
          } else {
            console.log(`Restaurant ${restaurant.name} has ${restaurant.branches.length} branches`);
          }
          
          // Ensure each branch has slots array (even if empty)
          restaurant.branches.forEach((branch, index) => {
            if (!branch.slots) {
              console.log(`Branch ${index} of restaurant ${restaurant.name} has no slots, creating empty array`);
              branch.slots = [];
            } else {
              console.log(`Branch ${index} of restaurant ${restaurant.name} has ${branch.slots.length} slots`);
            }
          });
          
          // Mark this restaurant as saved
          restaurant.isSaved = true;
          
          // Make sure we're using the restaurant ID, not the saved record ID
          restaurant.id = restaurant.id || item.restaurantId;
          
          console.log(`Transformed restaurant: ${restaurant.name}, branches: ${restaurant.branches.length}`);
          return restaurant;
        });
        
        console.log(`Total transformed restaurants: ${transformedData.length}`);
        console.log('Transformed saved restaurants:', transformedData);
        return transformedData;
      }
      
      const params: Record<string, any> = {
        date: date.toISOString(),
        partySize,
        showSavedOnly,
        time: time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      
      if (searchQuery) params['search'] = searchQuery;
      if (cityFilter && cityFilter !== 'all') params['city'] = cityFilter;
      if (cuisineFilter && cuisineFilter !== 'all') params['cuisine'] = cuisineFilter;
      if (priceFilter && priceFilter !== 'all') params['priceRange'] = priceFilter;
      
      console.log('[RestaurantList] Fetching with params:', params);
      
      return getRestaurants(params) as unknown as RestaurantWithAvailability[];
    },
    staleTime: 0, // Ensure data is always considered stale and will refetch
    refetchOnWindowFocus: false, // Prevent refetching when window regains focus
  });
  
  // Query for saved restaurants - always fetch this for marking saved status
  const { data: savedRestaurants, isLoading: isSavedLoading } = useQuery<RestaurantWithAvailability[]>({
    queryKey: ['saved-restaurants'],
    queryFn: async () => {
      try {
        // Use the existing client function which handles the API call properly
        // and now marks branches with isSaved=true
        return (await getSavedRestaurants()) as unknown as RestaurantWithAvailability[];
      } catch (error) {
        console.error('Error fetching saved restaurants:', error);
        return [];
      }
    },
    enabled: !showSavedOnly, // Only run this query when not showing saved only
  });
  
  // Loading state
  if (isLoading || (showSavedOnly && isSavedLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }
  
  // No restaurants found
  if (!restaurants || restaurants.length === 0) {
    console.log('No restaurants to display. showSavedOnly:', showSavedOnly, 'restaurants array:', restaurants);
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {showSavedOnly 
            ? "You haven't saved any restaurants yet." 
            : "No restaurants found matching your criteria."}
        </Text>
        {showSavedOnly && (
          <Text style={styles.emptyStateSubtext}>
            Browse restaurants and tap the star icon to save your favorites.
          </Text>
        )}
      </View>
    );
  }

  // Create a flat list of all restaurant branches with their associated restaurant
  const allBranches: { restaurant: RestaurantWithAvailability; branch: BranchWithAvailability; branchIndex: number }[] = [];
  
  // Create a map of saved restaurant IDs and branch indexes for quick lookup
  const savedMap = new Map<string, boolean>();
  if (savedRestaurants && !showSavedOnly) {
    // Loop through each restaurant and its branches to find saved ones
    savedRestaurants.forEach((restaurant) => {
      if (restaurant.branches) {
        restaurant.branches.forEach((branch, branchIndex) => {
          // Check if this branch is marked as saved
          if ((branch as any).isSaved) {
            savedMap.set(`${restaurant.id}-${branchIndex}`, true);
          }
        });
      }
    });
  }
  
  // Process the restaurants data
  if (restaurants && restaurants.length > 0) {
    restaurants.forEach(restaurant => {
      console.log(`[RestaurantList] Restaurant ${restaurant.id} has ${restaurant.branches ? restaurant.branches.length : 0} branches`);
      
      // Skip if no branches
      if (!restaurant.branches || restaurant.branches.length === 0) {
        return;
      }
      
      // Process each branch
      restaurant.branches.forEach((branch, branchIndex) => {
        // Initialize slots array if it doesn't exist
        if (!branch.slots) {
          branch.slots = [];
        }
        
        // Create a BranchWithAvailability object
        const branchWithAvailability: BranchWithAvailability = {
          id: branch.id,
          location: branch.location,
          address: branch.address,
          city: branch.city || '',
          slots: branch.slots.map((slot: any) => {
            // Handle both string slots and object slots
            if (typeof slot === 'string') {
              return { time: slot, availableSeats: 0 }; // Default to 0 available seats
            } else if (typeof slot === 'object') {
              return { 
                time: slot.time || '', 
                availableSeats: typeof slot.availableSeats === 'number' ? slot.availableSeats : 0 
              };
            }
            return { time: '', availableSeats: 0 }; // Fallback
          }),
          isSaved: branch.isSaved || false
        };
        
        // If showSavedOnly is true, only include saved branches
        if (showSavedOnly && !branch.isSaved && !restaurant.isSaved) {
          return;
        }
        
        // Otherwise, check the savedMap
        if (!showSavedOnly && savedMap.has(`${restaurant.id}-${branchIndex}`)) {
          // Mark as saved for UI purposes
          branchWithAvailability.isSaved = true;
        }
        
        allBranches.push({
          restaurant,
          branch: branchWithAvailability,
          branchIndex
        });
      });
    });
  }
  
  console.log(`[RestaurantList] Total branches to display: ${allBranches.length}`);
  
  return (
    <View style={styles.container}>
      <FlatList
        data={allBranches}
        keyExtractor={(item) => `${item.restaurant.id}-${item.branchIndex}`}
        renderItem={({ item }) => {
          console.log(`Rendering restaurant: ${item.restaurant.name}, has branches: ${item.restaurant.branches?.length || 0}`);
          return (
            <RestaurantCard
              restaurant={item.restaurant}
              branchIndex={item.branchIndex}
              date={date.toISOString()}
              time={time}
              partySize={partySize}
            />
          );
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 4,
  },
});
