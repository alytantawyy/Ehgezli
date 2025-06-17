import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Switch, Linking, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { format, parse } from 'date-fns';

// Hooks and utilities
import { useBranchStore } from '@/store/branch-store';
import { useBookingStore } from '@/store/booking-store';
import { RestaurantBranch, BookingSettings, BookingOverride } from '@/types/branch';

// Custom components
import BookingSettingsSection from '@/components/restaurantScreen/BookingSettingsSection';
import BookingOverridesSection from '@/components/restaurantScreen/BookingOverridesSection';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get branch data from branch store
  const { fetchBranchById } = useBranchStore();
  
  // Get booking settings and overrides from booking store
  const { 
    bookingSettings,
    bookingOverrides,
    loading: bookingLoading,
    error: bookingError,
    fetchBookingSettings,
    fetchBookingOverrides,
    updateBranchBookingSettings,
    createNewBookingOverride,
    updateExistingBookingOverride,
    deleteBookingOverride
  } = useBookingStore();
  
  // Wrapper function to match the expected signature
  const updateBookingSettingsWrapper = async (branchId: number, settings: BookingSettings): Promise<void> => {
    await updateBranchBookingSettings(branchId, settings);
    // No return value needed as the component expects Promise<void>
  };
  
  // Wrapper functions for booking overrides
  const createBookingOverrideWrapper = async (branchId: number, override: BookingOverride): Promise<void> => {
    await createNewBookingOverride(branchId, override as any);
  };
  
  const updateBookingOverrideWrapper = async (overrideId: number, override: BookingOverride): Promise<void> => {
    await updateExistingBookingOverride(overrideId, override as any);
  };
  
  const deleteBookingOverrideWrapper = async (overrideId: number): Promise<void> => {
    await deleteBookingOverride(overrideId);
  };
  
  // State for editing modes
  const [isEditingBookingSettings, setIsEditingBookingSettings] = useState(false);
  const [editedBookingSettings, setEditedBookingSettings] = useState<Partial<BookingSettings> | null>(null);
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<BookingOverride | null>(null);
  const [editedOverride, setEditedOverride] = useState<Partial<BookingOverride> | null>(null);
  const [isAddingOverride, setIsAddingOverride] = useState(false);
  const [newOverride, setNewOverride] = useState<Partial<BookingOverride>>({});
  
  // State for editing branch details
  const [isEditingBranchDetails, setIsEditingBranchDetails] = useState(false);
  const [editedBranchDetails, setEditedBranchDetails] = useState<Partial<RestaurantBranch> | null>(null);
  
  // State for date and time picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Fetch branch data on component mount
  useEffect(() => {
    const loadBranchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch branch details
        await fetchBranchById(branchId);
        
        const branchStore = useBranchStore.getState();
        const branchData = branchStore.selectedBranch;
        
        if (!branchData) {
          throw new Error('Branch not found');
        }
        
        setBranch(branchData as unknown as RestaurantBranch);
        
        // Fetch booking settings and overrides
        await fetchBookingSettings(branchId);
        await fetchBookingOverrides(branchId);
        
      } catch (err) {
        console.error('Error loading branch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load branch data');
      } finally {
        setLoading(false);
      }
    };
    
    loadBranchData();
  }, [branchId, fetchBranchById, fetchBookingSettings, fetchBookingOverrides]);
  
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
    if (!branch) return;
    
    setIsEditingBranchDetails(true);
    setEditedBranchDetails({
      ...branch
    });
  };
  
  // Handle saving edited branch details
  const handleSaveBranchDetails = async () => {
    if (!editedBranchDetails || !branch) return;
    
    try {
      // Here you would call the API to update the branch details
      // For now, we'll just update the local state
      setBranch({
        ...branch,
        ...editedBranchDetails
      });
      
      setIsEditingBranchDetails(false);
      setEditedBranchDetails(null);
      
      Alert.alert('Success', 'Branch details updated successfully');
    } catch (error) {
      console.error('Error updating branch details:', error);
      Alert.alert('Error', 'Failed to update branch details');
    }
  };
  
  // Handle booking settings edit
  const handleEditBookingSettings = () => {
    if (!bookingSettings) {
      // Create new booking settings
      Alert.alert(
        'Configure Booking Settings',
        'Please enter the booking settings for this branch:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Configure',
            onPress: () => {
              // Default settings to start with
              const defaultSettings = {
                openTime: '09:00',
                closeTime: '22:00',
                interval: 30,
                maxSeatsPerSlot: 50,
                maxTablesPerSlot: 10,
                branchId: branchId
              };
              
              updateBookingSettingsWrapper(branchId, defaultSettings as BookingSettings)
                .then(() => {
                  Alert.alert('Success', 'Booking settings created successfully');
                })
                .catch((err) => {
                  Alert.alert('Error', 'Failed to create booking settings');
                  console.error('Error creating booking settings:', err);
                });
            }
          }
        ]
      );
    } else {
      // Show a dialog to edit existing settings
      Alert.alert(
        'Edit Booking Settings',
        'What would you like to update?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Operating Hours',
            onPress: () => {
              // In a real app, you would show a time picker here
              // For now, we'll just update with fixed values
              const updatedSettings = {
                ...bookingSettings,
                openTime: '08:00',
                closeTime: '23:00'
              };
              
              updateBookingSettingsWrapper(branchId, updatedSettings as BookingSettings)
                .then(() => {
                  Alert.alert('Success', 'Operating hours updated successfully');
                })
                .catch((err) => {
                  Alert.alert('Error', 'Failed to update operating hours');
                  console.error('Error updating operating hours:', err);
                });
            }
          },
          {
            text: 'Booking Interval',
            onPress: () => {
              // In a real app, you would show a number input here
              // For now, we'll just update with a fixed value
              const updatedSettings = {
                ...bookingSettings,
                interval: 45
              };
              
              updateBookingSettingsWrapper(branchId, updatedSettings)
                .then(() => {
                  Alert.alert('Success', 'Booking interval updated successfully');
                })
                .catch((err) => {
                  Alert.alert('Error', 'Failed to update booking interval');
                  console.error('Error updating booking interval:', err);
                });
            }
          },
          {
            text: 'Capacity',
            onPress: () => {
              // In a real app, you would show number inputs here
              // For now, we'll just update with fixed values
              const updatedSettings = {
                ...bookingSettings,
                maxSeatsPerSlot: 60,
                maxTablesPerSlot: 15
              };
              
              updateBookingSettingsWrapper(branchId, updatedSettings)
                .then(() => {
                  Alert.alert('Success', 'Capacity updated successfully');
                })
                .catch((err) => {
                  Alert.alert('Error', 'Failed to update capacity');
                  console.error('Error updating capacity:', err);
                });
            }
          }
        ]
      );
    }
  };
  
  // Handle adding a new booking override
  const handleAddBookingOverride = () => {
    const today = new Date();
    setIsAddingOverride(true);
    setNewOverride({
      date: format(today, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      overrideType: 'MODIFIED',
      newMaxSeats: 0,
      newMaxTables: 0,
      note: ''
    });
  };

  // Handle editing a booking override
  const handleEditBookingOverride = (override: BookingOverride) => {
    setIsEditingOverride(true);
    setSelectedOverride(override);
    setEditedOverride({
      ...override
    });
  };

  // Handle deleting a booking override
  const handleDeleteBookingOverride = (overrideId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this booking override?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteBookingOverrideWrapper(overrideId)
              .then(() => {
                Alert.alert('Success', 'Booking override deleted successfully');
              })
              .catch((err) => {
                Alert.alert('Error', 'Failed to delete booking override');
                console.error('Error deleting booking override:', err);
              });
          }
        }
      ]
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
  
  // Function to format time to AM/PM format
  const formatTimeToAMPM = (time: string) => {
    try {
      // Check if the time string is in ISO format
      if (time.includes('T') && time.includes('Z')) {
        // Parse ISO date string
        const date = new Date(time);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        // Handle HH:MM format
        const [hours, minutes] = time.split(':');
        const formattedTime = new Date(`1970-01-01T${hours}:${minutes}:00`);
        return formattedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  };
  
  // Loading state
  if (loading || bookingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading branch details...</Text>
      </View>
    );
  }
  
  // Error state
  if (error || bookingError || !branch) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#B22222" />
        <Text style={styles.errorText}>{error || bookingError || 'Branch not found'}</Text>
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
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Branch Header */}
        <View style={styles.header}>
          <Text style={styles.branchName}>{branch.restaurantName}</Text>     
        </View>
        
        {/* Branch Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Branch Details</Text>
            <TouchableOpacity onPress={handleEditBranch}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {isEditingBranchDetails && editedBranchDetails ? (
            <View style={styles.settingsEditContainer}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Branch Name:</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedBranchDetails.restaurantName}
                  onChangeText={(text) => setEditedBranchDetails({ ...editedBranchDetails, restaurantName: text })}
                  placeholder="Branch Name"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Address:</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedBranchDetails.address}
                  onChangeText={(text) => setEditedBranchDetails({ ...editedBranchDetails, address: text })}
                  placeholder="Address"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>City:</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedBranchDetails.city}
                  onChangeText={(text) => setEditedBranchDetails({ ...editedBranchDetails, city: text })}
                  placeholder="City"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Phone:</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedBranchDetails.phone}
                  onChangeText={(text) => setEditedBranchDetails({ ...editedBranchDetails, phone: text })}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditingBranchDetails(false);
                    setEditedBranchDetails(null);
                  }}
                >
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveBranchDetails}
                >
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
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
            </>
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
        <BookingSettingsSection 
          bookingSettings={bookingSettings}
          branchId={branchId}
          isEditingBookingSettings={isEditingBookingSettings}
          setIsEditingBookingSettings={setIsEditingBookingSettings}
          editedSettings={editedBookingSettings as BookingSettings | null}
          setEditedSettings={setEditedBookingSettings}
          updateBranchBookingSettings={updateBookingSettingsWrapper}
        />
        
        {/* Booking Overrides Section */}
        <BookingOverridesSection 
          bookingOverrides={bookingOverrides}
          branchId={branchId}
          createNewBookingOverride={createBookingOverrideWrapper}
          updateExistingBookingOverride={updateBookingOverrideWrapper}
          deleteBookingOverride={deleteBookingOverrideWrapper}
        />
        
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
  // actionButton: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginLeft: 10,
  // },
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
    fontWeight: '500',
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
    paddingHorizontal: 4,
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
  overrideActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  overrideActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  overrideDeleteButton: {
    backgroundColor: '#B22222',
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
  overrideEditContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
  },
  typeButton: {
    minWidth: 120,
    height: 44,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTypeButton: {
    backgroundColor: '#B22222',
    borderColor: '#B22222',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  activeTypeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formValue: {
    fontSize: 14,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#B22222',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#333',
  },
  dateTimeInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#333',
  },
  settingsEditContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
});
