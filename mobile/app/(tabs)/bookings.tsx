import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getUserBookings } from '@/shared/api/client';
import { useAuth } from '@/context/auth-context';
import { Booking } from '@/shared/types';
import { format, parseISO } from 'date-fns';
import { formatTimeWithAMPM } from '@/shared/utils/time-slots';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EhgezliButton } from '@/components/EhgezliButton';

export default function BookingsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: getUserBookings,
    enabled: !!user, // Only fetch if user is logged in
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="calendar-outline" size={64} color={colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text }]}>Your Bookings</Text>
          <Text style={[styles.message, { color: colors.text }]}>
            Please log in to view your bookings
          </Text>
          <EhgezliButton 
            title="Log In" 
            variant="ehgezli" 
            onPress={() => {/* Navigate to login */}}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading your bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.text }]}>Error loading bookings</Text>
        <EhgezliButton 
          title="Try Again" 
          onPress={() => refetch()} 
          variant="ehgezli"
          style={styles.button}
        />
      </View>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <View style={styles.container}>
        <Ionicons name="calendar-outline" size={64} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>No Bookings Yet</Text>
        <Text style={[styles.message, { color: colors.text }]}>
          You haven't made any restaurant bookings yet
        </Text>
        <EhgezliButton 
          title="Find Restaurants" 
          variant="ehgezli" 
          onPress={() => {/* Navigate to home */}}
          style={styles.button}
        />
      </View>
    );
  }

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const bookingDate = parseISO(item.date);
    const formattedDate = format(bookingDate, 'MMM d, yyyy');
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[styles.bookingCard, { borderColor: colors.border }]}>
        <View style={styles.bookingHeader}>
          <Text style={[styles.restaurantName, { color: colors.text }]}>
            {item.restaurantName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{capitalizeFirstLetter(item.status)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.text} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {item.branchCity || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.text }]}>{formattedDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={colors.text} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.text }]}>{formatTimeWithAMPM(item.time)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color={colors.text} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.text }]}>{item.partySize} {item.partySize === 1 ? 'person' : 'people'}</Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <EhgezliButton 
              title="Cancel" 
              variant="outline" 
              size="sm"
              onPress={() => {/* Cancel booking */}}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Bookings</Text>
      </View>
      
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return '#4CAF50'; // Green
    case 'pending':
      return '#FFC107'; // Yellow
    case 'cancelled':
      return '#F44336'; // Red
    case 'completed':
      return '#2196F3'; // Blue
    default:
      return '#9E9E9E'; // Grey
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pageContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 40, // Add space for status bar
  },
  authPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    minWidth: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  bookingCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    backgroundColor: '#fff',
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
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
});
