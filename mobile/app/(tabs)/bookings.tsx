import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Text, SectionList, ScrollView, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserBookings, cancelBooking, updateBooking } from '@/shared/api/client';
import { useAuth } from '@/context/auth-context';
import { Booking } from '@/shared/types';
import { format, parseISO, isBefore } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EhgezliButton } from '@/components/EhgezliButton';

export default function BookingsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  // State for edit booking modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPartySize, setEditPartySize] = useState('');
  const [editError, setEditError] = useState('');

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: getUserBookings,
    enabled: !!user, // Only fetch if user is logged in
  });

  // Add cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: number) => cancelBooking(bookingId),
    onSuccess: () => {
      // Refetch bookings after successful cancellation
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    }
  });

  // Add update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number, data: any }) => 
      updateBooking(bookingId, data),
    onSuccess: () => {
      // Refetch bookings after successful update
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Close modal
      setEditModalVisible(false);
      setEditingBooking(null);
      Alert.alert('Success', 'Booking updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking. Please try again.');
    }
  });

  // Handle booking cancellation
  const handleCancelBooking = (bookingId: number) => {
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
          onPress: () => {
            cancelBookingMutation.mutate(bookingId);
          }
        }
      ]
    );
  };

  // Handle opening edit modal
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    if (booking.date) {
      try {
        const bookingDate = parseISO(booking.date);
        setEditDate(format(bookingDate, 'yyyy-MM-dd'));
        setEditTime(format(bookingDate, 'HH:mm'));
      } catch (error) {
        console.error('Error parsing date for edit:', error);
      }
    }
    setEditPartySize(booking.partySize.toString());
    setEditModalVisible(true);
  };

  // Handle saving edited booking
  const handleSaveEditedBooking = () => {
    if (!editingBooking) return;
    
    // Validate inputs
    const partySize = parseInt(editPartySize, 10);
    if (isNaN(partySize) || partySize < 1) {
      Alert.alert('Error', 'Please enter a valid party size');
      return;
    }
    
    try {
      // Combine date and time into ISO string
      const dateTime = new Date(`${editDate}T${editTime}:00`);
      if (isNaN(dateTime.getTime())) {
        Alert.alert('Error', 'Please enter a valid date and time');
        return;
      }
      
      // Update booking
      updateBookingMutation.mutate({
        bookingId: editingBooking.id,
        data: {
          date: dateTime.toISOString(),
          partySize
        }
      });
    } catch (error) {
      console.error('Error saving edited booking:', error);
      Alert.alert('Error', 'Failed to update booking. Please check your inputs.');
    }
  };

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

  // Organize bookings into sections
  const now = new Date();
  
  const upcomingBookings = bookings.filter(booking => {
    if (!booking.date) return false;
    try {
      const bookingDate = parseISO(booking.date);
      return !isBefore(bookingDate, now) && booking.confirmed;
    } catch (error) {
      console.error('Error parsing date for upcoming bookings:', error);
      return false;
    }
  });

  const previousBookings = bookings.filter(booking => {
    if (!booking.date) return false;
    try {
      const bookingDate = parseISO(booking.date);
      return isBefore(bookingDate, now) && booking.confirmed;
    } catch (error) {
      console.error('Error parsing date for previous bookings:', error);
      return false;
    }
  });

  const cancelledBookings = bookings.filter(booking => 
    !booking.confirmed
  );

  // Create sections and ensure they're included even if empty
  const sections = [
    { title: 'Upcoming Bookings', data: upcomingBookings },
    { title: 'Previous Bookings', data: previousBookings },
    { title: 'Cancelled Bookings', data: cancelledBookings }
  ];

  console.log('Sections:', JSON.stringify({
    upcoming: upcomingBookings.length,
    previous: previousBookings.length,
    cancelled: cancelledBookings.length
  }));

  const renderBookingItem = ({ item, section }: { item: Booking, section: { title: string } }) => {
    let formattedDate = 'No date specified';
    let formattedTime = '-';
    if (item.date) {
      try {
        const bookingDate = parseISO(item.date);
        formattedDate = format(bookingDate, 'MMM d, yyyy');
        formattedTime = format(bookingDate, 'h:mm a');
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
    
    const status = getBookingStatus(item);
    const statusColor = getStatusColor(status);
    const isUpcoming = section.title === 'Upcoming Bookings';
    const isPending = !item.confirmed && !item.cancelled;

    // Format the location display with city and address if available
    const locationDisplay = item.branchCity ? 
      (item.branchAddress ? `${item.branchCity}, ${item.branchAddress}` : item.branchCity) : 
      'Location not specified';

    return (
      <View style={styles.bookingCard}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{item.restaurantName || 'Restaurant'}</Text>
            <Text style={styles.location}>
              <Ionicons name="location-outline" size={12} color="#666" /> {locationDisplay}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{capitalizeFirstLetter(status)}</Text>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailsLeft}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.text} style={styles.detailIcon} />
              <Text style={styles.detailText}>{formattedDate}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={colors.text} style={styles.detailIcon} />
              <Text style={styles.detailText}>{formattedTime}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={colors.text} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.partySize} {item.partySize === 1 ? 'person' : 'people'}</Text>
            </View>
          </View>
        </View>
        
        {isUpcoming && item.confirmed && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditBooking(item)}
            >
              <Ionicons name="create-outline" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCancelBooking(item.id)}
            >
              <Ionicons name="close-outline" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>My Bookings</Text>
            <Text style={styles.subtitle}>View and manage your reservations</Text>
          </View>
        </View>
      </View>
      
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        renderSectionHeader={renderSectionHeader}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
      />
      
      {/* Edit Booking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Booking</Text>
            
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#ccc"
            />
            
            <Text style={styles.inputLabel}>Time</Text>
            <TextInput
              style={styles.input}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="HH:MM"
              placeholderTextColor="#ccc"
            />
            
            <Text style={styles.inputLabel}>Party Size</Text>
            <TextInput
              style={styles.input}
              value={editPartySize}
              onChangeText={setEditPartySize}
              keyboardType="number-pad"
              placeholder="Number of people"
              placeholderTextColor="#ccc"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={handleSaveEditedBooking}
              >
                <Text style={styles.saveModalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return '#4CAF50'; // Green
    case 'pending':
      return '#FFC107'; // Yellow
    case 'cancelled':
      return '#F44336'; // Red
    case 'completed':
      return '#2196F3'; // Blue
    case 'arrived':
      return '#9C27B0'; // Purple
    default:
      return '#9E9E9E'; // Grey
  }
}

function getBookingStatus(booking: Booking): string {
  if (!booking.confirmed) return 'cancelled';
  if (booking.completed) return 'completed';
  if (booking.arrived) return 'arrived';
  return 'confirmed';
}

function capitalizeFirstLetter(string: string | undefined): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsLeft: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(355,79%,36%)',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'hsl(355,79%,36%)',
  },
  buttonIcon: {
    marginRight: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  authPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
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
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#F44336',
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 10,
    padding: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  saveModalButton: {
    backgroundColor: 'hsl(355,79%,36%)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  cancelModalButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
