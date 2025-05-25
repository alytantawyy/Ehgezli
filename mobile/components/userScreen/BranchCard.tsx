import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BranchListItem } from '@/types/branch';
import timeSlots, { formatTimeWithAMPM } from '@/app/utils/time-slots';

interface BranchCardProps {
  branch: BranchListItem;
  onPress: (branchId: number) => void;
}

export const BranchCard = ({ branch, onPress }: BranchCardProps) => {
  // Format distance to show in km or m
  const formatDistance = (distance: number | null | undefined) => {
    if (distance === null || distance === undefined) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };


  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(branch.branchId)}
      activeOpacity={0.7}
    >
      {/* Restaurant Logo */}
      <Image 
        source={{ uri: branch.logo }} 
        style={styles.logo} 
        resizeMode="cover"
      />
      
      {/* Restaurant Name */}
      <Text style={styles.name}>{branch.restaurantName}</Text>
      
      <View style={styles.infoRow}>
        {/* Price Range */}
        <Text style={styles.priceRange}>{branch.priceRange}</Text>
        <Text style={styles.dot}>•</Text>
        {/* Cuisine */}
        <Text style={styles.cuisine}>{branch.cuisine}</Text>
      </View>
      
      {/* Location */}
      <Text style={styles.location}>{branch.city}</Text>
      
      {/* Time Slots */}
      <View style={styles.timeSlotContainer}>
        {timeSlots.generateLocalTimeSlots().map((time, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.timeSlot}
            onPress={() => onPress(branch.branchId)}
          >
            <Text style={styles.timeSlotText}>{formatTimeWithAMPM(time)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
  },
  priceRange: {
    fontSize: 16,
    color: '#666',
  },
  dot: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeSlot: {
    backgroundColor: '#B22222',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  timeSlotText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
});
