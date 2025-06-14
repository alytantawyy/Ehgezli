import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, TextInput, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import ModalPicker from '@/components/common/ModalPicker';

// Components
import { BookingCard } from '@/components/restaurantScreen/BookingCard';
import { StatCard } from '@/components/restaurantScreen/StatCard';


// Stores and hooks
import { useBranchStore } from '@/store/branch-store';
import { useBookingStore } from '../../../store/booking-store';
import { useAuth } from '../../../hooks/useAuth';
import { useRestaurant } from '../../../hooks/useRestaurant';
import { BranchListItem } from '../../../types/branch';
import { BookingWithDetails } from '../../../types/booking';
import { RestaurantRoute } from '../../../types/navigation';

/**
 * Restaurant Dashboard Screen
 * 
 * Main dashboard for restaurant owners showing today's bookings,
 * quick stats, and recent activity
 */
export default function RestaurantDashboardScreen() {
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayBookings, setTodayBookings] = useState<BookingWithDetails[]>([]);
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get auth context
  const { user } = useAuth();
  const { restaurant } = useRestaurant();
  
  // Get store hooks
  const { getBookingsForBranchOnDate } = useBookingStore();
  const { getRestaurantBranches, selectedBranchId, setSelectedBranchId } = useBranchStore();
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  // Refresh data when selected branch changes
  useEffect(() => {
    if (selectedBranchId) {
      setBranchLoading(true);
      loadBookings().finally(() => {
        setBranchLoading(false);
      });
    }
  }, [selectedBranchId, refreshTrigger]);
  
  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load restaurant branches
      await loadBranches();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load restaurant branches
  const loadBranches = async () => {
    try {
      const branchesData = await getRestaurantBranches(user?.id);
      setBranches(branchesData);
      
      // Set default selected branch if not already set
      if (!selectedBranchId && branchesData.length > 0) {
        setSelectedBranchId(branchesData[0].branchId.toString());
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };
  
  // Load bookings for a specific branch
  const loadBookings = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Load bookings for the selected branch
      if (!selectedBranchId) {
        console.log('No branch selected, cannot load bookings');
        return;
      }
      
      const bookingsData = await getBookingsForBranchOnDate(parseInt(selectedBranchId), today);
      
      // Debug: Log the first booking to see its structure
      if (bookingsData.length > 0) {
        console.log('First booking:', JSON.stringify(bookingsData[0], null, 2));
      }
      
      setTodayBookings(bookingsData);
      
      // Calculate stats from today's bookings only
      setStats({
        total: bookingsData.length,
        upcoming: bookingsData.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
        completed: bookingsData.filter(b => b.status === 'completed').length,
        cancelled: bookingsData.filter(b => b.status === 'cancelled').length
      });
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // First, reload branches
      await loadBranches();
      
      // Then explicitly load bookings for the current branch
      if (selectedBranchId) {
        await loadBookings();
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    // Clear previous data first to prevent showing stale data
    setTodayBookings([]);
    setStats({
      total: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0
    });
    
    // Set loading state
    setBranchLoading(true);
    
    // Then update the selected branch
    setSelectedBranchId(branchId);
    
    // Load new data
    loadBookings().finally(() => {
      setBranchLoading(false);
    });
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Home',
          headerStyle: {
            backgroundColor: '#B22222',
          },
          headerTintColor: '#fff',
          headerShown: false, // Hide default header
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>ehgezli</Text>
          <Text style={styles.appSubtitle}>Manage your restaurant</Text>
        </View>
        
        <TouchableOpacity onPress={() => router.push(RestaurantRoute.profile)}>
          <View style={styles.profileAvatar}>
            <Image 
              source={{ uri: restaurant?.logo }} 
              style={styles.profileImage} 
            />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Branch Selector Button */}
      <TouchableOpacity 
        style={styles.branchSelectorButton}
        onPress={() => setBranchPickerVisible(true)}
      >
        <View style={styles.branchSelectorContent}>
          <Text style={styles.branchSelectorLabel}>Selected Branch:</Text>
          <Text style={styles.selectedBranchText}>
            {selectedBranchId ? 
              branches.find(b => b.branchId.toString() === selectedBranchId)?.address || 'Select Branch' : 
              'Select Branch'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Branch Selector */}
        <ModalPicker 
          visible={branchPickerVisible}
          onClose={() => setBranchPickerVisible(false)}
          title="Select a Branch"
          options={branches.map(branch => ({ 
            label: branch.address || branch.city || 'Branch', 
            value: branch.branchId.toString() 
          }))}
          onSelect={(branchId) => {
            handleBranchSelect(branchId);
            setBranchPickerVisible(false);
          }}
          selectedValue={selectedBranchId?.toString()}
        />
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
              <StatCard 
                title="Total Bookings" 
                value={stats.total} 
                icon="calendar"
                color="#B22222"
              />
              <StatCard 
                title="Upcoming" 
                value={stats.upcoming} 
                icon="time"
                color="#007AFF"
              />
              <StatCard 
                title="Completed" 
                value={stats.completed} 
                icon="checkmark-circle"
                color="#34C759"
              />
              <StatCard 
                title="Cancelled" 
                value={stats.cancelled} 
                icon="close-circle"
                color="#FF3B30"
              />
        </View>
        
        {/* Today's Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Bookings</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push(RestaurantRoute.bookings)}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#B22222" />
            </TouchableOpacity>
          </View>
          
          {/* Create New Reservation Button */}
          <TouchableOpacity 
            style={styles.createReservationButton}
            onPress={() => router.push(RestaurantRoute.createReservation)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.createReservationText}>Create New Reservation</Text>
          </TouchableOpacity>
          
          {todayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#999" />
              <Text style={styles.emptyStateText}>No bookings for today</Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {todayBookings.map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onStatusChange={() => {
                    console.log('⚡️ Status change detected, refreshing bookings...');
                    // Force a refresh by incrementing the refresh trigger
                    setRefreshTrigger(prev => prev + 1);
                  }}
                />
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manage Branches</Text>
          </View>
          
          {branches.length > 0 ? (
            <View style={styles.branchList}>
              {branches.map((branch) => (
                <TouchableOpacity 
                  key={branch.branchId} 
                  style={styles.branchCard}
                  onPress={() => router.push(`/restaurant/branch-details?id=${branch.branchId}`)}
                >
                  <View style={styles.branchInfo}>
                    <Text style={styles.branchAddress}>{branch.address}</Text>
                    <Text style={styles.branchCity}>{branch.city}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#888" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No branches found</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/restaurant/add-branch')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New Branch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B22222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileInitial: {
    fontSize: 18,
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
    padding: 10,
  },
  branchDropdown: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#B22222',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  branchDropdownText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#B22222',
    marginRight: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  bookingsList: {
    marginTop: 10,
  },
  activityList: {
    marginTop: 10,
  },
  createReservationButton: {
    backgroundColor: '#B22222',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  createReservationText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 5,
  },
  branchList: {
    marginTop: 10,
  },
  branchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  branchInfo: {
    flex: 1,
  },
  branchAddress: {
    fontSize: 16,
    color: '#333',
  },
  branchCity: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#B22222',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 5,
  },
  loader: {
    marginVertical: 20,
  },
  branchSelectorButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  branchSelectorContent: {
    flex: 1,
  },
  branchSelectorLabel: {
    fontSize: 14,
    color: '#666',
  },
  selectedBranchText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
});
