import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { formatTimeWithAMPM } from '../shared/utils/time-slots';
import { isRestaurantSaved, saveRestaurant, unsaveRestaurant } from '../shared/api/client';
import { useAuth } from '../context/auth-context';
import { useLocation } from '../context/location-context';
import Colors from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define extended types for the restaurant data
export interface RestaurantWithAvailability {
  id: number;
  name: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  imageUrl?: string;
  branches: any[];
  profile?: {
    logo?: string;
    cuisine?: string;
    priceRange?: string;
    description?: string;
    rating?: number;
  };
  isSaved?: boolean;
}

// Define time slot interface
export interface TimeSlot {
  time: string | { time: string };
  availableSeats?: number;
}

// Define available slot interface that includes seat information
export interface AvailableSlot {
  time: string;
  seats: number;
}

// Define a custom branch type that doesn't extend Branch to avoid type conflicts
export interface BranchWithAvailability {
  id: number;
  location: string;
  address: string;
  city?: string;
  slots: TimeSlot[];
  availableSlots?: AvailableSlot[];
  isSaved?: boolean;
  distance?: number;
}

export interface RestaurantCardProps {
  restaurant: RestaurantWithAvailability;
  branchIndex: number;
  date: string;
  time?: string;
  partySize: number;
  isNearby?: boolean;
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(2));
}

// Helper function to convert degrees to radians
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function RestaurantCard({ 
  restaurant, 
  branchIndex, 
  date, 
  time, 
  partySize,
  isNearby = false
}: RestaurantCardProps) {
  console.log(`[RestaurantCard] rendering ${restaurant.id}, branch ${branchIndex}`);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    hasBranch: false,
    hasSlots: false,
    slotsLength: 0,
    fallbackAttempted: false,
    fallbackSuccess: false,
    fallbackError: ''
  });

  // Transform the branch data to include the expected fields
  const originalBranch = restaurant.branches && restaurant.branches.length > branchIndex 
    ? restaurant.branches[branchIndex] 
    : null;
  
  // Debug branch data
  useEffect(() => {
    console.log(`[RestaurantCard Debug] Restaurant ${restaurant.id}, Branch data:`, {
      branch: originalBranch,
      hasDistance: originalBranch?.distance !== undefined,
      distanceValue: originalBranch?.distance,
      distanceType: originalBranch?.distance !== undefined ? typeof originalBranch.distance : 'undefined',
      isNearby
    });
    
    // Check if branch exists
    const hasBranch = !!originalBranch;
    
    // Check if slots exist
    const hasSlots = hasBranch && Array.isArray(originalBranch.slots);
    
    // Get slots length if they exist
    const slotsLength = hasSlots ? originalBranch.slots.length : 0;
    
    console.log(`[RestaurantCard Debug] hasBranch: ${hasBranch}, hasSlots: ${hasSlots}, slotsLength: ${slotsLength}`);
    
    setDebugInfo(prev => ({
      ...prev,
      hasBranch,
      hasSlots,
      slotsLength
    }));
  }, [restaurant.id, branchIndex, originalBranch, isNearby]);

  const branch: BranchWithAvailability = originalBranch ? {
    id: originalBranch.id,
    location: originalBranch.location || '',
    address: originalBranch.address || '',
    city: originalBranch.city || '', 
    slots: originalBranch.slots && Array.isArray(originalBranch.slots) 
      ? originalBranch.slots.map((timeStr: any) => ({ time: timeStr }))
      : [],
    availableSlots: originalBranch.availableSlots && Array.isArray(originalBranch.availableSlots) 
      ? originalBranch.availableSlots.map((slot: any) => ({ time: slot.time, seats: slot.seats }))
      : [],
    distance: originalBranch.distance
  } : {
    id: 0,
    location: '',
    address: '',
    city: '',
    slots: [],
    availableSlots: [],
    distance: undefined
  };

  // Calculate distance using Haversine formula
  const calculateBranchDistance = () => {
    if (location?.coords && originalBranch?.latitude && originalBranch?.longitude) {
      try {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          parseFloat(originalBranch.latitude),
          parseFloat(originalBranch.longitude)
        );
        return distance;
      } catch (error) {
        console.error('Error calculating distance:', error);
      }
    }
    return undefined;
  };

  // Calculate the distance once
  const distance = calculateBranchDistance();

  // Add a useEffect to log when the component renders with the processed branch data
  useEffect(() => {
    // Debug the branch data to see if distance is available
    console.log(`[RestaurantCard] Distance debug for ${restaurant.name}:`, {
      hasOriginalBranch: !!originalBranch,
      originalDistance: originalBranch?.distance,
      processedDistance: branch.distance,
      hasProcessedDistance: branch.distance !== undefined,
      showingDistance: branch.distance !== undefined,
      isNearby,
      restaurantId: restaurant.id,
      branchId: originalBranch?.id
    });
    
    // Check if we have a branch but no distance
    if (originalBranch && originalBranch.distance === undefined && isNearby) {
      console.warn(`Missing distance data for nearby restaurant ${restaurant.name}`);
    }
  }, [restaurant.name, originalBranch, branch.distance, isNearby, restaurant.id]);

  // Check if restaurant is saved when component mounts
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const saved = await isRestaurantSaved(restaurant.id, branchIndex);
        setIsSaved(saved);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkSavedStatus();
  }, [restaurant.id, branchIndex]);

  const handleSaveToggle = async () => {
    try {
      setIsLoading(true);
      if (isSaved) {
        await unsaveRestaurant(restaurant.id, branchIndex);
      } else {
        await saveRestaurant(restaurant.id, branchIndex);
      }
      setIsSaved(!isSaved);
    } catch (error: any) {
      // Handle authentication errors
      if (error.response?.status === 401) {
        Alert.alert('Authentication Required', 'Please log in to save restaurants');
      } else {
        Alert.alert('Error', 'Failed to save restaurant');
      }
      console.error('Error toggling saved status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    router.push({
      pathname: `/restaurant/${restaurant.id.toString()}` as unknown as RelativePathString,
      params: {
        date,
        time: time || '',
        partySize: partySize.toString(),
        branchId: branch.id.toString()
      }
    });
  };

  const handleTimeSelect = (slot: string | TimeSlot) => {
    // Extract the time value based on the slot type
    let timeValue: string;
    
    if (typeof slot === 'string') {
      timeValue = slot;
    } else if (slot && typeof slot === 'object') {
      // Handle double-nested time objects: {time: {time: "15:25"}}
      if ('time' in slot && typeof slot.time === 'object' && slot.time && 'time' in slot.time && typeof slot.time.time === 'string') {
        timeValue = slot.time.time;
      }
      // Handle regular time objects: {time: "15:25"}
      else if ('time' in slot && typeof slot.time === 'string') {
        timeValue = slot.time;
      } else {
        console.warn('Invalid slot format in handleTimeSelect:', slot);
        timeValue = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } else {
      console.warn('Invalid slot format in handleTimeSelect:', slot);
      timeValue = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    router.push({
      pathname: `/restaurant/${restaurant.id.toString()}` as unknown as RelativePathString,
      params: {
        date,
        time: timeValue,
        partySize: partySize.toString(),
        branchId: branch.id.toString()
      }
    });
  };

  // Add debugging logic to understand why no time slots are being generated
  console.log('Branch slots:', branch.slots);
  console.log('Original branch:', originalBranch);
  console.log('Restaurant:', restaurant);

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: colors.border }]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: restaurant.profile?.logo || 
                  'https://via.placeholder.com/100?text=Restaurant'
            }} 
            style={styles.image} 
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <TouchableOpacity 
              style={styles.saveButtonInline} 
              onPress={handleSaveToggle}
              disabled={isLoading}
            >
              <Ionicons 
                name={isSaved ? 'star' : 'star-outline'} 
                size={24} 
                color={isSaved ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
          </View>
          

          
          <View style={styles.infoRow}>
            <View style={styles.priceAndCuisine}>
              <Text style={[styles.price, { color: colors.text }]}>
                {restaurant.profile?.priceRange || '$$'}
              </Text>
              <Text style={styles.dot}>•</Text>
              <Text style={[styles.cuisine, { color: colors.text }]}>
                {restaurant.profile?.cuisine || 'Various Cuisine'}
              </Text>
              
              {(distance !== undefined) && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={12} style={{ marginRight: 2 }} />
                    <Text style={[styles.cuisine, { color: colors.text }]}>
                      {distance.toFixed(1)} km
                    </Text>
                  </View>
                </>
              )}
            </View>
            
            <Text style={[styles.location, { color: colors.text }]}>
              {branch.city || 'Location'}
            </Text>
          </View>
          
          <View style={styles.timeSlotsSection}>
            {(branch.slots && branch.slots.length > 0) ? (
              <View style={styles.timeSlots}>
                {(branch.slots || []).map((slot: any, index: number) => {
                  // Skip invalid slots
                  if (!slot) {
                    console.log('Skipping null or undefined slot');
                    return null;
                  }
                  
                  // Handle different slot formats
                  let timeValue: string | undefined;
                  
                  if (typeof slot === 'string') {
                    // If slot is directly a string
                    timeValue = slot;
                  } else if (typeof slot === 'object') {
                    // Handle double-nested time objects: {time: {time: "15:25"}}
                    if (slot.time && typeof slot.time === 'object' && 'time' in slot.time && typeof slot.time.time === 'string') {
                      timeValue = slot.time.time;
                    }
                    // Handle regular time objects: {time: "15:25"}
                    else if (slot.time && typeof slot.time === 'string') {
                      timeValue = slot.time;
                    }
                  } else {
                    // Unknown format
                    console.log('Skipping slot with unknown format:', slot);
                    return null;
                  }
                  
                  // Skip slots with no time value
                  if (!timeValue) {
                    console.log('Skipping slot with no time value');
                    return null;
                  }
                  
                  return (
                    <TouchableOpacity 
                      key={index}
                      style={[styles.timeSlot, { backgroundColor: colors.primary }]}
                      onPress={() => handleTimeSelect(slot)}
                    >
                      <Text style={styles.timeSlotText}>
                        {formatTimeWithAMPM(timeValue, true)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View>
                <Text style={[styles.noAvailability, { color: colors.text }]}>
                  No availability for selected time
                </Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert(
                    'Debug Info',
                    `Restaurant ID: ${restaurant.id}\n` +
                    `Branch Index: ${branchIndex}\n` +
                    `Has Branch: ${debugInfo.hasBranch ? 'Yes' : 'No'}\n` +
                    `Has Slots Array: ${debugInfo.hasSlots ? 'Yes' : 'No'}\n` +
                    `Slots Length: ${debugInfo.slotsLength}\n` +
                    `Fallback Attempted: ${debugInfo.fallbackAttempted ? 'Yes' : 'No'}\n` +
                    `Fallback Success: ${debugInfo.fallbackSuccess ? 'Yes' : 'No'}\n` +
                    `Fallback Error: ${debugInfo.fallbackError || 'None'}\n` +
                    `Date: ${date}\n` +
                    `Time: ${time || 'Not specified'}`
                  )}
                  style={styles.debugButton}
                >
                  <Text style={styles.debugButtonText}>Debug Info</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 15,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  saveButtonInline: {
    position: 'absolute',
    right: 0,
    padding: 0,
  },
  detailsContainer: {
    marginTop: 10,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 30, 
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15, // Changed from paddingBottom to marginBottom for consistency
  },
  priceAndCuisine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    fontSize: 14,
    marginHorizontal: 6,
    opacity: 0.7,
  },
  cuisine: {
    fontSize: 14,
    opacity: 0.7,
  },
  location: {
    fontSize: 13,
    opacity: 0.7,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  timeSlotsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: 'hsl(355,79%,36%)',
  },
  timeSlotText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'normal',
  },
  noAvailability: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
  debugButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#666',
  },
});
