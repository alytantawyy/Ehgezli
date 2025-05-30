import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';

interface BookingCardProps {
  booking: any; // Replace with proper booking type
}

/**
 * BookingCard Component
 * 
 * Displays booking information in a card format
 * Used in the restaurant dashboard to show bookings
 */
export const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  // Get status color based on booking status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#007AFF';
      case 'arrived':
        return '#34C759';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      case 'pending':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  // Format time from booking
  const formatTime = (timeString: string | undefined | null) => {
    try {
      // If timeString is undefined or null, return a default value
      if (!timeString) {
        return 'N/A';
      }
      
      // If timeString is a full ISO date
      if (timeString.includes('T')) {
        return format(new Date(timeString), 'h:mm a');
      }
      
      // If it's just a time string like "14:30:00"
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };

  // Navigate to booking details
  const handlePress = () => {
    router.push(`/restaurant/booking/${booking.id}` as any);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <Text style={styles.name}>
            {booking.guestName || `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || 'Guest'}
          </Text>
          <Text style={styles.partySize}>{booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            {formatTime(booking.timeSlot?.startTime || booking.time)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            {booking.guestPhone || booking.user?.phone || 'No phone'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.arrivedButton]}>
          <Text style={styles.actionButtonText}>Mark Arrived</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
          <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#B22222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  partySize: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  details: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  arrivedButton: {
    backgroundColor: '#B22222',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
});
