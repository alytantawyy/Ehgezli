import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Text } from '../common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { UserRoute } from '../../types/navigation';

interface RestaurantCardProps {
  id: number;
  name: string;
  cuisine: string;
  priceRange: string;
  imageUrl: string;
  distance?: string;
  onSelect?: () => void;
}

/**
 * RestaurantCard Component
 * 
 * Displays restaurant information in a card format for the user section
 * Used in discovery screens and search results
 */
export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  name,
  cuisine,
  priceRange,
  imageUrl,
  distance,
  onSelect,
}) => {
  const handlePress = () => {
    if (onSelect) {
      onSelect();
    } else {
      router.push((UserRoute.restaurantDetails(id.toString())) as any);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image} 
        resizeMode="cover"
      />
      
      <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handlePress}
        >
          <Ionicons 
            name="heart-outline" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.cuisine}>{cuisine}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.priceRange}>{priceRange}</Text>
          {distance && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.distance}>{distance}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  priceRange: {
    fontSize: 14,
    color: '#666',
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
});
