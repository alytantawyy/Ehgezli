import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { getCurrentRestaurant } from '../../shared/api/client';
import Colors from '../../constants/Colors';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface Branch {
  id: number;
  address: string;
  city: string;
}

interface RestaurantData {
  id: number;
  name: string;
  branches: Branch[];
}

interface BookingSummary {
  totalBookings: number;
  totalSeats: number;
  availableSeats: number;
  currentlySeated: number;
}

interface Booking {
  id: number;
  customerName: string;
  partySize: number;
  time: string;
  status: string;
}

export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
    totalBookings: 0,
    totalSeats: 0,
    availableSeats: 0,
    currentlySeated: 0,
  });
  const [latestBookings, setLatestBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch restaurant data on component mount
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setIsLoading(true);
        const restaurantData = await getCurrentRestaurant();
        
        // For now, we'll use mock data since the API isn't fully implemented
        const mockRestaurantData = {
          id: restaurantData?.id || 1,
          name: restaurantData?.name || 'Restaurant Name',
          branches: [
            { id: 1, address: '123 Main St', city: 'New York' },
            { id: 2, address: '456 Park Ave', city: 'Boston' },
          ],
        };
        
        setRestaurant(mockRestaurantData);
        
        // Set the first branch as selected by default
        if (mockRestaurantData.branches.length > 0 && !selectedBranch) {
          setSelectedBranch(mockRestaurantData.branches[0].id);
        }
        
        // Load mock booking data
        loadMockBookingData();
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, []);
  
  // Load booking data when branch or date changes
  useEffect(() => {
    if (selectedBranch) {
      loadMockBookingData();
    }
  }, [selectedBranch, selectedDate]);
  
  const loadMockBookingData = () => {
    // Mock booking summary
    setBookingSummary({
      totalBookings: 25,
      totalSeats: 100,
      availableSeats: 45,
      currentlySeated: 30,
    });
    
    // Mock latest bookings
    setLatestBookings([
      { id: 1, customerName: 'John Doe', partySize: 4, time: '7:30 PM', status: 'confirmed' },
      { id: 2, customerName: 'Jane Smith', partySize: 2, time: '8:00 PM', status: 'seated' },
      { id: 3, customerName: 'Robert Johnson', partySize: 6, time: '6:45 PM', status: 'confirmed' },
      { id: 4, customerName: 'Emily Davis', partySize: 3, time: '7:15 PM', status: 'seated' },
      { id: 5, customerName: 'Michael Brown', partySize: 2, time: '8:30 PM', status: 'confirmed' },
    ]);
  };
  
  const handleDateChange = (daysToAdd: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    setSelectedDate(newDate);
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.tint} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <Text style={styles.welcomeText}>Welcome to your dashboard</Text>
        </View>
        
        {/* Branch Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Select Branch:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBranch}
              onValueChange={(itemValue: number) => setSelectedBranch(itemValue)}
              style={styles.picker}
            >
              {restaurant?.branches.map((branch) => (
                <Picker.Item key={branch.id} label={`${branch.address}, ${branch.city}`} value={branch.id} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* Date Selector */}
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => handleDateChange(-1)} style={styles.dateArrow}>
            <MaterialIcons name="chevron-left" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.dateText}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
          
          <TouchableOpacity onPress={() => handleDateChange(1)} style={styles.dateArrow}>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Booking Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.totalBookingsCard]}>
            <FontAwesome5 name="calendar-check" size={24} color="#fff" />
            <Text style={styles.summaryValue}>{bookingSummary.totalBookings}</Text>
            <Text style={styles.summaryLabel}>Total Bookings</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.totalSeatsCard]}>
            <FontAwesome5 name="chair" size={24} color="#fff" />
            <Text style={styles.summaryValue}>{bookingSummary.totalSeats}</Text>
            <Text style={styles.summaryLabel}>Total Seats</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.availableSeatsCard]}>
            <FontAwesome5 name="chair" size={24} color="#fff" />
            <Text style={styles.summaryValue}>{bookingSummary.availableSeats}</Text>
            <Text style={styles.summaryLabel}>Available Seats</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.currentlySeatedCard]}>
            <FontAwesome5 name="users" size={24} color="#fff" />
            <Text style={styles.summaryValue}>{bookingSummary.currentlySeated}</Text>
            <Text style={styles.summaryLabel}>Currently Seated</Text>
          </View>
        </View>
        
        {/* Latest Bookings */}
        <View style={styles.bookingsContainer}>
          <Text style={styles.sectionTitle}>Latest Bookings</Text>
          
          {latestBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{booking.customerName}</Text>
                <Text style={styles.bookingDetails}>
                  {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'} • {booking.time}
                </Text>
              </View>
              
              <View style={styles.bookingStatusContainer}>
                <Text 
                  style={[
                    styles.bookingStatus, 
                    booking.status === 'confirmed' ? styles.confirmedStatus : styles.seatedStatus
                  ]}
                >
                  {booking.status === 'confirmed' ? 'Confirmed' : 'Seated'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  header: {
    padding: 20,
    backgroundColor: Colors.tint,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  selectorContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateArrow: {
    padding: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 15,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalBookingsCard: {
    backgroundColor: '#4361ee',
  },
  totalSeatsCard: {
    backgroundColor: '#3a0ca3',
  },
  availableSeatsCard: {
    backgroundColor: '#4cc9f0',
  },
  currentlySeatedCard: {
    backgroundColor: '#f72585',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  bookingsContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookingStatusContainer: {
    marginLeft: 10,
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  confirmedStatus: {
    backgroundColor: '#e6f7ff',
    color: '#0070f3',
  },
  seatedStatus: {
    backgroundColor: '#f6ffed',
    color: '#52c41a',
  },
});
