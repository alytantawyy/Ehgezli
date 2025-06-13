import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import { StatusBadge } from '../../../components/common/StatusBadge';
import ModalPicker from '@/components/common/ModalPicker';
import DatePickerModal from '@/components/common/DatePickerModal';

// Components
import { BookingCard } from '../../../components/restaurantScreen/BookingCard';

// Stores and hooks
import { useBookingStore } from '../../../store/booking-store';
import { useBranchStore } from '../../../store/branch-store';
import { useAuth } from '../../../hooks/useAuth';
import { BranchListItem } from '../../../types/branch';
import { BookingWithDetails } from '../../../types/booking';

/**
 * Restaurant Bookings Screen
 * 
 * Displays and manages bookings for restaurant branches
 */
export default function RestaurantBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Get store hooks
  const { getBookingsForBranch, getBookingsForBranchOnDate, loading: bookingsLoading, refreshTrigger } = useBookingStore();
  const { selectedBranchId, getSelectedBranch } = useBranchStore();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'arrived' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Load initial data
  useEffect(() => {
    loadBookings();
  }, []);
  
  // Refresh bookings when branch or date changes
  useEffect(() => {
    if (selectedBranchId) {
      loadBookings();
    }
  }, [selectedBranchId, selectedDate]);
  
  // Listen for booking store refresh trigger
  useEffect(() => {
    if (selectedBranchId && refreshTrigger > 0) {
      console.log('Refresh trigger detected in bookings tab, reloading bookings');
      loadBookings();
    }
  }, [refreshTrigger]);
  
  // Load bookings for selected branch
  const loadBookings = async () => {
    if (!selectedBranchId) return;
    
    try {
      setLoading(true);
      
      let fetchedBookings: BookingWithDetails[] = [];
      
      if (selectedDate) {
        // Fetch bookings for the selected date
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        fetchedBookings = await getBookingsForBranchOnDate(parseInt(selectedBranchId), formattedDate);
      } else {
        // Fetch all bookings for the branch
        fetchedBookings = await getBookingsForBranch(parseInt(selectedBranchId));
      }
      
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };
  
  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate(null);
  };
  
  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status as 'all' | 'arrived' | 'confirmed' | 'completed' | 'cancelled');
  };
  
  // Filter bookings by status
  const filteredBookings = bookings.filter(booking => {
    // If filter is 'all', show all bookings
    if (filterStatus === 'all') return true;
    
    // Otherwise, filter by status
    return booking.status.toLowerCase() === filterStatus.toLowerCase();
  });
  
  // Format date for display
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'All Bookings';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };
  
  // Render loading state
  if (loading || bookingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={48} color="#999" />
      <Text style={styles.emptyStateText}>
        {filterStatus === 'all' 
          ? 'No bookings found' 
          : `No ${filterStatus} bookings found`}
      </Text>
    </View>
  );
  
  // Render booking item
  const renderBookingItem = ({ item }: { item: BookingWithDetails }) => {
    // Format the booking data for display
    const bookingData = {
      ...item,
      // If we don't have timeSlot data, create it from the booking's own data
      timeSlot: item.timeSlot || {
        startTime: item.createdAt ? new Date(item.createdAt).toTimeString().substring(0, 5) : 'N/A',
        endTime: 'N/A',
        date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'N/A'
      },
      // Use user information from the backend if available, otherwise fall back to guest name
      userName: item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.guestName),
      // Ensure we have a party size
      partySize: item.partySize || 2
    };
    
    return (
      <BookingCard 
        booking={bookingData}
        onPress={() => router.push(`/restaurant/booking/${item.id}`)}
        onStatusChange={() => {
          console.log('Status changed, refreshing bookings list');
          loadBookings();
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Bookings',
          headerStyle: {
            backgroundColor: '#B22222',
          },
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.subtitle}>
          {selectedBranchId ? 
            `${getSelectedBranch()?.address || 'Selected Branch'}` : 
            'No Branch Selected'}
        </Text>
      </View>
      
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={styles.dateButtonText}>
            {selectedDate ? formatDateForDisplay(selectedDate) : 'All Bookings'}
          </Text>
          <Ionicons name="calendar-outline" size={16} color="#B22222" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
        
        {selectedDate && (
          <TouchableOpacity 
            style={styles.clearDateButton}
            onPress={clearDateFilter}
          >
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => {
          handleDateSelect(date);
          setDatePickerVisible(false);
        }}
        selectedDate={selectedDate || new Date()}
      />
      
      {/* Status Filter */}
      <View style={styles.statusFilter}>
        <TouchableOpacity 
          style={[styles.statusButton, filterStatus === 'all' && styles.statusButtonActive]}
          onPress={() => handleStatusFilter('all')}
        >
          <Text style={[styles.statusButtonText, filterStatus === 'all' && styles.statusButtonTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusButton, filterStatus === 'arrived' && styles.statusButtonActive]}
          onPress={() => handleStatusFilter('arrived')}
        >
          <Text style={[styles.statusButtonText, filterStatus === 'arrived' && styles.statusButtonTextActive]}>Arrived</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusButton, filterStatus === 'confirmed' && styles.statusButtonActive]}
          onPress={() => handleStatusFilter('confirmed')}
        >
          <Text style={[styles.statusButtonText, filterStatus === 'confirmed' && styles.statusButtonTextActive]}>Confirmed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusButton, filterStatus === 'completed' && styles.statusButtonActive]}
          onPress={() => handleStatusFilter('completed')}
        >
          <Text style={[styles.statusButtonText, filterStatus === 'completed' && styles.statusButtonTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusButton, filterStatus === 'cancelled' && styles.statusButtonActive]}
          onPress={() => handleStatusFilter('cancelled')}
        >
          <Text style={[styles.statusButtonText, filterStatus === 'cancelled' && styles.statusButtonTextActive]}>Cancelled</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.bookingsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadBookings();
            }}
            colors={['#B22222']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={true}
        style={styles.flatListContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#B22222',
    fontWeight: '500',
  },
  clearDateButton: {
    marginLeft: 10,
    padding: 5,
  },
  statusFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: '#B22222',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#333',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  bookingsList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  flatListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
