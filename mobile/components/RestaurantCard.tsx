import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { formatTimeWithAMPM, generateTimeSlots } from '../shared/utils/time-slots';
import { getSavedStatus, toggleSavedStatus, Restaurant, Branch, getRestaurantsWithAvailability } from '../shared/api/client';
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
        const saved = await getSavedStatus(restaurant.id, branchIndex);
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
      const saved = await toggleSavedStatus(restaurant.id, branchIndex);
      setIsSaved(saved);
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
      <View style={styles.header}>
        <Image 
          source={{ 
            uri: restaurant.profile?.logo || 
                'https://via.placeholder.com/100?text=Restaurant'
          }} 
          style={styles.logo} 
        />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
          <Text style={[styles.cuisine, { color: colors.text }]}>
            {restaurant.profile?.cuisine || 'Various Cuisine'}
          </Text>
          <Text style={[styles.location, { color: colors.text }]}>
            {branch.city}{branch.location ? `, ${branch.location}` : ''}
          </Text>
        </View>
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

      <View style={styles.details}>
        <Text style={[styles.price, { color: colors.text }]}>
          {restaurant.profile?.priceRange || '$$'}
        </Text>
        
        {(branch.slots && branch.slots.length > 0) ? (
          <View style={styles.timeSlotsContainer}>
            <Text style={[styles.availabilityText, { color: colors.text }]}>
              Available times:
            </Text>
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
                      {formatTimeWithAMPM(timeValue)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    marginBottom: 10,
    padding: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cuisine: {
    fontSize: 13,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    opacity: 0.7,
  },
  saveButton: {
    justifyContent: 'center',
    padding: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeSlotsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  availabilityText: {
    fontSize: 13,
    marginBottom: 2,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  timeSlot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
    marginBottom: 3,
  },
  timeSlotText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  noAvailability: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  debugButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  debugButtonText: {
    fontSize: 13,
    color: '#333',
  },
});
