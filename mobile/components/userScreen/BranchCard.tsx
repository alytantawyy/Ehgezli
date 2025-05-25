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
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: branch.logo }} 
          style={styles.logo} 
          resizeMode="cover"
        />
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="star-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Restaurant Name */}
      <Text style={styles.name}>{branch.restaurantName}</Text>
      
      <View style={styles.infoRow}>
        {/* Price Range */}
        <Text style={styles.priceRange}>{branch.priceRange}</Text>
        <Text style={styles.dot}>•</Text>
        {/* Cuisine */}
        <Text style={styles.cuisine}>{branch.cuisine}</Text>
        {/* Location */}
      <Text style={styles.location}>{branch.city}</Text>
      </View>
      
      
      
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
  logoContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 2,
  },
  priceRange: {
    fontSize: 16,
    color: '#666',
  },
  dot: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 6,
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
    marginBottom: 8,
    textAlign: 'right',
    marginLeft: 'auto',
    
  },
  timeSlotContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
  },
  timeSlot: {
    backgroundColor: '#B22222',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  timeSlotText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});
