import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/auth-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getRestaurants } from '../../../api/restaurant';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

/**
 * Restaurant Dashboard Screen
 * 
 * Main dashboard for restaurant owners showing key metrics and recent reservations
 */
export default function DashboardScreen() {
  // Date range for stats
  const [dateRange, setDateRange] = useState('week'); // 'day', 'week', 'month'
  
  // Get restaurant user context
  const { user } = useAuth();

  // Fetch restaurant stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['restaurantStats', user?.id, dateRange],
    queryFn: () => getRestaurants(),
    enabled: !!user,
  });

  // Fetch recent reservations
  const { data: recentReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['recentReservations', user?.id],
    queryFn: () => getBookings(),
    enabled: !!user,
  });

  // Render a stat card
  const renderStatCard = (title: string, value: string, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Render a reservation item
  const renderReservationItem = (reservation: any, index: number) => (
    <TouchableOpacity 
      key={index}
      style={styles.reservationItem}
      onPress={() => router.push(`/restaurant/reservation-details?id=${reservation.id}` as any)}
    >
      <View style={styles.reservationHeader}>
        <Text style={styles.customerName}>{reservation.customerName}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(reservation.status) }
        ]}>
          <Text style={styles.statusText}>{reservation.status}</Text>
        </View>
      </View>
      
      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {format(new Date(reservation.date), 'EEE, MMM d, yyyy')}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>
            {format(new Date(reservation.time), 'h:mm a')}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#666" />
          <Text style={styles.detailText}>
            {reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Get color for reservation status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/restaurant/settings' as any)}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Date Range Selector */}
        <View style={styles.dateRangeSelector}>
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === 'day' && styles.activeDateRange
            ]}
            onPress={() => setDateRange('day')}
          >
            <Text style={[
              styles.dateRangeText,
              dateRange === 'day' && styles.activeDateRangeText
            ]}>Day</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === 'week' && styles.activeDateRange
            ]}
            onPress={() => setDateRange('week')}
          >
            <Text style={[
              styles.dateRangeText,
              dateRange === 'week' && styles.activeDateRangeText
            ]}>Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === 'month' && styles.activeDateRange
            ]}
            onPress={() => setDateRange('month')}
          >
            <Text style={[
              styles.dateRangeText,
              dateRange === 'month' && styles.activeDateRangeText
            ]}>Month</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Section */}
        {isLoadingStats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF385C" />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {renderStatCard('Reservations', stats?.reservations || 0, 'calendar', '#FF385C')}
            {renderStatCard('Revenue', `$${stats?.revenue || 0}`, 'cash', '#4CAF50')}
            {renderStatCard('Customers', stats?.customers || 0, 'people', '#2196F3')}
            {renderStatCard('Occupancy', `${stats?.occupancy || 0}%`, 'stats-chart', '#FF9800')}
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/restaurant/add-branch' as any)}
            >
              <Ionicons name="add-circle" size={24} color="#FF385C" />
              <Text style={styles.actionText}>Add Branch</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/restaurant/manage-menu' as any)}
            >
              <Ionicons name="restaurant" size={24} color="#FF385C" />
              <Text style={styles.actionText}>Manage Menu</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/restaurant/analytics' as any)}
            >
              <Ionicons name="bar-chart" size={24} color="#FF385C" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Reservations */}
        <View style={styles.reservationsContainer}>
          <View style={styles.reservationsHeader}>
            <Text style={styles.sectionTitle}>Recent Reservations</Text>
            <TouchableOpacity onPress={() => router.push('/restaurant/(tabs)/reservations' as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingReservations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF385C" />
            </View>
          ) : recentReservations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent reservations</Text>
            </View>
          ) : (
            recentReservations.map((reservation: any, index: number) => 
              renderReservationItem(reservation, index)
            )
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeDateRange: {
    backgroundColor: '#FF385C',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
  },
  activeDateRangeText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  reservationsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  reservationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#FF385C',
    fontSize: 14,
    fontWeight: '600',
  },
  reservationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reservationDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
