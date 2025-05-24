import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getBookingsForBranch } from '../../../api/booking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { BookingWithCustomer, BookingStatus } from '../../../types/booking';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DetailRow } from '../../../components/common/DetailRow';
import { RestaurantRoute } from '../../../types/navigation';

/**
 * Restaurant Bookings Screen
 * 
 * Displays and manages restaurant bookings with filtering options
 */
export default function RestaurantBookingsScreen() {
  // Filter options for bookings
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'today' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  // Get restaurant user context
  const { user } = useAuth();

  // Fetch restaurant bookings
  const { data: rawBookings = [], isLoading } = useQuery({
    queryKey: ['restaurantBookings', user?.id, activeFilter, selectedBranch],
    queryFn: () => getBookingsForBranch(parseInt(selectedBranch)),
    enabled: !!user && selectedBranch !== 'all',
  });

  /**
   * Data Transformation: BookingWithDetails → BookingWithCustomer
   * 
   * Purpose:
   * This transformation converts the API response data (BookingWithDetails) into the format
   * expected by the restaurant booking UI components (BookingWithCustomer).
   * 
   * Why it's necessary:
   * 1. Type Safety: Ensures TypeScript type checking passes for our FlatList component
   * 2. UI Requirements: The restaurant view needs customer-focused data that's structured differently
   * 3. Data Normalization: Creates a consistent format regardless of whether bookings were made by
   *    registered users or guests
   * 
   * Transformation details:
   * - Branch data: Simplifies the branch object to only include the name (from restaurantName)
   * - User data: Creates a structured user object even for guest bookings (with empty/default values)
   * - customerName: Adds a computed field that displays the guest name or a default "Guest" label
   * 
   * Performance optimization:
   * - Uses React.useMemo to prevent unnecessary re-computation on each render
   * - Only recalculates when rawBookings data changes
   * 
   * @param {BookingWithDetails[]} rawBookings - The original booking data from the API
   * @returns {BookingWithCustomer[]} - Transformed booking data ready for the restaurant UI
   */
  const bookings: BookingWithCustomer[] = React.useMemo(() => {
    return rawBookings.map(booking => ({
      ...booking,
      branch: {
        name: booking.branch.restaurantName || 'Unknown Branch',
        address: booking.branch.address,
        city: booking.branch.city
      },
      user: {
        firstName: '',
        lastName: '',
        email: booking.guestEmail || '',
        phone: booking.guestPhone || '',
      },
      customerName: booking.guestName || 'Guest',
    }));
  }, [rawBookings]);

  // Render a booking item
  const renderBookingItem = ({ item }: { item: BookingWithCustomer }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => router.push(RestaurantRoute.reservationDetails(item.id.toString()) as any)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <StatusBadge status={item.status} />
      </View>
      
      <View style={styles.bookingDetails}>
        <DetailRow 
          icon="business" 
          text={item.branch.name} 
        />
        
        <DetailRow 
          icon="calendar" 
          text={format(new Date(item.timeSlot.date), 'EEE, MMM d, yyyy')} 
        />
        
        <DetailRow 
          icon="time" 
          text={format(new Date(`${item.timeSlot.date}T${item.timeSlot.startTime}`), 'h:mm a')} 
        />
        
        <DetailRow 
          icon="people" 
          text={`${item.partySize} ${item.partySize === 1 ? 'person' : 'people'}`} 
        />
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.confirmButton]}
          onPress={() => handleUpdateStatus(item.id, 'confirmed')}
        >
          <Text style={styles.actionButtonText}>Confirm</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleUpdateStatus(item.id, 'cancelled')}
        >
          <Text style={styles.actionButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Handle updating booking status
  const handleUpdateStatus = (bookingId: number, status: BookingStatus) => {
    // Implementation would go here
    console.log(`Update booking ${bookingId} to ${status}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => router.push(RestaurantRoute.calendarView)}
        >
          <Ionicons name="calendar" size={24} color="#FF385C" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
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
              activeFilter === 'today' && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter('today')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'today' && styles.activeFilterText
            ]}>Today</Text>
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
              activeFilter === 'cancelled' && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter('cancelled')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'cancelled' && styles.activeFilterText
            ]}>Cancelled</Text>
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
        </ScrollView>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No bookings found</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#FF385C',
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
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
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
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
});
