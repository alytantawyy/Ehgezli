import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/auth-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getUserBookings } from '../../../api/booking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
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
  
  // Get user context
  const { user } = useAuth();

  // Fetch user bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', user?.id, activeFilter],
    queryFn: () => getUserBookings(),
    enabled: !!user,
  });

  // Filter bookings based on selected filter
  const filteredBookings = React.useMemo(() => {
    if (!bookings) return [];
    
    const now = new Date();
    
    switch (activeFilter) {
      case 'upcoming':
        return bookings.filter(booking => new Date(booking.timeSlot.date) >= now);
      case 'past':
        return bookings.filter(booking => new Date(booking.timeSlot.date) < now);
      case 'all':
      default:
        return bookings;
    }
  }, [bookings, activeFilter]);

  // Render a booking item
  const renderBookingItem = ({ item }: { item: BookingWithDetails }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => router.push((UserRoute.bookingDetails(item.id.toString())) as any)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.restaurantName}>{item.branch.restaurantName}</Text>
        <StatusBadge status={item.status} />
      </View>
      
      <View style={styles.bookingDetails}>
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      
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
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
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
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingDetails: {
    marginTop: 8,
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
    backgroundColor: '#FF385C',
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
});
