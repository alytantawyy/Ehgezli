import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getRestaurantById, createBooking, Restaurant, Branch, getRestaurantLocation } from '@/shared/api/client';
import { formatTimeWithAMPM } from '@/shared/utils/time-slots';
import { EhgezliButton } from '@/components/EhgezliButton';
import { RestaurantMap } from '@/components/RestaurantMap';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useLocation } from '@/context/location-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define extended types for the restaurant data that includes profile information
interface RestaurantWithProfile extends Restaurant {
  profile?: {
    logo?: string;
    cuisine?: string;
    priceRange?: string;
    about?: string;
  };
}

// Define time slot interface for type safety
interface TimeSlot {
  time: string;
}

// Extend Branch type to include city
interface BranchWithCity extends Omit<Branch, 'slots'> {
  city?: string;
  slots: (string | TimeSlot)[];
}

export default function RestaurantDetailScreen() {
  const { id, date, time, partySize, branchId } = useLocalSearchParams<{
    id: string;
    date: string;
    time: string;
    partySize: string;
    branchId: string;
  }>();
  
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors;
  const { user } = useAuth();
  const { location } = useLocation();
  
  // Parse date from params or use current date
  const initialDate = date ? parseISO(date) : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  
  // Parse time from params or use empty string
  const [selectedTime, setSelectedTime] = useState(time ? formatTimeWithAMPM(time) : '');
  
  // Parse party size from params or use default of 2
  const [selectedPartySize, setSelectedPartySize] = useState(Number(partySize || '2'));
  
  // State for picker visibility
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isPartySizePickerVisible, setIsPartySizePickerVisible] = useState(false);
  
  const [showMap, setShowMap] = useState(false);
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    
    if (selectedDate) {
      // Ensure we don't allow past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today
      
      if (selectedDate.getTime() >= today.getTime()) {
        setSelectedDate(selectedDate);
        // Time validation will happen in the useEffect
      } else {
        // If past date was selected, default to today
        console.log('Past date selected, defaulting to today');
        setSelectedDate(today);
        // Time validation will happen in the useEffect
      }
    }
  };
  
  // Validate time whenever date changes
  useEffect(() => {
    // If we have a time selected, validate it for the current date
    if (selectedTime) {
      const isValid = validateTimeForDate(selectedDate, selectedTime);
      if (!isValid) {
        console.log('Time is invalid for the current date, resetting to default');
        setSelectedTime(getDefaultTimeForDisplay());
      }
    }
  }, [selectedDate]); // This effect runs whenever date changes

  // Validate if a time is valid for a given date
  const validateTimeForDate = (dateToCheck: Date, timeString: string): boolean => {
    try {
      // Parse the time string
      const [timePart, ampm] = timeString.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      
      let hour24 = hours;
      if (ampm === 'PM' && hours < 12) hour24 += 12;
      if (ampm === 'AM' && hours === 12) hour24 = 0;
      
      // Create a date-time with the given date and time
      const dateTime = new Date(dateToCheck);
      dateTime.setHours(hour24, minutes, 0, 0);
      
      // Check if this date-time is in the past
      const now = new Date();
      return dateTime.getTime() >= now.getTime();
    } catch (error) {
      console.error('Error validating time:', error);
      return false;
    }
  };

  // Handle time change
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setIsTimePickerVisible(false);
    
    if (selectedTime) {
      // Round to nearest 30-minute interval
      const hours = selectedTime.getHours();
      let minutes = selectedTime.getMinutes();
      
      // Round minutes to nearest 30 (0 or 30)
      minutes = minutes >= 30 ? 30 : 0;
      
      // Create a new date with rounded minutes
      const roundedTime = new Date(selectedTime);
      roundedTime.setMinutes(minutes);
      
      // Format the selected time for display
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      
      // Validate the time for the current date before setting it
      if (validateTimeForDate(selectedDate, displayTime)) {
        console.log('User selected valid time:', displayTime);
        setSelectedTime(displayTime);
      } else {
        console.log('Selected time is in the past, using default time instead');
        setSelectedTime(getDefaultTimeForDisplay());
      }
    }
  };

  // Handle party size selection
  const handlePartySizeSelect = (size: number) => {
    setSelectedPartySize(size);
    setIsPartySizePickerVisible(false);
  };

  const getTimePickerValue = () => {
    try {
      // If there's a selected time, use it
      if (selectedTime) {
        const [timePart, ampm] = selectedTime.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        
        let hour24 = hours;
        if (ampm === 'PM' && hours < 12) hour24 += 12;
        if (ampm === 'AM' && hours === 12) hour24 = 0;
        
        const date = new Date();
        date.setHours(hour24, minutes, 0, 0);
        return date;
      }
      
      // Otherwise, use the current time or default time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // If it's late night, use noon as default
      if (currentHour >= 22 || currentHour < 6) {
        now.setHours(12, 0, 0, 0);
      } else {
        // Add 2 hours to current time as default
        now.setHours(currentHour + 2, currentMinute, 0, 0);
      }
      
      return now;
    } catch (error) {
      console.error('Error getting time picker value:', error);
      return new Date();
    }
  };
  
  // Get the minimum allowed time based on the selected date
  const getMinimumTime = () => {
    const now = new Date();
    const selectedDateCopy = new Date(selectedDate);
    
    // If selected date is today, minimum time is current time
    if (selectedDateCopy.toDateString() === now.toDateString()) {
      return now;
    }
    
    // If selected date is in the future, no minimum time
    return undefined;
  };

  const isDateToday = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() && 
           selectedDate.getMonth() === today.getMonth() && 
           selectedDate.getFullYear() === today.getFullYear();
  };

  const getDefaultTimeForDisplay = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If it's late night, use noon as default
    if (currentHour >= 22 || currentHour < 6) {
      return '12:00 PM';
    } else {
      // Add 2 hours to current time as default
      const displayHour = (currentHour + 2) % 12 || 12;
      const displayMinute = currentMinute.toString().padStart(2, '0');
      const ampm = (currentHour + 2) >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${displayMinute} ${ampm}`;
    }
  };

  // Query restaurant details
  const { data: restaurant, isLoading, error } = useQuery<RestaurantWithProfile | null>({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurantById(Number(id)),
  });
  
  // Query restaurant location with user's coordinates for distance calculation
  const { data: locationData, isLoading: isLocationLoading } = useQuery({
    queryKey: ['restaurantLocation', id, location?.coords.latitude, location?.coords.longitude],
    queryFn: () => getRestaurantLocation(Number(id), {
      userLatitude: location?.coords.latitude.toString(),
      userLongitude: location?.coords.longitude.toString(),
    }),
    enabled: !!id && !!location,
  });
  
  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      Alert.alert(
        'Booking Confirmed',
        'Your reservation has been confirmed!',
        [{ text: 'OK', onPress: () => router.push('/') }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Booking Failed', error.message || 'Could not complete your booking');
    },
  });
  
  // Find the selected branch
  const selectedBranch = restaurant?.branches.find((branch) => branch.id === Number(branchId)) as unknown as BranchWithCity | undefined;
  
  const handleBooking = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to make a booking');
      return;
    }
    
    if (!selectedTime) {
      Alert.alert('Time Required', 'Please select a time for your booking');
      return;
    }
    
    bookingMutation.mutate({
      restaurantId: Number(id),
      branchId: Number(branchId),
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      partySize: selectedPartySize,
    });
  };
  
  if (isLoading || isLocationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading restaurant details...</Text>
      </View>
    );
  }
  
  if (error || !restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.text }]}>Could not load restaurant details</Text>
        <EhgezliButton
          title="Go Back"
          variant="ehgezli"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Image
        source={{
          uri: restaurant.profile?.logo || 'https://via.placeholder.com/400x200?text=Restaurant',
        }}
        style={styles.coverImage}
      />
      
      <View style={styles.content}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.name}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={16} color={colors.text} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {selectedBranch?.city || 'Location not available'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="restaurant-outline" size={16} color={colors.text} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {restaurant.profile?.cuisine || 'Various Cuisine'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.priceText, { color: colors.text }]}>
              {restaurant.profile?.priceRange || '$$'}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.aboutText, { color: colors.text }]}>
          {restaurant.profile?.about || 'No description available for this restaurant.'}
        </Text>
        
        <View style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
        {locationData ? (
          <TouchableOpacity 
            style={styles.locationContainer} 
            onPress={() => setShowMap(true)}
            activeOpacity={0.8}
          >
            <View style={styles.locationContent}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationAddress}>
                  {locationData.branches[0]?.address || 'View location'}
                </Text>
                {locationData.branches[0]?.distance && (
                  <Text style={styles.locationDistance}>
                    {locationData.branches[0].distance.toFixed(1)} km away
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingMapContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingMapText}>Loading location information...</Text>
          </View>
        )}
        
        {showMap && (
          <Modal visible={showMap} animationType="slide">
            <RestaurantMap 
              branches={selectedBranch ? [selectedBranch as unknown as Branch] : []} 
              restaurantName={locationData?.name || restaurant?.name || ''} 
              onClose={() => setShowMap(false)}
            />
          </Modal>
        )}
        
        <View style={styles.divider} />
        
        <View style={styles.bookingDetails}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Details</Text>
          
          <View style={styles.bookingInfoContainer}>
            <TouchableOpacity 
              style={styles.bookingInfoItem} 
              onPress={() => setIsDatePickerVisible(true)}
            >
              <View style={styles.bookingInfoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoText}>{format(selectedDate, 'MMM d')}</Text>
                <View style={{flex: 1}} />
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bookingInfoItem} 
              onPress={() => setIsTimePickerVisible(true)}
            >
              <View style={styles.bookingInfoRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoText}>{selectedTime || getDefaultTimeForDisplay()}</Text>
                <View style={{flex: 1}} />
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bookingInfoItem} 
              onPress={() => setIsPartySizePickerVisible(true)}
            >
              <View style={styles.bookingInfoRow}>
                <Ionicons name="people-outline" size={16} color={colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoText}>{selectedPartySize} {selectedPartySize === 1 ? 'person' : 'people'}</Text>
                <View style={{flex: 1}} />
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Date Picker Modal */}
        {isDatePickerVisible && (
          <Modal
            visible={isDatePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsDatePickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setIsDatePickerVisible(false)}
            >
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  style={{ width: '100%' }}
                  minimumDate={new Date()}
                  themeVariant="light"
                  textColor="black"
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}
        
        {/* Time Picker Modal */}
        {isTimePickerVisible && (
          <Modal
            visible={isTimePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsTimePickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setIsTimePickerVisible(false)}
            >
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setIsTimePickerVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  testID="timeTimePicker"
                  value={getTimePickerValue()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  style={{ width: '100%' }}
                  minimumDate={getMinimumTime()}
                  themeVariant="light"
                  textColor="black"
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}
        
        {/* Party Size Picker Modal */}
        {isPartySizePickerVisible && (
          <Modal
            visible={isPartySizePickerVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsPartySizePickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setIsPartySizePickerVisible(false)}
            >
              <View style={styles.partySizePickerContainer}>
                <View style={styles.partySizePickerHeader}>
                  <Text style={styles.partySizePickerTitle}>Select Party Size</Text>
                  <TouchableOpacity onPress={() => setIsPartySizePickerVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.partySizePickerScrollView}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(size => (
                    <TouchableOpacity 
                      key={size}
                      style={[styles.partySizeOption, selectedPartySize === size && styles.selectedOption]}
                      onPress={() => handlePartySizeSelect(size)}
                    >
                      <Text style={[styles.partySizeText, selectedPartySize === size && styles.selectedOptionText]}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginTop: 0,
        }}>
          <EhgezliButton
            title="Book Now"
            variant="ehgezli"
            onPress={handleBooking}
            loading={bookingMutation.isPending}
            disabled={!selectedTime || bookingMutation.isPending}
            style={styles.bookButton}
          />
        </View>
      </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 150,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 14,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bookingDetails: {
    marginBottom: 0,
  },
  bookingInfoContainer: {
    marginBottom: 16,
  },
  bookingInfoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(355,79%,36%)', 
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 5,
    marginBottom: 5,
    borderWidth: 0,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 12,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    width: '100%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timePickerWheelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  timePickerScrollView: {
    maxHeight: 150,
  },
  timePickerItem: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timePickerItemText: {
    fontSize: 16,
  },
  selectedTimePickerItem: {
    backgroundColor: 'hsl(355,79%,36%)',
    color: '#fff',
  },
  partySizeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: 'hsl(355,79%,36%)',
  },
  partySizeText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#fff',
  },
  bookButton: {
    marginBottom: 10,
    width: '100%',
  },
  locationContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationDistance: {
    fontSize: 14,
    color: '#666',
  },
  loadingMapContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMapText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  partySizePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  partySizePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  partySizePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  partySizePickerScrollView: {
    maxHeight: 200,
  },
});
