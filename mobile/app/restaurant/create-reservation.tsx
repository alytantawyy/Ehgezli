import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useBranchStore } from '../../store/branch-store';
import { useBookingStore } from '../../store/booking-store';
import { useAuth } from '../../hooks/useAuth';
import { BranchListItem } from '../../types/branch';
import { getBranchAvailability } from '../../api/branch';

// Try to import DateTimePicker with error handling
let DateTimePicker: any;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker package not found. Using fallback UI.');
}

/**
 * Create Reservation Screen
 * 
 * Allows restaurant staff to create a new reservation for a customer
 */
export default function CreateReservationScreen() {
  // State for form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [partySize, setPartySize] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | null>(null);
  
  // Get store hooks
  const { getRestaurantBranches } = useBranchStore();
  const { createGuestReservation } = useBookingStore();
  const { user } = useAuth();
  
  // Load branches on component mount
  useEffect(() => {
    loadBranches();
  }, []);
  
  // Load restaurant branches
  const loadBranches = async () => {
    try {
      const branchesData = await getRestaurantBranches(user?.id);
      setBranches(branchesData);
      
      // Set default selected branch to the first one or branch 109
      if (branchesData.length > 0) {
        // Try to find branch 109 first
        const branch109 = branchesData.find(b => b.branchId.toString() === '109');
        if (branch109) {
          setSelectedBranchId('109');
        } else {
          setSelectedBranchId(branchesData[0].branchId.toString());
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };
  
  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      fetchTimeSlots(selectedDate);
    }
  };
  
  // Handle time change
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };
  
  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
  };
  
  // Fetch time slots for the selected date and branch
  const fetchTimeSlots = async (date: Date) => {
    try {
      if (!selectedBranchId) {
        console.error('No branch selected');
        return;
      }
      
      // Format date to YYYY-MM-DD as required by the API
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Convert selectedBranchId from string to number
      const branchId = parseInt(selectedBranchId);
      
      const timeSlotsData = await getBranchAvailability(branchId, formattedDate);
      setAvailableTimeSlots(timeSlotsData.availableSlots || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !partySize || !selectedBranchId || !selectedTimeSlotId) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create booking object with the format expected by our store function
      const bookingData = {
        customerName,
        phoneNumber: customerPhone,
        partySize: parseInt(partySize),
        timeSlotId: selectedTimeSlotId,
        notes
      };
      
      // Create guest reservation
      await createGuestReservation(bookingData);
      
      // Show success message
      alert('Reservation created successfully!');
      
      // Navigate back to dashboard
      router.back();
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f7f7f7" 
          translucent={false}
        />
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#B22222" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name*</Text>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Customer Name"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number*</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Party Size*</Text>
                <TextInput
                  style={styles.input}
                  value={partySize}
                  onChangeText={setPartySize}
                  placeholder="Number of Guests"
                  keyboardType="number-pad"
                />
              </View>
              
              <Text style={styles.sectionTitle}>Reservation Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date*</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{format(date, 'MMMM dd, yyyy')}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
                {showDatePicker && DateTimePicker && (
                  Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={onDateChange}
                    />
                  ) : (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Time*</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text>{format(time, 'h:mm a')}</Text>
                  <Ionicons name="time" size={20} color="#666" />
                </TouchableOpacity>
                {showTimePicker && DateTimePicker && (
                  Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={time}
                      mode="time"
                      display="spinner"
                      onChange={onTimeChange}
                    />
                  ) : (
                    <DateTimePicker
                      value={time}
                      mode="time"
                      display="default"
                      onChange={onTimeChange}
                    />
                  )
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Branch*</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll}>
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch.branchId}
                      style={[
                        styles.branchButton,
                        selectedBranchId === branch.branchId.toString() && styles.selectedBranch
                      ]}
                      onPress={() => handleBranchSelect(branch.branchId.toString())}
                    >
                      <Text 
                        style={[
                          styles.branchText,
                          selectedBranchId === branch.branchId.toString() && styles.selectedBranchText
                        ]}
                      >
                        {branch.restaurantName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Time Slots</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll}>
                  {availableTimeSlots.map((timeSlot) => (
                    <TouchableOpacity
                      key={timeSlot.id}
                      style={[
                        styles.branchButton,
                        selectedTimeSlotId === timeSlot.id && styles.selectedBranch
                      ]}
                      onPress={() => setSelectedTimeSlotId(timeSlot.id)}
                    >
                      <Text 
                        style={[
                          styles.branchText,
                          selectedTimeSlotId === timeSlot.id && styles.selectedBranchText
                        ]}
                      >
                        {timeSlot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Special requests or additional information"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Create Reservation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  branchScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  branchButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedBranch: {
    backgroundColor: '#B22222',
    borderColor: '#B22222',
  },
  branchText: {
    color: '#333',
  },
  selectedBranchText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#B22222',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
