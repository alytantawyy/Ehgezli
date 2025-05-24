import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDetailedRestaurant } from '@/api/restaurant';
import { formatTimeWithAMPM } from '../utils/time-slots';
import { EhgezliButton } from '@/components/common/EhgezliButton';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../context/location-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getBranchById } from '@/api/branch';
import { createBooking } from '@/api/booking';
import { DetailedRestaurantResponse, RestaurantBranch } from '@/types/restaurant';
import { Branch, CreateBookingData } from '@/types/booking';
import { RestaurantMap } from '@/components/restaurantScreen/RestaurantMap';

// Define time slot interface for type safety
interface TimeSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  remainingSeats: number;
  remainingTables?: number;
}

// Define branch with city for type safety
interface BranchWithCity extends RestaurantBranch {
  city: string;
  distance?: number;
}

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id, branchId } = useLocalSearchParams<{ id: string; branchId: string }>();
  const { user } = useAuth();
  const { location } = useLocation();
  const colors = Colors; // Use Colors directly without indexing

  // State for booking flow
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedPartySize, setSelectedPartySize] = useState(2);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isPartySizePickerVisible, setIsPartySizePickerVisible] = useState(false);
  
  // Generate sample time slots for demo purposes
  useEffect(() => {
    // In a real app, you would fetch these from your API based on the selected date
    const sampleTimeSlots: TimeSlot[] = [
      { id: 1, date: selectedDate.toISOString(), startTime: '12:00:00', endTime: '13:30:00', remainingSeats: 8, remainingTables: 2 },
      { id: 2, date: selectedDate.toISOString(), startTime: '13:30:00', endTime: '15:00:00', remainingSeats: 12, remainingTables: 3 },
      { id: 3, date: selectedDate.toISOString(), startTime: '15:00:00', endTime: '16:30:00', remainingSeats: 6, remainingTables: 1 },
      { id: 4, date: selectedDate.toISOString(), startTime: '18:00:00', endTime: '19:30:00', remainingSeats: 10, remainingTables: 2 },
      { id: 5, date: selectedDate.toISOString(), startTime: '19:30:00', endTime: '21:00:00', remainingSeats: 4, remainingTables: 1 },
    ];
    setAvailableTimeSlots(sampleTimeSlots);
  }, [selectedDate]);
  
  // Query restaurant details
  const { data: restaurant, isLoading, error } = useQuery<DetailedRestaurantResponse>({  
    queryKey: ['restaurant', id],
    queryFn: () => getDetailedRestaurant(Number(id)),
  });
  
  // Query restaurant branch with user's coordinates for distance calculation
  const { data: locationData, isLoading: isLocationLoading } = useQuery<RestaurantBranch>({  
    queryKey: ['branch', branchId, location?.coords.latitude, location?.coords.longitude],
    queryFn: () => getBranchById(Number(branchId)),
    enabled: !!branchId && !!location,
  });
  
  // Mutation for creating a booking
  const createBookingMutation = useMutation({
    mutationFn: (bookingData: CreateBookingData) => createBooking(bookingData),
    onSuccess: () => {
      Alert.alert(
        'Booking Confirmed',
        'Your reservation has been successfully confirmed!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error) => {
      Alert.alert('Booking Failed', 'There was an error creating your booking. Please try again.');
      console.error('Booking error:', error);
    }
  });
  
  // Find the selected branch
  const selectedBranch = locationData as BranchWithCity | undefined;
  
  const handleBooking = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to make a reservation',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }
    
    if (!selectedTimeSlot) {
      Alert.alert('Please select a time slot');
      return;
    }
    
    const bookingData: CreateBookingData = {
      timeSlotId: selectedTimeSlot.id,
      partySize: selectedPartySize,
    };
    
    createBookingMutation.mutate(bookingData);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading restaurant details...</Text>
      </View>
    );
  }
  
  if (error || !restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: colors.text }}>Error loading restaurant details</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Restaurant Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: restaurant.profile.logo || 'https://via.placeholder.com/400x200?text=Restaurant' }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.user.name}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{restaurant.profile.cuisine || 'Various Cuisine'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{restaurant.profile.priceRange || '$$$'}</Text>
            </View>
          </View>
          
          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.aboutText, { color: colors.text }]}>
              {restaurant.profile.about || 'No description available.'}
            </Text>
          </View>
          
          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <TouchableOpacity style={styles.locationContainer}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationAddress}>
                  {selectedBranch?.address || 'View location'}
                </Text>
                {selectedBranch?.distance && (
                  <Text style={styles.locationDistance}>
                    {selectedBranch.distance.toFixed(1)} km away
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
            
            {/* Map */}
            <View style={styles.mapContainer}>
              {selectedBranch && (
                <RestaurantMap 
                  branches={[selectedBranch as Branch]}
                  restaurantName={restaurant.user.name}
                  isPreview={true}  
                />
              )}
            </View>
          </View>
          
          {/* Booking Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Make a Reservation</Text>
            
            <View style={styles.bookingContainer}>
              {/* Date Picker Button */}
              <TouchableOpacity 
                style={styles.bookingInfoContainer}
                onPress={() => setIsDatePickerVisible(true)}
              >
                <View style={styles.bookingInfoRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
                  <View style={{flex: 1}} />
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </View>
              </TouchableOpacity>
              
              {/* Time Picker Button */}
              <TouchableOpacity 
                style={styles.bookingInfoContainer}
                onPress={() => setIsTimePickerVisible(true)}
              >
                <View style={styles.bookingInfoRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {selectedTimeSlot 
                      ? formatTimeWithAMPM(selectedTimeSlot.startTime)
                      : 'Select time'}
                  </Text>
                  <View style={{flex: 1}} />
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </View>
              </TouchableOpacity>
              
              {/* Party Size Picker Button */}
              <TouchableOpacity 
                style={styles.bookingInfoContainer}
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
        </View>
        
        {/* Date Picker Modal */}
        {isDatePickerVisible && (
          <Modal
            visible={isDatePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsDatePickerVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                />
                <EhgezliButton 
                  title="Confirm"
                  onPress={() => setIsDatePickerVisible(false)}
                  style={styles.confirmButton}
                />
              </View>
            </View>
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
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <ScrollView style={styles.timeSlotContainer}>
                  {availableTimeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlotButton,
                        selectedTimeSlot?.id === slot.id && styles.selectedTimeSlot
                      ]}
                      onPress={() => setSelectedTimeSlot(slot)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTimeSlot?.id === slot.id && styles.selectedTimeSlotText
                      ]}>
                        {formatTimeWithAMPM(slot.startTime)}
                      </Text>
                      <Text style={styles.seatsText}>
                        {slot.remainingSeats} seats available
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <EhgezliButton 
                  title="Confirm"
                  onPress={() => setIsTimePickerVisible(false)}
                  style={styles.confirmButton}
                  disabled={!selectedTimeSlot}
                />
              </View>
            </View>
          </Modal>
        )}
        
        {/* Party Size Picker Modal */}
        {isPartySizePickerVisible && (
          <Modal
            visible={isPartySizePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsPartySizePickerVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Party Size</Text>
                <ScrollView style={styles.partySizeContainer}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.partySizeButton,
                        selectedPartySize === size && styles.selectedPartySize
                      ]}
                      onPress={() => setSelectedPartySize(size)}
                    >
                      <Text style={[
                        styles.partySizeText,
                        selectedPartySize === size && styles.selectedPartySizeText
                      ]}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <EhgezliButton 
                  title="Confirm"
                  onPress={() => setIsPartySizePickerVisible(false)}
                  style={styles.confirmButton}
                />
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
      
      {/* Booking Button */}
      <View style={styles.bookingButtonContainer}>
        <EhgezliButton 
          title="Book Now"
          onPress={handleBooking}
          disabled={!selectedTimeSlot}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  imageContainer: {
    height: 200,
    width: '100%',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookingContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  bookingInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  bookingButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeSlotContainer: {
    maxHeight: 300,
  },
  timeSlotButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  seatsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  partySizeContainer: {
    maxHeight: 300,
  },
  partySizeButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedPartySize: {
    backgroundColor: '#007AFF',
  },
  partySizeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedPartySizeText: {
    color: '#fff',
  },
  confirmButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
