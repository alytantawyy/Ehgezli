import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/location-context';
import { Branch } from '../shared/api/client';

interface RestaurantMapProps {
  branches: Branch[];
  restaurantName: string;
  onClose?: () => void;
  isPreview?: boolean;
}

export function RestaurantMap({ branches, restaurantName, onClose, isPreview = false }: RestaurantMapProps) {
  const { location } = useLocation();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);

  // Filter branches with valid coordinates
  const validBranches = branches.filter(branch => branch.latitude && branch.longitude);

  if (validBranches.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
            Location
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={48} color="#ccc" />
          <Text style={styles.noLocationText}>No location information available</Text>
        </View>
      </View>
    );
  }

  // Calculate initial region to show all branches
  const initialRegion = () => {
    if (validBranches.length === 1) {
      const branch = validBranches[0];
      return {
        latitude: parseFloat(branch.latitude!),
        longitude: parseFloat(branch.longitude!),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculate bounds to include all branches
    let minLat = Number.MAX_VALUE;
    let maxLat = Number.MIN_VALUE;
    let minLng = Number.MAX_VALUE;
    let maxLng = Number.MIN_VALUE;

    validBranches.forEach(branch => {
      const lat = parseFloat(branch.latitude!);
      const lng = parseFloat(branch.longitude!);

      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    // Add user's location to bounds if available
    if (location) {
      minLat = Math.min(minLat, location.coords.latitude);
      maxLat = Math.max(maxLat, location.coords.latitude);
      minLng = Math.min(minLng, location.coords.longitude);
      maxLng = Math.max(maxLng, location.coords.longitude);
    }

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add some padding
    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(0.01, latDelta),
      longitudeDelta: Math.max(0.01, lngDelta),
    };
  };

  // If in preview mode, show a simplified view that opens the full map when clicked
  if (isPreview) {
    const firstBranch = validBranches[0];
    return (
      <TouchableOpacity 
        style={styles.previewContainer} 
        onPress={() => setShowFullMap(true)}
        activeOpacity={0.8}
      >
        <View style={styles.previewContent}>
          <Ionicons name="location-outline" size={20} color="#007AFF" style={styles.previewIcon} />
          <View style={styles.previewTextContainer}>
            <Text style={styles.previewAddress} numberOfLines={1}>
              {firstBranch.address || 'View location'}
            </Text>
            {firstBranch.distance !== undefined && (
              <Text style={styles.previewDistance}>
                {firstBranch.distance.toFixed(1)} km away
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>

        {showFullMap && (
          <Modal visible={showFullMap} animationType="slide">
            <RestaurantMap 
              branches={branches} 
              restaurantName={restaurantName} 
              onClose={() => setShowFullMap(false)}
            />
          </Modal>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
          {restaurantName ? `${restaurantName} Location` : 'Location'}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>
      
      <MapView
        style={styles.map}
        initialRegion={initialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {validBranches.map((branch, index) => (
          <Marker
            key={`${branch.id}-${index}`}
            coordinate={{
              latitude: parseFloat(branch.latitude!),
              longitude: parseFloat(branch.longitude!),
            }}
            title={restaurantName}
            description={`${branch.address}, ${branch.city || ''}`}
            onPress={() => setSelectedBranch(branch)}
          />
        ))}
      </MapView>
      
      {selectedBranch && (
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>{restaurantName}</Text>
          <Text style={styles.branchAddress}>{selectedBranch.address}</Text>
          {selectedBranch.city && (
            <Text style={styles.branchCity}>{selectedBranch.city}</Text>
          )}
          {selectedBranch.distance !== undefined && (
            <Text style={styles.branchDistance}>{selectedBranch.distance.toFixed(1)} km away</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50, // Add extra padding for status bar
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // Allow text to take available space
    marginRight: 10, // Add margin to prevent overlap with close button
  },
  closeButton: {
    padding: 8, // Increase touch target
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
  },
  branchInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  branchCity: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  branchDistance: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  previewContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  previewIcon: {
    marginRight: 8,
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  previewAddress: {
    fontSize: 16,
    color: '#333',
  },
  previewDistance: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
});
