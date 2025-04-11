import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { formatTimeWithAMPM } from '../shared/utils/time-slots';
import { isRestaurantSaved, saveRestaurant, unsaveRestaurant } from '../shared/api/client';
import { useAuth } from '../context/auth-context';
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
}

export interface RestaurantCardProps {
  restaurant: RestaurantWithAvailability;
  branchIndex: number;
  date: string;
  time?: string;
  partySize: number;
}

export function RestaurantCard({ 
  restaurant, 
  branchIndex, 
  date, 
  time, 
  partySize 
}: RestaurantCardProps) {
  console.log(`[RestaurantCard] rendering ${restaurant.id}, branch ${branchIndex}`);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
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
  const originalBranch = restaurant.branches[branchIndex];
  
  // Debug branch data
  useEffect(() => {
    console.log(`[RestaurantCard Debug] Restaurant ${restaurant.id}, Branch data:`, originalBranch);
    
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
  }, [restaurant.id, branchIndex, originalBranch]);

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
      : []
  } : {
    id: 0,
    location: '',
    address: '',
    city: '',
    slots: [],
    availableSlots: []
  };
  
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
      activeOpacity={0.7}
    >
      {/* Top - Restaurant Image (Full Width) */}
      <Image 
        source={{ 
          uri: restaurant.profile?.logo || 
              'https://via.placeholder.com/100?text=Restaurant'
        }} 
        style={styles.restaurantImage} 
      />
      
      {/* Name and Save Button Row */}
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
        
        <TouchableOpacity 
          style={styles.saveButton} 
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
      
      {/* Details Row */}
      <View style={styles.detailsRow}>
        {/* Price and Cuisine */}
        <View style={styles.priceAndCuisine}>
          <Text style={[styles.price, { color: colors.text }]}>
            {restaurant.profile?.priceRange || '$$'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={[styles.cuisine, { color: colors.text }]}>
            {restaurant.profile?.cuisine || 'Various Cuisine'}
          </Text>
        </View>
        
        {/* Location */}
        <Text style={[styles.location, { color: colors.text }]}>
          {branch.city || 'Location'}
        </Text>
      </View>
      
      {/* Time Slots Section */}
      <View style={styles.timeSlotsSection}>
        {(branch.slots && branch.slots.length > 0) ? (
          <View style={styles.timeSlots}>
            {(branch.slots || []).map((slot, index) => {
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
  restaurantImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
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
  },
  location: {
    fontSize: 13,
    opacity: 0.7,
  },
  saveButton: {
    padding: 8,
  },
  timeSlotsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 15,
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
