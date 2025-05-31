import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Switch, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { format } from 'date-fns';

// Hooks and utilities
import { useBranchStore } from '@/store/branch-store';
import { RestaurantRoute } from '@/types/navigation';
import { RestaurantBranch, BookingOverride, BookingSettings } from '@/types/branch';

/**
 * Branch Details Screen
 * 
 * Displays detailed information about a specific restaurant branch
 * including all branch data, booking settings, and booking overrides
 */
export default function BranchDetailsScreen() {
  // Get branch ID from URL params
  const { id } = useLocalSearchParams<{ id: string }>();
  const branchId = parseInt(id);
  
  // State for branch data
  const [branch, setBranch] = useState<RestaurantBranch | null>(null);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [bookingOverrides, setBookingOverrides] = useState<BookingOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get branch data from branch store
  const { fetchBranchById, getBranchAvailability } = useBranchStore();
  
  // Fetch branch data on component mount
  useEffect(() => {
    const loadBranchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch branch details
        await fetchBranchById(branchId);
        
        // In a real implementation, you would fetch booking settings and overrides here
        // For now, we'll use the branch data from the branch store
        const branchStore = useBranchStore.getState();
        const branchData = branchStore.selectedBranch;
        
        if (!branchData) {
          throw new Error('Branch not found');
        }
        
        setBranch(branchData as unknown as RestaurantBranch);
        
        // In a real implementation, you would fetch booking settings separately
        // For now, we'll use null
        setBookingSettings(null);
        
        // In a real implementation, you would fetch booking overrides here
        // For now, we'll use an empty array
        setBookingOverrides([]);
        
      } catch (err) {
        console.error('Error loading branch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load branch data');
      } finally {
        setLoading(false);
      }
    };
    
    loadBranchData();
  }, [branchId, fetchBranchById]);
  
  // Handle branch deletion
  const handleDeleteBranch = () => {
    Alert.alert(
      'Delete Branch',
      'Are you sure you want to delete this branch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Here you would call the API to delete the branch
            // For now, we'll just navigate back
            Alert.alert('Branch deleted successfully');
            router.back();
          }
        }
      ]
    );
  };
  
  // Handle branch edit
  const handleEditBranch = () => {
    router.push(RestaurantRoute.editBranch(branchId.toString()));
  };
  
  // Handle booking settings edit
  const handleEditBookingSettings = () => {
    // In a real implementation, you would navigate to a booking settings edit screen
    Alert.alert('Edit Booking Settings', 'This feature is not yet implemented.');
  };
  
  // Handle booking override creation
  const handleAddBookingOverride = () => {
    // In a real implementation, you would navigate to a booking override creation screen
    Alert.alert('Add Booking Override', 'This feature is not yet implemented.');
  };
  
  // Handle branch status toggle
  const handleToggleStatus = () => {
    if (!branch) return;
    
    // In a real implementation, you would call the API to update the branch status
    const newStatus = !branch.isActive;
    setBranch({ ...branch, isActive: newStatus });
    
    Alert.alert(
      'Branch Status Updated',
      `Branch is now ${newStatus ? 'active' : 'inactive'}.`
    );
  };
  
  // Function to open maps app with confirmation
  const openMapsWithConfirmation = () => {
    Alert.alert(
      'Open in Maps App?',
      'Do you want to open the location in the maps app?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`),
        },
      ],
    );
  };
  
  // Handle map press
  const handleMapPress = () => {
    openMapsWithConfirmation();
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading branch details...</Text>
      </View>
    );
  }
  
  // Error state
  if (error || !branch) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#B22222" />
        <Text style={styles.errorText}>{error || 'Branch not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Check if we have valid coordinates for the map
  const hasValidCoordinates = 
    branch.latitude !== undefined && 
    branch.longitude !== undefined &&
    !isNaN(parseFloat(String(branch.latitude))) && 
    !isNaN(parseFloat(String(branch.longitude))) &&
    parseFloat(String(branch.latitude)) !== 0 &&
    parseFloat(String(branch.longitude)) !== 0;
    
  // Parse coordinates to ensure they're valid numbers
  const latitude = hasValidCoordinates ? parseFloat(String(branch.latitude)) : 0;
  const longitude = hasValidCoordinates ? parseFloat(String(branch.longitude)) : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#B22222" />
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEditBranch}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteBranch}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Branch Header */}
        <View style={styles.header}>
          <Text style={styles.branchName}>{branch.restaurantName}</Text>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={styles.statusToggleContainer}>
              <Text style={styles.statusText}>{branch.isActive ? 'Active' : 'Inactive'}</Text>
              <Switch
                value={branch.isActive}
                onValueChange={handleToggleStatus}
                trackColor={{ false: '#ccc', true: '#B22222' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
        
        {/* Branch Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch Details</Text>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{branch.address}</Text>
          </View>
          
          {branch.city && (
            <View style={styles.detailItem}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{branch.city}</Text>
            </View>
          )}
          
          {branch.phone && (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{branch.phone}</Text>
            </View>
          )}
          
          {(branch.openingHours || branch.closingHours) && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.detailText}>
                {branch.openingHours && branch.closingHours 
                  ? `${branch.openingHours} - ${branch.closingHours}`
                  : branch.openingHours 
                    ? `Opens: ${branch.openingHours}` 
                    : `Closes: ${branch.closingHours}`
                }
              </Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.detailText}>
              Created: {branch.createdAt ? format(new Date(branch.createdAt), 'MMM d, yyyy') : 'N/A'}
            </Text>
          </View>
          
          {branch.updatedAt && (
            <View style={styles.detailItem}>
              <Ionicons name="refresh-outline" size={20} color="#666" />
              <Text style={styles.detailText}>
                Last Updated: {format(new Date(branch.updatedAt), 'MMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>
        
        {/* Location Map */}
        {hasValidCoordinates && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>Map not available on web</Text>
                </View>
              ) : (
                <View style={styles.mapWrapper}>
                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={openMapsWithConfirmation}
                    style={styles.mapTouchable}
                  >
                    <MapView
                      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                      style={styles.map}
                      initialRegion={{
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                    >
                      <Marker
                        coordinate={{
                          latitude,
                          longitude,
                        }}
                        title={branch.restaurantName || 'Branch Location'}
                        description={branch.address}
                        pinColor="#B22222"
                        onPress={openMapsWithConfirmation}
                      />
                    </MapView>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Booking Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Settings</Text>
            <TouchableOpacity onPress={handleEditBookingSettings}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {bookingSettings ? (
            <View style={styles.bookingSettingsContainer}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Operating Hours:</Text>
                <Text style={styles.settingValue}>
                  {bookingSettings.openTime} - {bookingSettings.closeTime}
                </Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Booking Interval:</Text>
                <Text style={styles.settingValue}>{bookingSettings.interval} minutes</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Max Seats per Slot:</Text>
                <Text style={styles.settingValue}>{bookingSettings.maxSeatsPerSlot}</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Max Tables per Slot:</Text>
                <Text style={styles.settingValue}>{bookingSettings.maxTablesPerSlot}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No booking settings configured</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleEditBookingSettings}
              >
                <Text style={styles.addButtonText}>Configure Booking Settings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Booking Overrides Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Overrides</Text>
            <TouchableOpacity onPress={handleAddBookingOverride}>
              <Text style={styles.editText}>Add Override</Text>
            </TouchableOpacity>
          </View>
          
          {bookingOverrides.length > 0 ? (
            bookingOverrides.map((override) => (
              <View key={override.id} style={styles.overrideItem}>
                <View style={styles.overrideHeader}>
                  <Text style={styles.overrideDate}>
                    {format(new Date(override.date), 'MMM d, yyyy')}
                  </Text>
                  <View style={[styles.overrideTypeBadge, 
                    override.overrideType === 'CLOSED' 
                      ? styles.closedBadge 
                      : styles.modifiedBadge
                  ]}>
                    <Text style={styles.overrideTypeText}>
                      {override.overrideType === 'CLOSED' ? 'Closed' : 'Modified'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.overrideDetails}>
                  <Text style={styles.overrideTime}>
                    {override.startTime} - {override.endTime}
                  </Text>
                  
                  {override.overrideType !== 'CLOSED' && (
                    <>
                      {override.newMaxSeats && (
                        <Text style={styles.overrideDetail}>
                          Max Seats: {override.newMaxSeats}
                        </Text>
                      )}
                      
                      {override.newMaxTables && (
                        <Text style={styles.overrideDetail}>
                          Max Tables: {override.newMaxTables}
                        </Text>
                      )}
                    </>
                  )}
                  
                  {override.note && (
                    <Text style={styles.overrideNote}>{override.note}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No booking overrides configured</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddBookingOverride}
              >
                <Text style={styles.addButtonText}>Add Booking Override</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#B22222',
  },
  header: {
    padding: 16,
  },
  branchName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  editText: {
    fontSize: 14,
    color: '#B22222',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapWrapper: {
    flex: 1,
  },
  mapTouchable: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  bookingSettingsContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  overrideItem: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  overrideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overrideDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  overrideTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closedBadge: {
    backgroundColor: '#B22222',
  },
  modifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  overrideTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  overrideDetails: {
    marginTop: 5,
  },
  overrideTime: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  overrideDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  overrideNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#B22222',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#B22222',
    fontSize: 16,
    fontWeight: '500',
  },
});
