import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays } from 'date-fns';
import { getBookingsForBranch } from '../../../api/booking';
import { getAllBranches } from '../../../api/branch';
import { getRestaurantProfile } from '../../../api/restaurant';
import { RestaurantUser } from '../../../types/restaurantUser';
import { BookingWithDetails } from '../../../types/booking';

/**
 * Restaurant Dashboard Screen
 * 
 * Main dashboard for restaurant owners showing key metrics and recent bookings
 */
export default function DashboardScreen() {
  // Get restaurant user context
  const { user } = useAuth();
  // First cast to unknown, then to RestaurantUser to avoid the type error
  const restaurantUser = user as unknown as RestaurantUser;
  
  // State for selected branch and date
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Fetch restaurant profile
  const { data: restaurantProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['restaurantProfile', restaurantUser?.restaurantId],
    queryFn: () => getRestaurantProfile(),
    enabled: !!restaurantUser,
  });
  
  // Fetch restaurant branches
  const { data: branches = [], isLoading: isLoadingBranches, isError, error } = useQuery({
    queryKey: ['branches', restaurantUser?.restaurantId],
    queryFn: () => getAllBranches(),
    enabled: !!restaurantUser,
  });
  
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id.toString());
    }
  }, [branches, selectedBranch]);

  useEffect(() => {
    if (isError) {
      console.error(error);
    }
  }, [isError, error]);

  // Fetch bookings for selected branch and date
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', selectedBranch, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => getBookingsForBranch(parseInt(selectedBranch)),
    enabled: !!selectedBranch,
  });
  
  // Filter bookings for selected date
  const bookingsForSelectedDate = bookings.filter(booking => 
    booking.timeSlot.date === format(selectedDate, 'yyyy-MM-dd')
  );
  
  // Calculate stats
  const totalSeats = 100; // This would come from the branch data
  const totalBookings = bookingsForSelectedDate.length;
  const seatedCustomers = bookingsForSelectedDate.filter(b => b.status === 'arrived').length;
  const availableSeats = totalSeats - seatedCustomers;
  
  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };
  
  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  
  // Render a booking item
  const renderBookingItem = (booking: BookingWithDetails) => {
    // Format the customer name
    const customerName = booking.guestName || 'Guest';
    
    // Get status color
    const getStatusColor = (status: string) => {
      switch (status.toUpperCase()) {
        case 'ARRIVED':
          return '#4CAF50';
        case 'COMPLETED':
          return '#8BC34A';
        case 'CONFIRMED':
          return '#2196F3';
        case 'PENDING':
          return '#FFC107';
        case 'CANCELLED':
          return '#F44336';
        default:
          return '#9E9E9E';
      }
    };
    
    return (
      <TouchableOpacity 
        key={booking.id}
        style={styles.bookingItem}
        onPress={() => router.push(`/restaurant/booking-details/${booking.id}` as any)}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.customerName}>{customerName}</Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingDetails}>
          <Text style={styles.bookingInfo}>
            {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'} • 
            {format(new Date(`${booking.timeSlot.date}T${booking.timeSlot.startTime}`), 'MMM d')} • 
            {format(new Date(`${booking.timeSlot.date}T${booking.timeSlot.startTime}`), 'h:mm a')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Restaurant Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>ehgezli</Text>
            <Text style={styles.dashboardTitle}>Restaurant Dashboard</Text>
            <Text style={styles.welcomeText}>Welcome, {restaurantProfile?.name || 'Restaurant Owner'}!</Text>
          </View>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo}
          />
        </View>
        
        {/* Branch Selector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Branch:</Text>
          {isLoadingBranches ? (
            <ActivityIndicator size="small" color="#FF385C" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches.map((branch) => (
                <TouchableOpacity 
                  key={branch.id}
                  style={[
                    styles.branchButton,
                    selectedBranch === branch.id.toString() && styles.selectedBranchButton
                  ]}
                  onPress={() => setSelectedBranch(branch.id.toString())}
                >
                  <Text 
                    style={[
                      styles.branchButtonText,
                      selectedBranch === branch.id.toString() && styles.selectedBranchButtonText
                    ]}
                  >
                    {branch.restaurantName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        
        {/* Date Navigator */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.dateNavButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateDisplay}>
            <Text style={styles.dateText}>{format(selectedDate, 'MMM d')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#000" style={styles.calendarIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNextDay} style={styles.dateNavButton}>
            <Ionicons name="chevron-forward" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.blueCard]}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          
          <View style={[styles.statCard, styles.purpleCard]}>
            <Ionicons name="restaurant-outline" size={24} color="#fff" />
            <Text style={styles.statValue}>{totalSeats}</Text>
            <Text style={styles.statLabel}>Total Seats</Text>
          </View>
          
          <View style={[styles.statCard, styles.cyanCard]}>
            <Ionicons name="restaurant-outline" size={24} color="#fff" />
            <Text style={styles.statValue}>{availableSeats}</Text>
            <Text style={styles.statLabel}>Available Seats</Text>
          </View>
          
          <View style={[styles.statCard, styles.pinkCard]}>
            <Ionicons name="people-outline" size={24} color="#fff" />
            <Text style={styles.statValue}>{seatedCustomers}</Text>
            <Text style={styles.statLabel}>Currently Seated</Text>
          </View>
        </View>
        
        {/* Bookings for Selected Date */}
        <View style={styles.bookingsContainer}>
          <Text style={styles.bookingsTitle}>Bookings on {format(selectedDate, 'MMM d')}</Text>
          
          {isLoadingBookings ? (
            <ActivityIndicator size="large" color="#FF385C" style={styles.loader} />
          ) : bookingsForSelectedDate.length === 0 ? (
            <Text style={styles.noBookingsText}>No bookings available for today</Text>
          ) : (
            bookingsForSelectedDate.map(booking => renderBookingItem(booking))
          )}
        </View>
        
        {/* Latest Bookings */}
        <View style={styles.bookingsContainer}>
          <Text style={styles.bookingsTitle}>Latest Bookings</Text>
          
          {isLoadingBookings ? (
            <ActivityIndicator size="large" color="#FF385C" style={styles.loader} />
          ) : bookings.length === 0 ? (
            <Text style={styles.noBookingsText}>No bookings available</Text>
          ) : (
            bookings
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map(booking => renderBookingItem(booking))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dashboardTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  branchButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  selectedBranchButton: {
    borderColor: '#FF385C',
    backgroundColor: '#FFF0F3',
  },
  branchButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedBranchButtonText: {
    color: '#FF385C',
    fontWeight: '500',
  },
  dateNavigator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateNavButton: {
    padding: 10,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
  },
  calendarIcon: {
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueCard: {
    backgroundColor: '#4A6FFF',
  },
  purpleCard: {
    backgroundColor: '#6A3DE8',
  },
  cyanCard: {
    backgroundColor: '#00BCD4',
  },
  pinkCard: {
    backgroundColor: '#FF4081',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  bookingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  bookingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  loader: {
    marginVertical: 20,
  },
  noBookingsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  bookingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bookingDetails: {
    marginTop: 5,
  },
  bookingInfo: {
    fontSize: 14,
    color: '#666',
  },
});
