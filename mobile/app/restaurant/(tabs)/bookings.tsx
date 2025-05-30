import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Components
import { BookingCard } from '../../../components/restaurantScreen/BookingCard';
import { StatusBadge } from '../../../components/common/StatusBadge';

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
  const { getBookingsForBranchOnDate, loading: bookingsLoading } = useBookingStore();
  const { getRestaurantBranches, loading: branchesLoading } = useBranchStore();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  // Load branches and bookings
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get restaurant branches
      const branchesData = await getRestaurantBranches(user?.id);
      setBranches(branchesData);
      
      // Set default selected branch to the first one
      if (branchesData.length > 0 && selectedBranchId === null) {
        setSelectedBranchId(branchesData[0].branchId.toString());
        await loadBookings(branchesData[0].branchId.toString(), selectedDate);
      } else if (selectedBranchId) {
        await loadBookings(selectedBranchId, selectedDate);
      }
    } catch (error) {
      console.error('Error loading branches data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Load bookings for a specific branch and date
  const loadBookings = async (branchId: string, date: string) => {
    try {
      const bookingsData = await getBookingsForBranchOnDate(Number(branchId), date);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };
  
  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    loadBookings(branchId, selectedDate);
  };
  
  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (selectedBranchId) {
      loadBookings(selectedBranchId, date);
    }
  };
  
  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status as 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled');
  };
  
  // Filter bookings by status
  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus);
  
  // Render loading state
  if (loading || branchesLoading) {
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
          ? 'No bookings found for this date' 
          : `No ${filterStatus} bookings found`}
      </Text>
    </View>
  );
  
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
      
      {/* Branch Selector */}
      {branches.length > 0 && (
        <View style={styles.branchSelector}>
          <Text style={styles.sectionTitle}>Branch:</Text>
          <FlatList
            horizontal
            data={branches}
            keyExtractor={(item) => item.branchId.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.branchButton,
                  selectedBranchId === item.branchId.toString() && styles.branchButtonActive
                ]}
                onPress={() => handleBranchSelect(item.branchId.toString())}
              >
                <Text 
                  style={[
                    styles.branchButtonText,
                    selectedBranchId === item.branchId.toString() && styles.branchButtonTextActive
                  ]}
                >
                  {item.address || item.city}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.branchScroll}
          />
        </View>
      )}
      
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => handleDateSelect(format(new Date(), 'yyyy-MM-dd'))}
        >
          <Text style={styles.dateButtonText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            handleDateSelect(format(tomorrow, 'yyyy-MM-dd'));
          }}
        >
          <Text style={styles.dateButtonText}>Tomorrow</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => {
            // Open date picker
            // This would be implemented with a date picker component
          }}
        >
          <Text style={styles.dateButtonText}>Select Date</Text>
          <Ionicons name="calendar-outline" size={16} color="#B22222" />
        </TouchableOpacity>
      </View>
      
      {/* Status Filter */}
      <View style={styles.statusFilter}>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            filterStatus === 'all' && styles.statusButtonActive
          ]}
          onPress={() => handleStatusFilter('all')}
        >
          <Text style={[
            styles.statusButtonText,
            filterStatus === 'all' && styles.statusButtonTextActive
          ]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            filterStatus === 'pending' && styles.statusButtonActive
          ]}
          onPress={() => handleStatusFilter('pending')}
        >
          <Text style={[
            styles.statusButtonText,
            filterStatus === 'pending' && styles.statusButtonTextActive
          ]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            filterStatus === 'confirmed' && styles.statusButtonActive
          ]}
          onPress={() => handleStatusFilter('confirmed')}
        >
          <Text style={[
            styles.statusButtonText,
            filterStatus === 'confirmed' && styles.statusButtonTextActive
          ]}>Confirmed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            filterStatus === 'completed' && styles.statusButtonActive
          ]}
          onPress={() => handleStatusFilter('completed')}
        >
          <Text style={[
            styles.statusButtonText,
            filterStatus === 'completed' && styles.statusButtonTextActive
          ]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.statusButton,
            filterStatus === 'cancelled' && styles.statusButtonActive
          ]}
          onPress={() => handleStatusFilter('cancelled')}
        >
          <Text style={[
            styles.statusButtonText,
            filterStatus === 'cancelled' && styles.statusButtonTextActive
          ]}>Cancelled</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BookingCard booking={item} />
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.bookingsList}
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
  branchSelector: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  branchScroll: {
    flexGrow: 0,
    marginBottom: 10,
  },
  branchButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  branchButtonActive: {
    backgroundColor: '#B22222',
  },
  branchButtonText: {
    fontSize: 14,
    color: '#333',
  },
  branchButtonTextActive: {
    color: '#fff',
  },
  dateSelector: {
    flexDirection: 'row',
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
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#B22222',
    marginRight: 5,
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
    flex: 1,
    padding: 15,
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
