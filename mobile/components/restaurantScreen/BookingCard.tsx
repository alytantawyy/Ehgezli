import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useBookingStore } from '@/store/booking-store';
import { BookingStatus } from '@/types/booking';

interface BookingCardProps {
  booking: any; // Replace with proper booking type
  onPress?: () => void; // Optional onPress handler
  onStatusChange?: () => void; // Optional callback for when status changes
}

/**
 * BookingCard Component
 * 
 * Displays booking information in a card format
 * Used in the restaurant dashboard to show bookings
 */
export const BookingCard: React.FC<BookingCardProps> = ({ booking, onPress, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { changeBookingStatus, cancelBooking } = useBookingStore();
  
  // Force re-render when booking status changes
  const [localStatus, setLocalStatus] = useState<BookingStatus>(booking.status);
  
  // Update local status when booking prop changes
  useEffect(() => {
    setLocalStatus(booking.status);
  }, [booking.status]);

  // Get status color based on booking status
  const getStatusColor = () => {
    switch (localStatus.toLowerCase()) {
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
      console.error('Error formatting time:', error, 'timeString:', timeString);
      return 'N/A';
    }
  };

  // Get the best available time from the booking object
  const getBestAvailableTime = () => {
    // Log available time fields for debugging
    console.log('Time fields:', {
      startTime: booking.startTime,
      timeSlotStartTime: booking.timeSlot?.startTime,
      time: booking.time
    });
    
    // Try different possible time fields
    if (booking.startTime) {
      return formatTime(booking.startTime);
    } else if (booking.timeSlot?.startTime) {
      return formatTime(booking.timeSlot.startTime);
    } else if (booking.time) {
      return formatTime(booking.time);
    }
    return 'N/A';
  };

  // Get the best available phone number
  const getBestAvailablePhone = () => {
    
    // Try different possible phone fields
    if (booking.guestPhone) {
      return booking.guestPhone;
    } else if (booking.user?.phone) {
      return booking.user.phone;
    }
    return 'No phone';
  };

  // Handle marking a booking as arrived
  const handleMarkArrived = async () => {
    if (localStatus === 'arrived') {
      Alert.alert('Already Arrived', 'This booking is already marked as arrived.');
      return;
    }
    
    console.log('Attempting to mark booking as arrived:', {
      bookingId: booking.id,
      currentStatus: localStatus
    });
    
    Alert.alert(
      'Mark as Arrived',
      'Are you sure you want to mark this booking as arrived?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log('Calling changeBookingStatus with:', {
                id: booking.id,
                newStatus: 'arrived'
              });
              
              // Update the booking status
              const result = await changeBookingStatus(booking.id, 'arrived' as BookingStatus);
              console.log('Status change result:', result);
              
              // Update the local state to trigger re-render
              if (result) {
                setLocalStatus('arrived');
              }
              
              setIsLoading(false);
              
              // Call the callback if provided
              if (onStatusChange) {
                console.log('Calling onStatusChange callback');
                onStatusChange();
              } else {
                console.warn('No onStatusChange callback provided');
              }
            } catch (error) {
              console.error('Error marking booking as arrived:', error);
              setIsLoading(false);
              Alert.alert('Error', 'Failed to update booking status.');
            }
          }
        }
      ]
    );
  };

  // Handle marking a booking as completed
  const handleMarkCompleted = async () => {
    if (localStatus === 'completed') {
      Alert.alert('Already Completed', 'This booking is already marked as completed.');
      return;
    }
    
    console.log('Attempting to mark booking as completed:', {
      bookingId: booking.id,
      currentStatus: localStatus
    });
    
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this booking as completed?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log('Calling changeBookingStatus with:', {
                id: booking.id,
                newStatus: 'completed'
              });
              
              // Update the booking status
              const result = await changeBookingStatus(booking.id, 'completed' as BookingStatus);
              console.log('Status change result:', result);
              
              // Update the local state to trigger re-render
              if (result) {
                setLocalStatus('completed');
              }
              
              setIsLoading(false);
              
              // Call the callback if provided
              if (onStatusChange) {
                console.log('Calling onStatusChange callback');
                onStatusChange();
              } else {
                console.warn('No onStatusChange callback provided');
              }
            } catch (error) {
              console.error('Error marking booking as completed:', error);
              setIsLoading(false);
              Alert.alert('Error', 'Failed to update booking status.');
            }
          }
        }
      ]
    );
  };

  // Handle cancelling a booking
  const handleCancel = () => {
    if (localStatus === 'cancelled') {
      Alert.alert('Already Cancelled', 'This booking is already cancelled.');
      return;
    }
    
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log('Calling changeBookingStatus with:', {
                id: booking.id,
                newStatus: 'cancelled'
              });
              
              // Update the booking status
              const result = await changeBookingStatus(booking.id, 'cancelled' as BookingStatus);
              console.log('Status change result:', result);
              
              // Update the local state to trigger re-render
              if (result) {
                setLocalStatus('cancelled');
              }
              
              setIsLoading(false);
              
              // Call the callback if provided
              if (onStatusChange) {
                console.log('Calling onStatusChange callback');
                onStatusChange();
              } else {
                console.warn('No onStatusChange callback provided');
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              setIsLoading(false);
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          }
        }
      ]
    );
  };

  // Button disabled states
  const isArriveButtonDisabled = localStatus === 'arrived' || 
                               localStatus === 'cancelled' || 
                               localStatus === 'completed';
  
  const isCompletedButtonDisabled = localStatus === 'cancelled' || 
                                 localStatus === 'completed' ||
                                 localStatus === 'pending';
  
  const isCancelButtonDisabled = localStatus === 'cancelled' || 
                               localStatus === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <Text style={styles.name}>
            {booking.guestName || `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || 'Guest'}
          </Text>
          <Text style={styles.partySize}>{booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>
            {localStatus.charAt(0).toUpperCase() + localStatus.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            {getBestAvailableTime()}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color="#666" style={styles.icon} />
          <Text style={styles.detailText}>
            {getBestAvailablePhone()}
          </Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#B22222" />
          <Text style={styles.loadingText}>Updating...</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.arrivedButton,
              (isArriveButtonDisabled) && styles.disabledButton
            ]}
            onPress={handleMarkArrived}
            disabled={isArriveButtonDisabled}
          >
            <Text style={styles.actionButtonText}>Mark Arrived</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.completedButton,
              isCompletedButtonDisabled && styles.disabledButton
            ]}
            onPress={handleMarkCompleted}
            disabled={isCompletedButtonDisabled}
          >
            <Text style={styles.actionButtonText}>Mark Completed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.cancelButton,
              isCancelButtonDisabled && styles.disabledButton
            ]}
            onPress={handleCancel}
            disabled={isCancelButtonDisabled}
          >
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  completedButton: {
    backgroundColor: '#B22222', // Purple for completed
    marginHorizontal: 4,
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
  disabledButton: {
    opacity: 0.5
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});
