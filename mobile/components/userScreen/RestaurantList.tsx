// import React from 'react';
// import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
// import { useQuery } from '@tanstack/react-query';
// import { RestaurantCard } from './RestaurantCard';
// import { RestaurantBranch, BranchWithAvailability } from '../../types/branch';
// import { getRestaurants } from '../../api/restaurant';
// import { getSavedBranches } from '../../api/savedBranch';
// import { Ionicons } from '@expo/vector-icons';
// import { useAuth } from '../../hooks/useAuth';
// import { useLocation } from '../../context/location-context';
// import { generateLocalTimeSlots, generateTimeSlotsFromTime } from '../../app/utils/time-slots';
// import { User } from '../../types/user';
// import { Restaurant } from '@/types/restaurant';

// // Function to calculate distance between two coordinates using Haversine formula
// function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371; // Radius of the earth in km
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = R * c; // Distance in km
//   return parseFloat(distance.toFixed(2));
// }

// // Helper function to convert degrees to radians
// function deg2rad(deg: number): number {
//   return deg * (Math.PI / 180);
// }

// interface RestaurantListProps {
//   searchQuery?: string;
//   cityFilter?: string;
//   cuisineFilter?: string;
//   priceFilter?: string;
//   distanceFilter?: string;
//   date?: Date;
//   time?: string;
//   partySize?: number;
//   showSavedOnly?: boolean;
//   nearbyRestaurants?: RestaurantBranch[];
//   onSelectRestaurant?: (id: number) => void;
// }

// export function RestaurantList({
//   searchQuery,
//   cityFilter,
//   cuisineFilter,
//   priceFilter,
//   distanceFilter = 'all',
//   date,
//   time,
//   partySize,
//   showSavedOnly = false,
//   nearbyRestaurants = [],
//   onSelectRestaurant,
// }: RestaurantListProps) {
//   console.log('[RestaurantList] rendering with filters:', { searchQuery, cityFilter, cuisineFilter, priceFilter, date, partySize, time, showSavedOnly });

//   // Get location from context
//   const { location } = useLocation();

//   // Get user's favorite cuisines from auth context
//   const { user } = useAuth();
  
//   // Handle different user types for favorite cuisines
//   const favoriteCuisines = (user as User)?.favoriteCuisines || [];

//   // Centralized function to generate and format time slots consistently
//   const generateAndFormatTimeSlots = () => {
//     // Always use generateLocalTimeSlots directly to ensure consistency
//     const timeSlots = generateLocalTimeSlots();
//     // Convert the string times to TimeSlot objects
//     return timeSlots.map(timeStr => ({ time: timeStr }));
//   };

//   // Generate time slots based on the selected time or default time
//   const generateTimeSlots = () => {
//     if (time) {
//       // Parse the time string (e.g., "2:30 PM") into a Date object
//       try {
//         const [timePart, ampm] = time.split(' ');
//         const [hours, minutes] = timePart.split(':').map(Number);

//         let hour24 = hours;
//         if (ampm === 'PM' && hours < 12) hour24 += 12;
//         if (ampm === 'AM' && hours === 12) hour24 = 0;

//         // Create a date object with the selected date and time
//         const timeDate = new Date(date || new Date());
//         timeDate.setHours(hour24, minutes, 0, 0);

//         // Ensure the combined date-time is not in the past
//         const now = new Date();
//         if (timeDate.getTime() < now.getTime()) {
//           console.log('Selected date-time is in the past, using default time slots');
//           return generateLocalTimeSlots();
//         }

//         console.log('Generating time slots from user-selected time:', timeDate.toISOString());
//         return generateTimeSlotsFromTime(timeDate);
//       } catch (error) {
//         console.error('Error parsing time:', error);
//         // Fall back to default time slots
//         return generateLocalTimeSlots();
//       }
//     } else {
//       // Use default time slots
//       console.log('Using default time slot generation');
//       return generateLocalTimeSlots();
//     }
//   };

//   // Query for all restaurants with availability
//   const { data: restaurants, isLoading } = useQuery<RestaurantBranch[]>({
//     queryKey: ['restaurants', searchQuery, cityFilter, cuisineFilter, priceFilter, date, time, partySize, showSavedOnly],
//     queryFn: async () => {
//       console.log('[RestaurantList] Fetching with search query:', searchQuery);
//       console.log('[RestaurantList] Show saved only:', showSavedOnly);

//       // If showSavedOnly is true, return saved restaurants only
//       if (showSavedOnly) {
//         const savedBranches = await getSavedBranches();
//         console.log('Raw saved branches data:', savedBranches);

//         if (!savedBranches || savedBranches.length === 0) {
//           console.log('No saved branches found');
//           return [];
//         }

//         // Group branches by restaurant ID and create Restaurant objects
//         const restaurantMap = new Map<number, Restaurant>();
        
//         savedBranches.forEach(branch => {
//           if (!restaurantMap.has(branch.restaurantId)) {
//             // Create a new Restaurant object
//             restaurantMap.set(branch.restaurantId, {
//               id: branch.restaurantId,
//               name: branch.restaurantName || '',
//               email: '',  // Required field but we don't have it from branch
//               branches: [],
//               createdAt: branch.createdAt || '',
//               updatedAt: branch.updatedAt || ''
//             });
//           }
          
//           // Add this branch to the restaurant's branches array
//           const restaurant = restaurantMap.get(branch.restaurantId);
//           if (restaurant && restaurant.branches) {
//             restaurant.branches.push(branch);
//           }
//         });
        
//         return Array.from(restaurantMap.values());
//       }

//       const params: RestaurantFilter = {
//         date: date?.toISOString().split('T')[0], // Format as YYYY-MM-DD
//         partySize,
//         time,
//       };

//       if (searchQuery) params.searchQuery = searchQuery;
//       if (cityFilter && cityFilter !== 'all') params.city = cityFilter;
//       if (cuisineFilter && cuisineFilter !== 'all') params.cuisine = cuisineFilter;
//       if (priceFilter && priceFilter !== 'all') params.priceRange = priceFilter;

//       console.log('[RestaurantList] Fetching with params:', params);

//       // Use the getRestaurants API to get restaurants with availability
//       const restaurantsData = await getRestaurants(params);
//       console.log('[RestaurantList] Received restaurants with availability:',
//         restaurantsData.map(r => ({
//           id: r.id,
//           name: r.name,
//           branchCount: r.branches?.length || 0
//         }))
//       );

//       // Process restaurants to ensure they have the expected structure
//       return restaurantsData.map(restaurant => {
//         // Ensure cuisine is available
//         restaurant.cuisine = restaurant.cuisine || 'Various Cuisine';

//         // Ensure restaurant has branches array (even if empty)
//         if (!restaurant.branches) {
//           restaurant.branches = [];
//         }

//         // Process each branch to add slots if needed
//         restaurant.branches.forEach(branch => {
//           // Type assertion to access extended properties
//           const branchWithAvailability = branch as unknown as BranchWithAvailability;
          
//           // If branch has existing slots (as any type), process them
//           if ((branch as any).slots) {
//             branchWithAvailability.slots = ((branch as any).slots).map((slot: string | any) => {
//               // Convert string slots to TimeSlot objects
//               if (typeof slot === 'string') {
//                 return { time: slot };
//               }
//               // If it's already a TimeSlot object, return it as is
//               return slot;
//             });
//           }
//         });

//         return restaurant;
//       });
//     },
//     staleTime: 0, // Ensure data is always considered stale and will refetch
//     refetchOnWindowFocus: false, // Prevent refetching when window regains focus
//   });

//   // Query for saved restaurants - always fetch this for marking saved status
//   const { data: savedRestaurants, isLoading: isSavedLoading } = useQuery<RestaurantBranch[]>({
//     queryKey: ['saved-branches'],
//     queryFn: async () => {
//       try {
//         // Use the existing client function which handles the API call properly
//         // and now marks branches with isSaved=true
//         return (await getSavedBranches()) as unknown as RestaurantBranch[];
//       } catch (error) {
//         console.error('Error fetching saved restaurants:', error);
//         return [];
//       }
//     },
//     enabled: !showSavedOnly, // Only run this query when not showing saved only
//   });

//   // Loading state
//   if (isLoading || (showSavedOnly && isSavedLoading)) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0000ff" />
//         <Text style={styles.loadingText}>Loading restaurants...</Text>
//       </View>
//     );
//   }

//   // No restaurants found
//   if (!restaurants || restaurants.length === 0) {
//     console.log('No restaurants to display. showSavedOnly:', showSavedOnly, 'restaurants array:', restaurants);
//     return (
//       <View style={styles.emptyContainer}>
//         <Text style={styles.emptyText}>
//           {showSavedOnly
//             ? "You haven't saved any restaurants yet."
//             : "No restaurants found matching your criteria."}
//         </Text>
//         {showSavedOnly && (
//           <Text style={styles.emptyStateSubtext}>
//             Browse restaurants and tap the star icon to save your favorites.
//           </Text>
//         )}
//       </View>
//     );
//   }

//   // Create a flat list of all restaurant branches with their associated restaurant
//   const allBranches: { restaurant: Restaurant; branch: RestaurantBranch; branchIndex: number; isNearby?: boolean }[] = [];

//   // Create a map of saved restaurant IDs and branch indexes for quick lookup
//   const savedMap = new Map<string, boolean>();
//   if (savedRestaurants && !showSavedOnly) {
//     // Loop through each restaurant and its branches to find saved ones
//     savedRestaurants.forEach((branch) => {
//       savedMap.set(`${branch.restaurantId}-${branch.id}`, true);
//     });
//   }

//   // Process the restaurants data
//   if (restaurants && restaurants.length > 0) {
//     restaurants.forEach((restaurant) => {
//       console.log(`[RestaurantList] Restaurant ${restaurant.id} has ${restaurant.branches ? restaurant.branches.length : 0} branches`);

//       // Skip if no branches
//       if (!restaurant.branches || restaurant.branches.length === 0) {
//         return;
//       }

//       // Process each branch
//       restaurant.branches.forEach((branch, branchIndex) => {
//         // Create a BranchWithAvailability object
//         const branchWithAvailability: BranchWithAvailability = {
//           ...branch,  // Copy all existing properties from branch
//           slots: [],  // Initialize with empty slots array
//           availableSlots: [],
//           latitude: branch.latitude,
//           longitude: branch.longitude
//         };
        
//         // If branch has existing slots (as any type), process them
//         if ((branch as any).slots && Array.isArray((branch as any).slots)) {
//           branchWithAvailability.slots = ((branch as any).slots).map((slot: string | any) => {
//             // Convert string slots to TimeSlot objects
//             if (typeof slot === 'string') {
//               return { time: slot };
//             }
//             // If it's already a TimeSlot object, return it as is
//             return slot;
//           });
//         }

//         // Always calculate distance if we have coordinates, regardless of filter
//         if (location?.coords && branch.latitude && branch.longitude) {
//           try {
//             const distance = calculateDistance(
//               location.coords.latitude,
//               location.coords.longitude,
//               parseFloat(branch.latitude.toString()),
//               parseFloat(branch.longitude.toString())
//             );
            
//             // Store the calculated distance
//             (branchWithAvailability as any).distance = distance;
//             console.log(`Calculated distance for ${restaurant.name} (branch ${branchIndex}):`, distance);
//           } catch (error) {
//             console.error('Error calculating distance:', error);
//           }
//         }

//         // Apply distance filter if needed
//         if (distanceFilter !== 'all' && location?.coords) {
//           const maxDistance = parseInt(distanceFilter.split(' ')[0]); // Extract number from "X km"
          
//           // Skip this branch if it's too far away
//           if ((branchWithAvailability as any).distance !== undefined && (branchWithAvailability as any).distance > maxDistance) {
//             return;
//           }
//         }

//         // If showSavedOnly is true, only include saved branches
//         if (showSavedOnly && !savedMap.has(`${restaurant.id}-${branchIndex}`)) {
//           return;
//         }

//         // Otherwise, check the savedMap
//         if (!showSavedOnly && savedMap.has(`${restaurant.id}-${branchIndex}`)) {
//           // Mark as saved for UI purposes
//           (branchWithAvailability as any).isSaved = true;
//         }

//         allBranches.push({
//           restaurant,
//           branch: branchWithAvailability,
//           branchIndex
//         });
//       });
//     });
//   }

//   console.log(`[RestaurantList] Total branches to display: ${allBranches.length}`);

//   // Debug distances before sorting
//   allBranches.forEach((item, index) => {
//     console.log(`Branch ${index}: ${item.restaurant.name}, Distance: ${(item.branch as any).distance}, Saved: ${(item.branch as any).isSaved}, Cuisine: ${item.restaurant.cuisine || (item.restaurant as any).profile?.cuisine}`);
//   });

//   // Sort all branches by the three criteria:
//   // 1. Saved status (saved first)
//   // 2. Distance (closest first)
//   // 3. Favorite cuisine (matching user's favorites first)
//   allBranches.sort((a, b) => {
//     // First priority: Saved status
//     if ((a.branch as any).isSaved && !(b.branch as any).isSaved) return -1;
//     if (!(a.branch as any).isSaved && (b.branch as any).isSaved) return 1;
    
//     // Second priority: Distance (if available)
//     const distanceA = (a.branch as any).distance !== undefined ? (a.branch as any).distance : Number.MAX_VALUE;
//     const distanceB = (b.branch as any).distance !== undefined ? (b.branch as any).distance : Number.MAX_VALUE;
    
//     if (distanceA !== distanceB) {
//       return distanceA - distanceB; // Sort by distance (closest first)
//     }
    
//     // Third priority: Favorite cuisine
//     const cuisineA = a.restaurant.cuisine || '';
//     const cuisineB = b.restaurant.cuisine || '';
    
//     const isAFavorite = favoriteCuisines.includes(cuisineA);
//     const isBFavorite = favoriteCuisines.includes(cuisineB);
    
//     if (isAFavorite && !isBFavorite) return -1;
//     if (!isAFavorite && isBFavorite) return 1;
    
//     // If all criteria are equal, sort by name
//     return a.restaurant.name.localeCompare(b.restaurant.name);
//   });

//   // Debug distances after sorting
//   console.log("AFTER SORTING:");
//   allBranches.forEach((item, index) => {
//     console.log(`Branch ${index}: ${item.restaurant.name}, Distance: ${(item.branch as any).distance}, Saved: ${(item.branch as any).isSaved}, Cuisine: ${item.restaurant.cuisine || (item.restaurant as any).profile?.cuisine}`);
//   });

//   // Add nearby restaurants - but skip when showing saved only
//   if (!showSavedOnly && nearbyRestaurants && nearbyRestaurants.length > 0) {
//     // Add a section header for nearby restaurants
//     const nearbySection = (
//       <View style={styles.nearbyHeader}>
//         <Ionicons name="location" size={18} color="#007AFF" />
//         <Text style={styles.nearbyHeaderText}>Nearby Restaurants</Text>
//       </View>
//     );

//     // Create a set to track which restaurant IDs have already been added
//     const addedRestaurantIds = new Set(allBranches.map(item => item.restaurant.id));
    
//     nearbyRestaurants.forEach((restaurant) => {
//       // Skip if this restaurant is already in the list
//       if (addedRestaurantIds.has(restaurant.id)) {
//         console.log(`Skipping duplicate nearby restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
//         return;
//       }
      
//       // Extract the first branch if available
//       const firstBranch = restaurant.branches && restaurant.branches.length > 0 ? restaurant.branches[0] : null;
      
//       if (firstBranch) {
//         // Log the branch data to debug
//         console.log(`Branch for ${restaurant.name}:`, {
//           id: firstBranch.id,
//           distance: (firstBranch as any).distance,
//           hasDistance: (firstBranch as any).distance !== undefined,
//           distanceType: typeof (firstBranch as any).distance,
//           latitude: firstBranch.latitude,
//           longitude: firstBranch.longitude
//         });
        
//         // Ensure distance is a number
//         const distance = typeof (firstBranch as any).distance === 'number' ? (firstBranch as any).distance : 
//                         typeof (firstBranch as any).distance === 'string' ? parseFloat((firstBranch as any).distance) : undefined;
        
//         // Calculate distance using Haversine formula
//         let calculatedDistance: number | undefined = undefined;
        
//         if (location?.coords && firstBranch.latitude && firstBranch.longitude) {
//           try {
//             calculatedDistance = calculateDistance(
//               location.coords.latitude,
//               location.coords.longitude,
//               parseFloat(firstBranch.latitude.toString()),
//               parseFloat(firstBranch.longitude.toString())
//             );
//             console.log(`Calculated distance for ${restaurant.name}:`, calculatedDistance);
//           } catch (error) {
//             console.error('Error calculating distance:', error);
//           }
//         }
        
//         // Use either the API-provided distance or our calculated distance
//         const finalDistance = distance !== undefined ? distance : calculatedDistance;
        
//         console.log(`Final distance for ${restaurant.name}:`, {
//           apiDistance: distance,
//           calculatedDistance,
//           finalDistance,
//           isNearby: true
//         });
        
//         // Process restaurant data to ensure cuisine is available at both levels
//         const processedRestaurant = {
//           ...restaurant,
//           cuisine: restaurant.cuisine || 'Various Cuisine',
//         };
        
//         // Ensure the branch has proper slots data
//         const processedBranch = {
//           ...firstBranch,
//           distance: finalDistance, // Use final distance
//           // Ensure slots array exists and is populated
//           slots: (firstBranch as any).slots ? (firstBranch as any).slots.map((slot: string | any) => {
//             // Convert string slots to TimeSlot objects
//             if (typeof slot === 'string') {
//               return { time: slot };
//             }
//             // If it's already a TimeSlot object, return it as is
//             return slot;
//           }) : [],
//           availableSlots: []
//         };
        
//         // If the branch doesn't have slots but has availableSlots, use those
//         if ((processedBranch.slots.length === 0) && processedBranch.availableSlots && processedBranch.availableSlots.length > 0) {
//           console.log(`Nearby restaurant ${processedRestaurant.id} (${processedRestaurant.name}): Adding slots from availableSlots`);
//           processedBranch.slots = processedBranch.availableSlots.map((slot: any) => slot.time || slot);
//         }
        
//         allBranches.push({
//           restaurant: {
//             ...processedRestaurant,
//             branches: [processedBranch]
//           } as Restaurant,
//           branch: {
//             id: processedBranch.id,
//             address: processedBranch.address || '',
//             city: processedBranch.city || '',
//             distance: finalDistance // Ensure distance is properly set
//           } as any, // Use type assertion to bypass type checking
//           branchIndex: 0,
//           isNearby: true // Mark as nearby for special styling
//         });
//       }
//     });
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={allBranches}
//         keyExtractor={(item, index) => `${item.restaurant.id}-${item.branch.id}-${item.branchIndex}-${index}`}
//         renderItem={({ item }) => {
//           console.log(`Rendering restaurant: ${item.restaurant.name}, has branches: ${item.restaurant.branches?.length || 0}`);
//           return (
//             <RestaurantCard
//               id={item.restaurant.id}
//               name={item.restaurant.name}
//               cuisine={item.restaurant.cuisine || 'Various Cuisine'}
//               priceRange={item.restaurant.priceRange || '$$'}
//               imageUrl={item.restaurant.logo || 'https://via.placeholder.com/150'}
//               distance={(item.branch as any).distance ? `${(item.branch as any).distance.toFixed(1)} km` : undefined}
//               onSelect={() => onSelectRestaurant?.(item.restaurant.id)}
//             />
//           );
//         }}
//         contentContainerStyle={styles.listContainer}
//         showsVerticalScrollIndicator={false}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     marginBottom: 26,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   emptyStateSubtext: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//   },
//   listContainer: {
//     padding: 4,
//   },
//   nearbyHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     backgroundColor: '#f7f7f7',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   nearbyHeaderText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
// });
