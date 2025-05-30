import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';

// Components
import { BookingCard } from '../../../components/restaurantScreen/BookingCard';
import { StatCard } from '../../../components/restaurantScreen/StatCard';
import { ActivityItem } from '../../../components/restaurantScreen/ActivityItem';

// Stores and hooks
import { useBranchStore } from '../../../store/branch-store';
import { useBookingStore } from '../../../store/booking-store';
import { useAuth } from '../../../hooks/useAuth';
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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  
  // Get auth context
  const { user } = useAuth();
  
  // Get store hooks
  const { getRestaurantBranches, loading: branchesLoading } = useBranchStore();
  const { getBookingsForBranchOnDate, loading: bookingsLoading } = useBookingStore();
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  // Load all necessary data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get restaurant branches
      const branchesData: BranchListItem[] = await getRestaurantBranches(user?.id);
      setBranches(branchesData);
      
      // Always use branch 109 for the dashboard
      setSelectedBranchId('109');
      
      // Load bookings for branch 109
      console.log('Loading bookings for branch 109...');
      await loadBookings('109');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Load bookings for a specific branch
  const loadBookings = async (branchId: string) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Always use branch 109 for the dashboard
      const bookingsData = await getBookingsForBranchOnDate(109, today);
      setTodayBookings(bookingsData);
      
      // Calculate stats
      const stats = {
        total: bookingsData.length,
        upcoming: bookingsData.filter(b => ['pending', 'confirmed'].includes(b.status.toLowerCase())).length,
        completed: bookingsData.filter(b => b.status.toLowerCase() === 'completed').length,
        cancelled: bookingsData.filter(b => b.status.toLowerCase() === 'cancelled').length
      };
      
      setStats(stats);
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
    loadBookings(branchId);
  };
  
  // Render loading state
  if (loading || branchesLoading) {
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
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Branch Selector */}
        {branches.length > 0 && (
          <View style={styles.branchSelector}>
            <Text style={styles.sectionTitle}>Select Branch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll}>
              {branches.map((branch) => (
                <TouchableOpacity
                  key={branch.branchId}
                  style={[
                    styles.branchButton,
                    selectedBranchId?.toString() === branch.branchId.toString() && styles.branchButtonActive
                  ]}
                  onPress={() => handleBranchSelect(branch.branchId.toString())}
                >
                  <Text 
                    style={[
                      styles.branchButtonText,
                      selectedBranchId?.toString() === branch.branchId.toString() && styles.branchButtonTextActive
                    ]}
                  >
                    {branch.address || branch.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
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
          
          {bookingsLoading ? (
            <ActivityIndicator size="small" color="#B22222" style={{marginVertical: 20}} />
          ) : todayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#999" />
              <Text style={styles.emptyStateText}>No bookings for today</Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {todayBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </View>
          )}
        </View>
        
        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          
          <View style={styles.activityList}>
            {/* These would be populated from an activity log API */}
            <ActivityItem 
              type="new_booking"
              message="New booking from John Doe"
              time="10 minutes ago"
            />
            <ActivityItem 
              type="cancellation"
              message="Booking #1234 was cancelled"
              time="1 hour ago"
            />
            <ActivityItem 
              type="completed"
              message="Booking #1230 was marked as completed"
              time="3 hours ago"
            />
          </View>
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
  branchSelector: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  branchScroll: {
    marginTop: 10,
  },
  branchButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
});
