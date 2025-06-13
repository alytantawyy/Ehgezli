import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useBranchStore } from '../../store/branch-store';
import { useBookingStore } from '../../store/booking-store';
import { useAuth } from '../../hooks/useAuth';
import { BranchListItem } from '../../types/branch';
import DatePickerModal from '../../components/common/DatePickerModal';
import TimePickerModal from '../../components/common/TimePickerModal';
import PartySizePickerModal from '../../components/common/PartySizePickerModal';

/**
 * Create Reservation Screen
 * 
 * Allows restaurant staff to create a new reservation for a customer
 */
export default function CreateReservationScreen() {
  const router = useRouter();
  
  // State variables
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPartySizePicker, setShowPartySizePicker] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | null>(null);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  
  // Get store hooks
  const { getRestaurantBranches, getBranchAvailability } = useBranchStore();
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
          setSelectedRestaurantId(branch109.restaurantId);
        } else {
          setSelectedBranchId(branchesData[0].branchId.toString());
          setSelectedRestaurantId(branchesData[0].restaurantId);
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };
  
  // Handle date selection
  const handleDateSelect = async (selectedDate: Date) => {
    setDate(selectedDate);
    
    // Reset time slot selection when date changes
    setSelectedTimeSlotId(null);
    
    // Fetch available time slots for the selected date and branch
    if (selectedBranchId) {
      await fetchTimeSlots(selectedDate);
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

  // Fetch time slots for the selected date and branch
  const fetchTimeSlots = async (selectedDate: Date) => {
    try {
      if (!selectedBranchId) {
        console.error('No branch selected');
        return;
      }
      
      // Format date to YYYY-MM-DD as required by the API
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Convert selectedBranchId from string to number
      const branchId = parseInt(selectedBranchId);
      
      setTimeSlotsLoading(true);
      const timeSlotsData = await getBranchAvailability(branchId, formattedDate);
      
      if (timeSlotsData && timeSlotsData.availableSlots) {
        // Get current date and time
        const now = new Date();
        
        // Filter out past time slots if the selected date is today
        let availableSlots = timeSlotsData.availableSlots;
        
        if (
          selectedDate.getFullYear() === now.getFullYear() &&
          selectedDate.getMonth() === now.getMonth() &&
          selectedDate.getDate() === now.getDate()
        ) {
          // Filter out past time slots for today
          availableSlots = availableSlots.filter(slot => {
            const [hours, minutes] = slot.time.split(':').map(Number);
            const slotTime = new Date(selectedDate);
            slotTime.setHours(hours, minutes, 0, 0);
            
            // Log for debugging
            console.log(`Time slot ${slot.time}: ${slotTime.toISOString()} vs Now: ${now.toISOString()} - ${slotTime > now ? 'AVAILABLE' : 'PAST'}`);
            
            return slotTime > now;
          });
          
          console.log(`Filtered ${timeSlotsData.availableSlots.length - availableSlots.length} past time slots for today`);
        }
        
        setAvailableTimeSlots(availableSlots);
        console.log(`Fetched ${availableSlots.length} available time slots for ${formattedDate}`);
      } else {
        setAvailableTimeSlots([]);
        console.log(`No time slots available for ${formattedDate}`);
      }
      setTimeSlotsLoading(false);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableTimeSlots([]); // Add error handling to set empty time slots
      setTimeSlotsLoading(false);
    }
  };
  
  // Handle time change
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (slotId: number, slotTime: string) => {
    setSelectedTimeSlotId(slotId);
    
    // Update the time state with the selected time slot
    const [hours, minutes] = slotTime.split(':').map(Number);
    const newTime = new Date(date);
    newTime.setHours(hours, minutes, 0, 0);
    setTime(newTime);
    
    // Close the time picker if it was open
    setShowTimePicker(false);
  };
  
  // Handle party size selection
  const handlePartySizeSelect = (size: number) => {
    setPartySize(size.toString());
  };
  
  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    
    // Find the selected branch and store its restaurant ID
    const selectedBranch = branches.find(branch => branch.branchId.toString() === branchId);
    if (selectedBranch) {
      setSelectedRestaurantId(selectedBranch.restaurantId);
    }
    
    // Fetch time slots for the selected branch and date
    fetchTimeSlots(date);
  };
  
  // Helper function to format time with AM/PM
  const formatTimeWithAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !partySize || !selectedBranchId || !selectedTimeSlotId || !selectedRestaurantId) {
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
        branchId: parseInt(selectedBranchId),
        restaurantId: selectedRestaurantId,
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
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowPartySizePicker(true)}
                >
                  <Text>{partySize === '1' ? '1 person' : `${partySize} people`}</Text>
                  <Ionicons name="people" size={20} color="#666" />
                </TouchableOpacity>
                <PartySizePickerModal
                  visible={showPartySizePicker}
                  onClose={() => setShowPartySizePicker(false)}
                  onSelect={handlePartySizeSelect}
                  selectedSize={parseInt(partySize)}
                  minSize={1}
                  maxSize={20}
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
                {showDatePicker && (
                  <DatePickerModal
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onSelect={handleDateSelect}
                    selectedDate={date}
                  />
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Time*</Text>
                
                {timeSlotsLoading ? (
                  <View style={styles.timeSlotsLoading}>
                    <ActivityIndicator size="small" color="#B22222" />
                    <Text style={styles.timeSlotsLoadingText}>Loading available times...</Text>
                  </View>
                ) : availableTimeSlots.length === 0 ? (
                  <View style={styles.noTimeSlotsContainer}>
                    <Text style={styles.noTimeSlotsText}>No time slots available for this date</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotContainer}>
                    {availableTimeSlots.map((slot) => {
                      // Format time to AM/PM
                      const formattedTime = formatTimeWithAMPM(slot.time);
                      return (
                        <TouchableOpacity 
                          key={slot.id} 
                          style={[
                            styles.timeSlot, 
                            selectedTimeSlotId === slot.id && styles.selectedTimeSlot,
                            slot.isFull && styles.fullTimeSlot
                          ]}
                          onPress={() => !slot.isFull && handleTimeSlotSelect(slot.id, slot.time)}
                          disabled={slot.isFull}
                        >
                          <Text 
                            style={[
                              styles.timeSlotText, 
                              selectedTimeSlotId === slot.id && styles.selectedTimeSlotText,
                              slot.isFull && styles.fullTimeSlotText
                            ]}
                          >
                            {formattedTime}
                          </Text>
                          {slot.isFull && (
                            <Text style={styles.fullText}>Full</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
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
                        {branch.address}
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
  // Time slot styles
  timeSlotContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  selectedTimeSlot: {
    backgroundColor: '#B22222',
    borderColor: '#B22222',
  },
  fullTimeSlot: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  fullTimeSlotText: {
    color: '#999',
  },
  fullText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  timeSlotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  timeSlotsLoadingText: {
    marginLeft: 10,
    color: '#666',
  },
  noTimeSlotsContainer: {
    padding: 10,
  },
  noTimeSlotsText: {
    color: '#666',
    marginBottom: 10,
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
