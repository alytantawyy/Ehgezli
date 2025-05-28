import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Custom components
import { EhgezliButton } from '../../components/common/EhgezliButton';

// Hooks and utilities
import { useBranches } from '../../hooks/useBranches';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { useAuth } from '../../hooks/useAuth';
import { UserRoute } from '../../types/navigation';
import { useSavedBranches } from '../../hooks/useSavedBranches';

const { width } = Dimensions.get('window');

/**
 * Branch Details Screen
 * 
 * Displays detailed information about a specific restaurant branch
 * and allows users to make bookings
 */
export default function BranchDetailsScreen() {
  // Get branch ID from URL params
  const { id, selectedTime: initialSelectedTime, selectedDate: initialSelectedDate } = useLocalSearchParams<{ id: string, selectedTime?: string, selectedDate?: string }>();
  const branchId = parseInt(id);
  
  // State for booking
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState(initialSelectedTime || '');
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || format(new Date(), 'yyyy-MM-dd'));
  
  // Get branch data from custom hook
  const { 
    selectedBranch, 
    loading: branchLoading, 
    error: branchError, 
    fetchBranchById,
  } = useBranches();
  
  // Get time slots data from custom hook
  const {
    timeSlots,
    loading: timeSlotsLoading,
    error: timeSlotsError,
    fetchTimeSlots,
    changeDate
  } = useTimeSlots(branchId);
  
  // Get saved branches functionality
  const { isBranchSaved, toggleSavedBranch } = useSavedBranches();
  
  // Get user data
  const { user, userType } = useAuth();
  
  // State for map
  const [mapReady, setMapReady] = useState(false);
  
  // State for booking process
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Check if this branch is saved
  const isSaved = selectedBranch ? isBranchSaved(selectedBranch.branchId) : false;
  
  // Fetch branch details and time slots on mount
  useEffect(() => {
    if (branchId) {
      fetchBranchById(branchId);
      
      // Parse the selectedDate string into a Date object and use it for fetching time slots
      const dateObj = new Date(selectedDate);
      changeDate(dateObj);
    }
  }, [branchId]);
  
  // Set default selected time when time slots are loaded
  useEffect(() => {
    if (timeSlots.length > 0 && !selectedTime) {
      // Find the first available time slot
      const firstAvailableSlot = timeSlots.find(slot => !slot.isFull);
      if (firstAvailableSlot) {
        setSelectedTime(firstAvailableSlot.time);
      }
    }
  }, [timeSlots]);
  
  // Set selected time when timeSlots are loaded and initialSelectedTime is provided
  useEffect(() => {
    if (initialSelectedTime && timeSlots.length > 0 && !selectedTime) {
      setSelectedTime(initialSelectedTime);
    }
  }, [initialSelectedTime, timeSlots, selectedTime]);
  
  // Handle save/unsave branch
  const handleToggleSave = () => {
    if (selectedBranch) {
      toggleSavedBranch(selectedBranch.branchId);
    }
  };
  
  // Handle date change
  const handleDateChange = async (date: Date) => {
    await changeDate(date);
  };
  
  // Handle time slot selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  // Handle party size change
  const handlePartySizeChange = (change: number) => {
    const newSize = partySize + change;
    if (newSize >= 1 && newSize <= 20) {
      setPartySize(newSize);
    }
  };
  
  // Handle booking creation
  const handleCreateBooking = async () => {
    // Reset states
    setBookingError(null);
    setIsBooking(true);
    
    try {
      // Example booking data that would be sent to the API
      const bookingData = {
        branchId,
        date: selectedDate,
        time: selectedTime,
        partySize,
        userId: user?.id
      };
      
      // In a real implementation, you would call your API here
      // const response = await createBooking(bookingData);
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success state
      setBookingSuccess(true);
      
      // Navigate to bookings tab after a delay
      setTimeout(() => {
        router.push(UserRoute.bookings);
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError('Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };
  
  // Render loading state
  if (branchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading branch details...</Text>
      </View>
    );
  }
  
  // Render error state
  if (branchError || !selectedBranch) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#B22222" />
        <Text style={styles.errorText}>Failed to load branch details</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Log the selected branch data to help debug
  console.log('Selected branch in component:', selectedBranch);
  
  // Check if we have valid coordinates for the map
  const hasValidCoordinates = 
    selectedBranch.latitude !== undefined && 
    selectedBranch.longitude !== undefined &&
    !isNaN(parseFloat(String(selectedBranch.latitude))) && 
    !isNaN(parseFloat(String(selectedBranch.longitude))) &&
    parseFloat(String(selectedBranch.latitude)) !== 0 &&
    parseFloat(String(selectedBranch.longitude)) !== 0;
    
  // Parse coordinates to ensure they're valid numbers
  const latitude = hasValidCoordinates ? parseFloat(String(selectedBranch.latitude)) : 0;
  const longitude = hasValidCoordinates ? parseFloat(String(selectedBranch.longitude)) : 0;
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={false}
        />
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#B22222" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Restaurant Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerLeft}>
              {selectedBranch.logo ? (
                <Image 
                  source={{ uri: selectedBranch.logo }} 
                  style={styles.logo} 
                  resizeMode="cover"
                  onError={() => console.log('Error loading logo')}
                />
              ) : (
                <View style={[styles.logo, styles.placeholderLogo]}>
                  <Text style={styles.placeholderLogoText}>
                    {selectedBranch.restaurantName?.substring(0, 1).toUpperCase() || "R"}
                  </Text>
                </View>
              )}
              
              <View style={styles.headerContent}>
                <Text style={styles.restaurantName} numberOfLines={2}>
                  {selectedBranch.restaurantName || "Restaurant"}
                </Text>
                
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.address} numberOfLines={2}>
                    {selectedBranch.address || "Address not available"}
                    {selectedBranch.city ? `, ${selectedBranch.city}` : ""}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  {selectedBranch.cuisine && (
                    <>
                      <Text style={styles.infoText}>{selectedBranch.cuisine}</Text>
                      {selectedBranch.priceRange && <Text style={styles.dot}>•</Text>}
                    </>
                  )}
                  {selectedBranch.priceRange && (
                    <Text style={styles.infoText}>{selectedBranch.priceRange}</Text>
                  )}
                </View>
              </View>
            </View>
            
            <TouchableOpacity onPress={handleToggleSave} style={styles.favoriteButton}>
              <Ionicons 
                name={isSaved ? "star" : "star-outline"} 
                size={28} 
                color={isSaved ? "#B22222" : "#333"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Map Section */}
          {hasValidCoordinates && (
            <View style={styles.mapContainer}>
              {/* Conditionally render the map to avoid errors */}
              {Platform.OS === 'web' ? (
                <View style={[styles.map, styles.mapPlaceholder]}>
                  <Text style={styles.mapPlaceholderText}>Map not available on web</Text>
                </View>
              ) : (
                <View style={styles.mapWrapper}>
                  <MapView
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    style={styles.map}
                    initialRegion={{
                      latitude,
                      longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    onMapReady={() => {
                      console.log('Map ready with coordinates:', latitude, longitude);
                      setMapReady(true);
                    }}
                    loadingEnabled={true}
                    loadingIndicatorColor="#B22222"
                    loadingBackgroundColor="#f5f5f5"
                  >
                    {mapReady && (
                      <Marker
                        coordinate={{
                          latitude,
                          longitude,
                        }}
                        title={selectedBranch.restaurantName || "Restaurant"}
                        description={selectedBranch.address || ""}
                        pinColor="#B22222"
                      />
                    )}
                  </MapView>
                </View>
              )}
            </View>
          )}
          
          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>
              {selectedBranch.about || 'No information available.'}
            </Text>
          </View>
          
          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {selectedBranch.description || 'No description available.'}
            </Text>
          </View>
          
          {/* Location Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <View style={styles.locationDetails}>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={20} color="#B22222" />
                <Text style={styles.locationText}>
                  {selectedBranch.address || 'Address not available'}
                </Text>
              </View>
              
              <View style={styles.locationItem}>
                <Ionicons name="business" size={20} color="#B22222" />
                <Text style={styles.locationText}>
                  {selectedBranch.city || 'City not available'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Reservation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Make a Reservation</Text>
            
            {/* Date Display */}
            <View style={styles.reservationRow}>
              <Text style={styles.reservationLabel}>Date</Text>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>
                  {format(new Date(selectedDate), 'EEEE, d MMMM')}
                </Text>
              </View>
            </View>
            
            {/* Time Selection */}
            <View style={styles.reservationRow}>
              <Text style={styles.reservationLabel}>Time</Text>
              {timeSlotsLoading ? (
                <View style={styles.timeSlotsLoading}>
                  <ActivityIndicator size="small" color="#B22222" />
                  <Text style={styles.timeSlotsLoadingText}>Loading available times...</Text>
                </View>
              ) : timeSlotsError ? (
                <Text style={styles.errorMessage}>Failed to load time slots</Text>
              ) : timeSlots.length === 0 ? (
                <Text style={styles.noTimeSlotsText}>No time slots available for this date</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotContainer}>
                  {timeSlots.map((slot) => {
                    // Format time to AM/PM
                    const formattedTime = formatTimeWithAMPM(slot.time);
                    return (
                      <TouchableOpacity 
                        key={slot.time} 
                        style={[
                          styles.timeSlot, 
                          selectedTime === slot.time && styles.selectedTimeSlot,
                          slot.isFull && styles.fullTimeSlot
                        ]}
                        onPress={() => !slot.isFull && handleTimeSelect(slot.time)}
                        disabled={slot.isFull}
                      >
                        <Text 
                          style={[
                            styles.timeSlotText, 
                            selectedTime === slot.time && styles.selectedTimeSlotText,
                            slot.isFull && styles.fullTimeSlotText
                          ]}
                        >
                          {formattedTime}
                        </Text>
                        {slot.isFull && (
                          <Text style={styles.fullIndicator}>Full</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
            
            {/* Party Size Selection */}
            <View style={styles.reservationRow}>
              <Text style={styles.reservationLabel}>Party Size</Text>
              <View style={styles.partySizeContainer}>
                <TouchableOpacity 
                  style={[styles.partySizeButton, partySize <= 1 && styles.disabledButton]} 
                  onPress={() => handlePartySizeChange(-1)}
                  disabled={partySize <= 1}
                >
                  <Text style={styles.partySizeButtonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.partySizeText}>{partySize}</Text>
                
                <TouchableOpacity 
                  style={[styles.partySizeButton, partySize >= 20 && styles.disabledButton]}
                  onPress={() => handlePartySizeChange(1)}
                  disabled={partySize >= 20}
                >
                  <Text style={styles.partySizeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Book Now Button */}
            <EhgezliButton 
              title={isBooking ? 'Booking...' : 'Book Now'} 
              onPress={handleCreateBooking} 
              disabled={isBooking || !selectedTime || timeSlots.length === 0}
              style={styles.bookButton}
            />
            
            {/* Booking Error */}
            {bookingError && (
              <Text style={styles.errorMessage}>{bookingError}</Text>
            )}
            
            {/* Booking Success */}
            {bookingSuccess && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={48} color="green" />
                <Text style={styles.successText}>Booking Successful!</Text>
                <Text style={styles.successSubtext}>Redirecting to your bookings...</Text>
              </View>
            )}
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// Helper function to format time to AM/PM
function formatTimeWithAMPM(time: string) {
  const hours = parseInt(time.split(':')[0]);
  const minutes = time.split(':')[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${formattedHours}:${minutes} ${ampm}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSection: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  locationDetails: {
    marginTop: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  reservationRow: {
    marginBottom: 20,
  },
  reservationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateDisplay: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  timeSlotContainer: {
    flexDirection: 'row',
  },
  timeSlot: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  selectedTimeSlot: {
    backgroundColor: '#B22222',
  },
  fullTimeSlot: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  fullTimeSlotText: {
    color: '#999',
  },
  fullIndicator: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  timeSlotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  timeSlotsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  noTimeSlotsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 10,
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partySizeButton: {
    backgroundColor: '#f5f5f5',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  partySizeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  partySizeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#333',
  },
  bookButton: {
    marginTop: 16,
  },
  errorMessage: {
    marginTop: 16,
    color: '#B22222',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
  successSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  placeholderLogo: {
    backgroundColor: '#B22222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLogoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
