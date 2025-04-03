import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { BranchWithAvailability, RestaurantWithAvailability } from '../shared/types';
import { formatTimeWithAMPM } from '../shared/utils/time-slots';
import { getSavedStatus, toggleSavedStatus } from '../shared/api/client';
import { useAuth } from '../context/auth-context';
import Colors from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RestaurantCardProps {
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
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const branch = restaurant.branches[branchIndex];
  
  // Check if restaurant is saved when component mounts
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const { saved } = await getSavedStatus(restaurant.id, branchIndex);
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
      const { saved } = await toggleSavedStatus(restaurant.id, branch.id);
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
        
        {branch.slots && branch.slots.length > 0 ? (
          <View style={styles.timeSlotsContainer}>
            <Text style={[styles.availabilityText, { color: colors.text }]}>
              Available times:
            </Text>
            <View style={styles.timeSlots}>
              {branch.slots.map((slot, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.timeSlot, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    router.push({
                      pathname: `/restaurant/${restaurant.id.toString()}` as unknown as RelativePathString,
                      params: {
                        date,
                        time: slot.time,
                        partySize: partySize.toString(),
                        branchId: branch.id.toString()
                      }
                    });
                  }}
                >
                  <Text style={styles.timeSlotText}>
                    {formatTimeWithAMPM(slot.time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <Text style={[styles.noAvailability, { color: colors.text }]}>
            No availability for selected time
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 14,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeSlotsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  availabilityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    marginBottom: 4,
  },
  timeSlotText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noAvailability: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
