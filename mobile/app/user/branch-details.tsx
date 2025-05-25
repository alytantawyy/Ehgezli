import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Custom components
import { EhgezliButton } from '../../components/common/EhgezliButton';
import DateTimePicker from '@react-native-community/datetimepicker';

// Hooks and utilities
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../hooks/useAuth';
import { UserRoute } from '../../types/navigation';

/**
 * Branch Details Screen
 * 
 * Displays detailed information about a specific restaurant branch
 * and allows users to make bookings
 */
export default function BranchDetailsScreen() {
  // Get branch ID from URL params
  const { id } = useLocalSearchParams<{ id: string }>();
  const branchId = parseInt(id);
  
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('18:00');
  const [partySize, setPartySize] = useState(2);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Get branch data from custom hook
  const { 
    selectedBranch, 
    loading, 
    error, 
    fetchBranchById,
  } = useBranches();
  
  // Get user data
  const { user, userType } = useAuth();
  
  // Fetch branch details on mount
  useEffect(() => {
    if (branchId) {
      fetchBranchById(branchId);
    }
  }, [branchId]);
  
  // State for booking process
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Handle booking creation
  const handleCreateBooking = async () => {
    // Reset states
    setBookingError(null);
    setIsBooking(true);
    
    try {
      // Example booking data that would be sent to the API
      const bookingData = {
        branchId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        partySize,
        userId: user?.id
      };
      
      console.log('Creating booking with data:', bookingData);
      
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
  
  // Handle date change
  const handleDateChange = (event: any, date: Date | undefined) => {
    setSelectedDate(date || selectedDate);
    // Here you would fetch available time slots for this date
    // fetchAvailableSlots(branchId, format(date, 'yyyy-MM-dd'));
  };
  
  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  // Handle party size change
  const handlePartySizeChange = (size: number) => {
    setPartySize(size);
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading branch details...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error || !selectedBranch) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff0000" />
        <Text style={styles.errorText}>{error || 'Branch not found'}</Text>
        <EhgezliButton 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.errorButton}
        />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: selectedBranch.restaurantName,
          headerBackTitle: 'Back',
        }}
      />
      
      {/* Branch Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: selectedBranch.logo || 'https://via.placeholder.com/150' }} 
          style={styles.logo}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.branchName}>{selectedBranch.restaurantName}</Text>
          <Text style={styles.cuisine}>{selectedBranch.cuisine}</Text>
          <Text style={styles.priceRange}>{selectedBranch.priceRange}</Text>
          {selectedBranch.distance && (
            <Text style={styles.distance}>{selectedBranch.distance.toFixed(1)} km away</Text>
          )}
        </View>
      </View>
      
      {/* Branch Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={24} color="#666" />
          <Text style={styles.detailText}>{selectedBranch.address}, {selectedBranch.city}</Text>
        </View>
        
        {/* Add more details like hours, phone, etc. */}
      </View>
      
      {/* Booking Section */}
      <View style={styles.bookingContainer}>
        <Text style={styles.sectionTitle}>Make a Reservation</Text>
        
        {/* Date Picker */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Date</Text>
          <DateTimePicker 
            value={selectedDate}
            onChange={(event, date) => handleDateChange(event, date || selectedDate)}
            mode="date"
          />
        </View>
        
        {/* Time Picker */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Time</Text>
          <View style={styles.timeSlots}>
            {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'].map(time => (
              <TouchableOpacity 
                key={time}
                style={[styles.timeSlot, selectedTime === time && styles.selectedTimeSlot]}
                onPress={() => handleTimeSelect(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.selectedTimeText]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Party Size */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Party Size</Text>
          <View style={styles.partySizeContainer}>
            <TouchableOpacity 
              style={styles.partySizeButton}
              onPress={() => handlePartySizeChange(Math.max(1, partySize - 1))}
            >
              <Ionicons name="remove" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.partySize}>{partySize}</Text>
            <TouchableOpacity 
              style={styles.partySizeButton}
              onPress={() => handlePartySizeChange(partySize + 1)}
            >
              <Ionicons name="add" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Book Now Button */}
        {isBooking ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.bookButton} />
        ) : bookingSuccess ? (
          <View style={styles.bookButton}>
            <Text style={styles.bookingSuccessText}>Booking successful!</Text>
          </View>
        ) : (
          <EhgezliButton 
            title="Book Now" 
            onPress={handleCreateBooking} 
            style={styles.bookButton}
          />
        )}
        
        {bookingError && (
          <Text style={styles.bookingErrorText}>{bookingError}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginTop: 10,
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  branchName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  priceRange: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    color: '#0066cc',
  },
  detailsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  bookingContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: '#0066cc',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partySizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partySize: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  bookButton: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingSuccessText: {
    fontSize: 16,
    color: '#0066cc',
  },
  bookingErrorText: {
    fontSize: 16,
    color: '#ff0000',
    marginTop: 10,
  },
});
