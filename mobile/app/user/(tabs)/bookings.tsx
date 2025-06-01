import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { router, useFocusEffect } from 'expo-router';
import { useBookings } from '../../../hooks/useBookings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingWithDetails } from '../../../types/booking';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DetailRow } from '../../../components/common/DetailRow';
import { UserRoute } from '../../../types/navigation';

/**
 * Bookings Tab Screen
 * 
 * Displays the user's restaurant bookings with filtering options
 */
export default function BookingsScreen() {
  // Filter options for bookings
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  // Sort options
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Get user context
  const { user } = useAuth();
  
  // Use the bookings hook which includes React Query functionality
  const { 
    userBookings,
    loading, 
    error,
    fetchUserBookings,
    cancelBooking,
    getFilteredAndSortedBookings,
    safeFormatDate,
    safeFormatTime,
    isBookingPast
  } = useBookings();

  // Refresh bookings when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserBookings();
      }
    }, [user, fetchUserBookings])
  );

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    try {
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await cancelBooking(bookingId);
                if (success) {
                  Alert.alert('Success', 'Your booking has been cancelled.');
                } else {
                  Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                }
              } catch (error: any) {
                Alert.alert('Error', `Failed to cancel booking: ${error.message}`);
              }
            } 
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', `An error occurred: ${error.message}`);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  // Get filtered and sorted bookings
  const filteredBookings = userBookings ? getFilteredAndSortedBookings(activeFilter, sortOrder) : [];
  
  // Debug logs
  console.log('User Bookings:', userBookings?.length || 0);
  console.log('Filtered Bookings:', filteredBookings?.length || 0);
  console.log('Active Filter:', activeFilter);
  console.log('Sort Order:', sortOrder);
  
  if (userBookings && userBookings.length > 0) {
    console.log('First booking:', JSON.stringify(userBookings[0], null, 2));
    console.log('First booking timeSlot:', userBookings[0]?.timeSlot);
    
    // Check if any bookings pass the filter
    const upcomingCount = userBookings.filter(b => b.timeSlot && new Date(b.timeSlot.date) >= new Date()).length;
    const pastCount = userBookings.filter(b => b.timeSlot && new Date(b.timeSlot.date) < new Date()).length;
    console.log(`Manual count - Upcoming: ${upcomingCount}, Past: ${pastCount}, Missing timeSlot: ${userBookings.length - upcomingCount - pastCount}`);
  }

  // Render a booking item
  const renderBookingItem = ({ item }: { item: BookingWithDetails }) => {
    const isPast = isBookingPast(item);
    
    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => router.push((UserRoute.bookingDetails(item.id.toString())) as any)}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.restaurantName}>{item.branch?.restaurantName || 'Restaurant'}</Text>
          <StatusBadge status={item.status} />
        </View>
        
        <View style={styles.bookingDetails}>
          <DetailRow 
            icon="calendar" 
            text={item.timeSlot?.date ? safeFormatDate(item.timeSlot.date, 'EEE, MMM d, yyyy') : 'Date not available'} 
          />
          
          <DetailRow 
            icon="time" 
            text={item.timeSlot?.date && item.timeSlot?.startTime ? 
              safeFormatTime(item.timeSlot.date, item.timeSlot.startTime, 'h:mm a') : 
              'Time not available'} 
          />
          
          <DetailRow 
            icon="people" 
            text={`${item.partySize} ${item.partySize === 1 ? 'person' : 'people'}`} 
          />
          
          <DetailRow 
            icon="location" 
            text={item.branch ? `${item.branch.address || ''}, ${item.branch.city || ''}`.trim() : 'Location not available'} 
          />
        </View>
        
        {/* Only show cancel button for upcoming bookings that aren't already cancelled */}
        {!isPast && item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Show error state if there's an error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#B22222" />
          <Text style={styles.errorText}>Error loading bookings</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchUserBookings()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Bookings</Text>
        
        {/* Sort button */}
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={toggleSortOrder}
        >
          <Ionicons 
            name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.sortButtonText}>
            {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'upcoming' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('upcoming')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'upcoming' && styles.activeFilterText
          ]}>Upcoming</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'past' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('past')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'past' && styles.activeFilterText
          ]}>Past</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'all' && styles.activeFilterText
          ]}>All</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B22222" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No bookings found</Text>
          <TouchableOpacity 
            style={styles.findButton}
            onPress={() => router.replace(UserRoute.tabs as any)}
          >
            <Text style={styles.findButtonText}>Find Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={false} 
              onRefresh={fetchUserBookings} 
              colors={['#B22222']} 
              tintColor="#B22222"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#B22222',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDetails: {
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#B22222',
    borderRadius: 6,
    padding: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#B22222',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  findButton: {
    backgroundColor: '#B22222',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B22222',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#B22222',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
