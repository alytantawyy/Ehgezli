import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import TimePickerModal from '@/components/common/TimePickerModal';
import ModalPicker from '@/components/common/ModalPicker';
import { CITY_OPTIONS } from '@/constants/FilterOptions';
import { geocodeAddress } from '../utils/geocoding';

/**
 * Add Branch Screen
 * 
 * Allows restaurant owners to add a new branch with all required details
 * including address, city, and booking settings
 */
export default function AddBranchScreen() {
  // Form state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Booking settings state
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [interval, setInterval] = useState('90');
  const [maxSeats, setMaxSeats] = useState('40');
  const [maxTables, setMaxTables] = useState('12');
  
  // Time picker state
  const [openTimeDate, setOpenTimeDate] = useState(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [closeTimeDate, setCloseTimeDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 0, 0, 0);
    return date;
  });
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  
  // City picker state
  const [showCityPicker, setShowCityPicker] = useState(false);
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Handle time selection
  const handleOpenTimeSelect = (time: Date) => {
    setOpenTimeDate(time);
    setOpenTime(format(time, 'HH:mm'));
    setShowOpenTimePicker(false);
  };

  const handleCloseTimeSelect = (time: Date) => {
    setCloseTimeDate(time);
    setCloseTime(format(time, 'HH:mm'));
    setShowCloseTimePicker(false);
  };

  // Geocode address when address or city changes
  const handleGeocodeAddress = async () => {
    // Only geocode if both address and city are provided
    if (!address.trim() || !city.trim()) {
      setCoordinates(null);
      return;
    }

    setIsGeocodingLoading(true);
    try {
      const result = await geocodeAddress(address, city);
      setCoordinates(result);
      
      if (!result) {
        // Show a warning if geocoding failed but don't block form submission
        Alert.alert(
          'Location Warning',
          'Could not find exact coordinates for this address. You can still proceed, but the branch location may not be accurate on maps.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCoordinates(null);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    
    // Validate booking settings
    if (!openTime) newErrors.openTime = 'Opening time is required';
    if (!closeTime) newErrors.closeTime = 'Closing time is required';
    if (!interval) newErrors.interval = 'Interval is required';
    if (!maxSeats) newErrors.maxSeats = 'Max seats is required';
    if (!maxTables) newErrors.maxTables = 'Max tables is required';
    
    // Validate numeric values
    if (isNaN(Number(interval)) || Number(interval) <= 0) {
      newErrors.interval = 'Interval must be a positive number';
    }
    if (isNaN(Number(maxSeats)) || Number(maxSeats) <= 0) {
      newErrors.maxSeats = 'Max seats must be a positive number';
    }
    if (isNaN(Number(maxTables)) || Number(maxTables) <= 0) {
      newErrors.maxTables = 'Max tables must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to review screen
  const handleNext = async () => {
    if (!validateForm()) return;
    
    // If we don't have coordinates yet, try to geocode one more time
    if (!coordinates && !isGeocodingLoading) {
      await handleGeocodeAddress();
    }
    
    router.push({
      pathname: '/restaurant/review-branch',
      params: {
        address,
        city,
        phone,
        openTime,
        closeTime,
        interval,
        maxSeats,
        maxTables,
        formattedOpenTime: format(openTimeDate, 'h:mm a'),
        formattedCloseTime: format(closeTimeDate, 'h:mm a'),
        latitude: coordinates?.latitude || 0,
        longitude: coordinates?.longitude || 0,
        hasValidCoordinates: coordinates ? 'true' : 'false'
      }
    });
  };

  // Format city options for the dropdown
  const cityOptions = CITY_OPTIONS.map(city => ({
    label: city,
    value: city
  }));

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
          backgroundColor="#f8f8f8" 
          translucent={false}
        />
        
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#B22222" />
          </TouchableOpacity>
        </View>
      
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Branch Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter branch address"
                  placeholderTextColor="#999"
                  onBlur={handleGeocodeAddress}
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dropdownInput, errors.city && styles.inputError]}
                  onPress={() => setShowCityPicker(true)}
                >
                  <Text style={city ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {city || "Select city"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              
              {/* Show coordinates status */}
              {(isGeocodingLoading || coordinates) && (
                <View style={styles.coordinatesContainer}>
                  {isGeocodingLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#B22222" />
                      <Text style={styles.coordinatesText}>Finding location...</Text>
                    </View>
                  ) : coordinates ? (
                    <View style={styles.coordinatesSuccess}>
                      <Ionicons name="location" size={16} color="#28a745" />
                      <Text style={styles.coordinatesSuccessText}>Location found</Text>
                    </View>
                  ) : null}
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              
              <Text style={[styles.sectionTitle, styles.bookingSettingsTitle]}>Booking Settings</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Opening Time *</Text>
                  <TouchableOpacity
                    style={[styles.timeInput, errors.openTime && styles.inputError]}
                    onPress={() => setShowOpenTimePicker(true)}
                  >
                    <Text style={styles.timeText}>
                      {format(openTimeDate, 'h:mm a')}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {errors.openTime && <Text style={styles.errorText}>{errors.openTime}</Text>}
                </View>
                
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Closing Time *</Text>
                  <TouchableOpacity
                    style={[styles.timeInput, errors.closeTime && styles.inputError]}
                    onPress={() => setShowCloseTimePicker(true)}
                  >
                    <Text style={styles.timeText}>
                      {format(closeTimeDate, 'h:mm a')}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {errors.closeTime && <Text style={styles.errorText}>{errors.closeTime}</Text>}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Booking Interval (minutes) *</Text>
                <TextInput
                  style={[styles.input, errors.interval && styles.inputError]}
                  value={interval}
                  onChangeText={setInterval}
                  placeholder="Enter interval in minutes"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                {errors.interval && <Text style={styles.errorText}>{errors.interval}</Text>}
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Max Seats *</Text>
                  <TextInput
                    style={[styles.input, errors.maxSeats && styles.inputError]}
                    value={maxSeats}
                    onChangeText={setMaxSeats}
                    placeholder="Enter max seats"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  {errors.maxSeats && <Text style={styles.errorText}>{errors.maxSeats}</Text>}
                </View>
                
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Max Tables *</Text>
                  <TextInput
                    style={[styles.input, errors.maxTables && styles.inputError]}
                    value={maxTables}
                    onChangeText={setMaxTables}
                    placeholder="Enter max tables"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  {errors.maxTables && <Text style={styles.errorText}>{errors.maxTables}</Text>}
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.nextButton}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
        
        {/* Time Picker Modals */}
        <TimePickerModal
          visible={showOpenTimePicker}
          onClose={() => setShowOpenTimePicker(false)}
          onSelect={handleOpenTimeSelect}
          selectedTime={openTimeDate}
          selectedDate={new Date()}
          startHour={0}
          endHour={24}
          interval={30}
        />
        
        <TimePickerModal
          visible={showCloseTimePicker}
          onClose={() => setShowCloseTimePicker(false)}
          onSelect={handleCloseTimeSelect}
          selectedTime={closeTimeDate}
          selectedDate={new Date()}
          startHour={0}
          endHour={24}
          interval={30}
        />
        
        {/* City Picker Modal */}
        <ModalPicker
          visible={showCityPicker}
          onClose={() => setShowCityPicker(false)}
          title="Select City"
          options={cityOptions}
          onSelect={(value) => {
            setCity(value);
            // Trigger geocoding when city changes
            if (address.trim()) {
              setTimeout(handleGeocodeAddress, 300);
            }
          }}
          selectedValue={city}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    paddingTop: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bookingSettingsTitle: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  timeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#B22222',
  },
  errorText: {
    color: '#B22222',
    fontSize: 12,
    marginTop: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#B22222',
    borderRadius: 8,
    width: '100%',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginRight: 5,
  },
  coordinatesContainer: {
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  coordinatesSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesSuccessText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#28a745',
  },
});
