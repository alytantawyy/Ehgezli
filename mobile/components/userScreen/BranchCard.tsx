import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BranchListItem } from '@/types/branch';
import timeSlots, { formatTimeWithAMPM } from '@/app/utils/time-slots';

interface BranchCardProps {
  branch: BranchListItem;
  onPress: (branchId: number) => void;
  isSaved?: boolean;
  onToggleSave?: (branchId: number) => void;
}

export const BranchCard = ({ branch, onPress, isSaved = false, onToggleSave }: BranchCardProps) => {
  // Format distance to show in km or m
  const formatDistance = (distance: number | null | undefined) => {
    if (distance === null || distance === undefined) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  const handleToggleSave = (e: any) => {
    e.stopPropagation(); // Prevent triggering the card's onPress
    console.log('Toggle save for branch:', branch.branchId, 'Current saved status:', isSaved);
    if (onToggleSave) {
      onToggleSave(branch.branchId);
    } else {
      console.log('onToggleSave function is not provided');
    }
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
      </View>
      
      {/* Restaurant Info Container */}
      <View style={styles.infoContainer}>
        {/* Restaurant Name and Favorite Icon */}
        <View style={styles.headerRow}>
          <Text style={styles.name}>{branch.restaurantName}</Text>
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={handleToggleSave}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isSaved ? "star" : "star-outline"} 
              size={24} 
              color={isSaved ? "hsl(355,79%,36%)" : "#000"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoRow}>
          {/* Price Range */}
          <Text style={styles.priceRange}>{branch.priceRange}</Text>
          <Text style={styles.dot}>•</Text>
          {/* Cuisine */}
          <Text style={styles.cuisine}>{branch.cuisine}</Text>
          {/* Location */}
          <Text style={styles.location}>{branch.city}</Text>
        </View>
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
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoContainer: {
    width: '100%',
    height: 150,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoContainer: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    marginLeft: 'auto',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlot: {
    backgroundColor: '#B22222',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
