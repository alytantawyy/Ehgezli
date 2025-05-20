import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../context/location-context';
import { Branch } from '../../types/booking';

interface RestaurantMapProps {
  branches: Branch[];
  restaurantName: string;
  onClose?: () => void;
  isPreview?: boolean;
}

/**
 * RestaurantMap Component
 * 
 * Displays restaurant branch locations on a map
 * Used in restaurant details and branch management screens
 */
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
        latitude: parseFloat(branch.latitude!.toString()),
        longitude: parseFloat(branch.longitude!.toString()),
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
      const lat = parseFloat(branch.latitude!.toString());
      const lng = parseFloat(branch.longitude!.toString());

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
      >
        <MapView
          style={styles.previewMap}
          initialRegion={{
            latitude: parseFloat(firstBranch.latitude!.toString()),
            longitude: parseFloat(firstBranch.longitude!.toString()),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {validBranches.map((branch) => (
            <Marker
              key={branch.id}
              coordinate={{
                latitude: parseFloat(branch.latitude!.toString()),
                longitude: parseFloat(branch.longitude!.toString()),
              }}
              title={branch.name}
            />
          ))}
        </MapView>
        <View style={styles.previewOverlay}>
          <Ionicons name="expand" size={24} color="#fff" />
          <Text style={styles.previewText}>View Map</Text>
        </View>
        
        <Modal
          visible={showFullMap}
          animationType="slide"
          onRequestClose={() => setShowFullMap(false)}
        >
          <RestaurantMap 
            branches={branches} 
            restaurantName={restaurantName} 
            onClose={() => setShowFullMap(false)} 
          />
        </Modal>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
          {restaurantName} Locations
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
      >
        {validBranches.map((branch) => (
          <Marker
            key={branch.id}
            coordinate={{
              latitude: parseFloat(branch.latitude!.toString()),
              longitude: parseFloat(branch.longitude!.toString()),
            }}
            title={branch.name}
            description={branch.address}
            onPress={() => setSelectedBranch(branch)}
          />
        ))}
        
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}
      </MapView>
      
      {selectedBranch && (
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>{selectedBranch.name}</Text>
          <Text style={styles.branchAddress}>{selectedBranch.address}</Text>
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
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  map: {
    flex: 1,
  },
  branchInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  previewContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewMap: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
