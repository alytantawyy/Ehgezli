import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { 
  formatDisplayDate, 
  formatDisplayTime, 
  formatApiDate, 
  parseIsoDate,
  DATE_FORMATS
} from '@/shared/utils/date-utils';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentRestaurant, getBranchBookings, getBranchStatistics, updateRestaurantProfile } from '../shared/api/client';
import { EhgezliButton } from '../components/EhgezliButton';
import { useAuth } from '../context/auth-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays } from 'date-fns';

export default function RestaurantDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  
  // Define branch type
  interface Branch {
    id: number;
    address: string;
    city: string;
  }
  
  // Dashboard state
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [branchBookingSummaries, setBranchBookingSummaries] = useState<{[branchId: number]: {
    totalBookings: number;
    totalSeats: number;
    availableSeats: number;
    currentlySeated: number;
  }}>({});
  
  interface Booking {
    id: number;
    customerName: string;
    partySize: number;
    time: string;
    date: string;
    status: string;
  }
  
  const [latestBookings, setLatestBookings] = useState<Booking[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [allLatestBookings, setAllLatestBookings] = useState<Booking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [logo, setLogo] = useState('');
  
  // Function to pick an image from the gallery
  const pickImage = async () => {
    try {
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos to update your logo.');
        return;
      }
      
      // Launch the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Set the selected image URI to the logo state
        setLogo(result.assets[0].uri);
        
        // Here you would typically upload the image to your server
        // and update the restaurant profile with the new logo URL
        console.log('New logo selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  // Function to save profile changes
  const handleSaveProfile = async () => {
    try {
      console.log('[DEBUG] handleSaveProfile - Starting profile update');
      setIsLoading(true);
      
      // Create the updated profile data
      const updatedProfile = {
        name,
        email,
        about,
        cuisine,
        priceRange,
        logo
      };
      
      console.log('[DEBUG] handleSaveProfile - Saving restaurant profile with:', JSON.stringify(updatedProfile, null, 2));
      
      // Call the API to update the restaurant profile
      const updatedRestaurant = await updateRestaurantProfile(updatedProfile);
      console.log('[DEBUG] handleSaveProfile - Update successful, received:', JSON.stringify(updatedRestaurant, null, 2));
      
      // Update the local state with the response from the server
      setRestaurant(updatedRestaurant);
      setIsEditing(false);
      
      // Show success message
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('[DEBUG] handleSaveProfile - Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch branch-specific booking data when branch or date changes
  const fetchBranchBookingData = async (branchId = selectedBranch, date = selectedDate) => {
    if (!branchId) return;
    
    try {
      setIsLoading(true);
      
      const dateString = formatApiDate(date);
      const today = formatApiDate(new Date());
      const isToday = dateString === today;
      
      console.log(`[Debug] Dashboard - Fetching data for branch ${branchId} on date ${dateString}`);
      
      // Use the API functions to fetch real data
      console.log(`[Debug] Dashboard - Calling API functions`);
      let apiBookings, statistics, todayApiBookings, latestApiBookings;
      
      if (isToday) {
        [apiBookings, statistics, latestApiBookings] = await Promise.all([
          getBranchBookings(branchId, dateString),
          getBranchStatistics(branchId, dateString),
          getBranchBookings(branchId) // Get all latest bookings without date filter
        ]);
        todayApiBookings = apiBookings;
      } else {
        [apiBookings, statistics, todayApiBookings, latestApiBookings] = await Promise.all([
          getBranchBookings(branchId, dateString),
          getBranchStatistics(branchId, dateString),
          getBranchBookings(branchId, today),
          getBranchBookings(branchId) // Get all latest bookings without date filter
        ]);
      }
      
      console.log(`[Debug] Dashboard - API calls completed successfully`);
      console.log(`[Debug] Dashboard - Received ${apiBookings?.length || 0} bookings for selected date`);
      console.log(`[Debug] Dashboard - Received ${todayApiBookings?.length || 0} bookings for today`);
      console.log(`[Debug] Dashboard - Received ${latestApiBookings?.length || 0} latest bookings`);
      console.log(`[Debug] Dashboard - Statistics:`, statistics);
      
      // Update the branch-specific booking summary with real data
      setBranchBookingSummaries(prev => ({
        ...prev,
        [branchId]: statistics
      }));
      
      // IMPORTANT FIX: Filter bookings by local date to ensure correct display
      // This ensures bookings are shown on the correct day in the user's local timezone
      const selectedDateStart = new Date(date);
      selectedDateStart.setHours(0, 0, 0, 0);
      const selectedDateEnd = new Date(date);
      selectedDateEnd.setHours(23, 59, 59, 999);
      
      // Filter apiBookings to only include those that fall within the selected date in local time
      const filteredApiBookings = apiBookings.filter(booking => {
        const bookingDate = parseIsoDate(booking.date);
        return bookingDate >= selectedDateStart && bookingDate <= selectedDateEnd;
      });
      
      console.log(`[Debug] Timezone Fix - Selected date range:`, {
        start: selectedDateStart.toISOString(),
        end: selectedDateEnd.toISOString()
      });
      console.log(`[Debug] Timezone Fix - Original apiBookings count: ${apiBookings.length}, Filtered count: ${filteredApiBookings.length}`);
      if (apiBookings.length > 0) {
        console.log(`[Debug] Timezone Fix - Sample booking dates:`, 
          apiBookings.slice(0, 3).map(b => ({
            id: b.id, 
            date: b.date, 
            localDate: new Date(b.date).toLocaleString()
          })));
      }
      
      // Transform bookings for the selected date
      console.log(`[Debug] Selected date (${dateString}) bookings - apiBookings length:`, apiBookings.length);
      console.log(`[Debug] Selected date (${dateString}) bookings - sample data:`, apiBookings.length > 0 ? 
        JSON.stringify(apiBookings.slice(0, 2).map(b => ({id: b.id, date: b.date, time: b.time}))) : 'No bookings');
      
      const transformedBookings: Booking[] = filteredApiBookings.map(booking => {
        // Extract time from the ISO date string
        try {
          const bookingDate = parseIsoDate(booking.date);
          
          // Format the date using the date part only from the selected date
          // This ensures the displayed date matches the selected date regardless of timezone
          const formattedDate = formatDisplayDate(bookingDate);
          
          // Keep the time formatting from the actual booking time
          const formattedTime = formatDisplayTime(bookingDate);
          
          console.log(`[Debug] Processing ${dateString} booking ID:${booking.id} with time:${formattedTime}, original date: ${booking.date}`);
          
          return {
            id: booking.id,
            customerName: booking.customerName || `Guest #${booking.userId}`, // Use server-provided name or fallback
            partySize: booking.partySize,
            time: formattedTime,
            date: formattedDate,
            status: booking.arrived ? (booking.completed ? 'Completed' : 'Seated') : 'Confirmed'
          };
        } catch (error) {
          console.error(`[Debug] Error processing ${dateString} booking:`, error, 'for booking:', JSON.stringify(booking));
          return null;
        }
      }).filter((booking): booking is Booking => booking !== null);
      
      console.log(`[Debug] Selected date (${dateString}) - transformedBookings after processing:`, 
        transformedBookings.length > 0 ? JSON.stringify(transformedBookings.slice(0, 2)) : 'No bookings');
      
      // Transform today's bookings
      console.log(`[Debug] Today's bookings (${today}) - isToday value:`, isToday);
      console.log(`[Debug] Today's bookings (${today}) - todayApiBookings length:`, todayApiBookings ? todayApiBookings.length : 'undefined');
      console.log(`[Debug] Today's bookings (${today}) - sample data:`, todayApiBookings && todayApiBookings.length > 0 ? 
        JSON.stringify(todayApiBookings.slice(0, 2).map(b => ({id: b.id, date: b.date, time: b.time}))) : 'No bookings');
      
      const transformedTodayBookings: Booking[] = isToday ? transformedBookings : (todayApiBookings ? todayApiBookings.map(booking => {
        // Extract time from the ISO date string
        try {
          const bookingDate = parseIsoDate(booking.date);
          const formattedDate = formatDisplayDate(bookingDate);
          const formattedTime = formatDisplayTime(bookingDate);
          
          console.log(`[Debug] Processing today's booking ID:${booking.id} with time:${formattedTime}`);
          
          return {
            id: booking.id,
            customerName: booking.customerName || `Guest #${booking.userId}`,
            partySize: booking.partySize,
            time: formattedTime,
            date: formattedDate,
            status: booking.arrived ? (booking.completed ? 'Completed' : 'Seated') : 'Confirmed'
          };
        } catch (error) {
          console.error(`[Debug] Error processing today's booking:`, error, 'for booking:', JSON.stringify(booking));
          return null;
        }
      }).filter((booking): booking is Booking => booking !== null) : []);
      
      console.log(`[Debug] Today's bookings (${today}) - transformedTodayBookings after processing:`, 
        transformedTodayBookings.length > 0 ? JSON.stringify(transformedTodayBookings.slice(0, 2)) : 'No bookings');
      
      // Transform latest bookings (not filtered by date)
      console.log(`[Debug] Latest bookings - latestApiBookings length:`, latestApiBookings ? latestApiBookings.length : 'undefined');
      console.log(`[Debug] Latest bookings - sample data:`, latestApiBookings && latestApiBookings.length > 0 ? 
        JSON.stringify(latestApiBookings.slice(0, 2).map(b => ({id: b.id, date: b.date, time: b.time}))) : 'No bookings');
      
      const transformedLatestBookings: Booking[] = latestApiBookings ? latestApiBookings.map(booking => {
        // Extract time from the ISO date string
        try {
          // IMPORTANT FIX: Convert the UTC date to local time for both date and time display
          const bookingDate = parseIsoDate(booking.date);
          
          // Format both date and time based on the local date
          const formattedDate = formatDisplayDate(bookingDate);
          const formattedTime = formatDisplayTime(bookingDate);
          
          console.log(`[Debug] Processing latest booking ID:${booking.id} with time:${formattedTime} from date:${booking.date}, formatted as ${formattedDate}`);
          
          return {
            id: booking.id,
            customerName: booking.customerName || `Guest #${booking.userId}`,
            partySize: booking.partySize,
            time: formattedTime,
            date: formattedDate,
            status: booking.arrived ? (booking.completed ? 'Completed' : 'Seated') : 'Confirmed'
          };
        } catch (error) {
          console.error(`[Debug] Error processing latest booking:`, error, 'for booking:', JSON.stringify(booking));
          return null;
        }
      }).filter((booking): booking is Booking => booking !== null) : [];
      
      // Sort latest bookings by creation date (newest first)
      const sortedLatestBookings = transformedLatestBookings.sort((a, b) => {
        return new Date(b.id).getTime() - new Date(a.id).getTime();
      }).slice(0, 5); // Get only the 5 most recent bookings
      
      console.log('[Debug] Latest bookings - sortedLatestBookings after processing:', 
        sortedLatestBookings.length > 0 ? 
        JSON.stringify(sortedLatestBookings.map(b => ({id: b.id, time: b.time, date: b.date}))) : 'No bookings');
      
      // Update bookings lists with transformed data
      console.log(`[Debug] CRITICAL - Selected date is: ${formatDisplayDate(selectedDate)}`);
      console.log(`[Debug] CRITICAL - Bookings for selected date:`, transformedBookings.length);
      
      // IMPORTANT FIX: Filter latest bookings by local date to match the selected date
      // This ensures consistency between the two booking sections
      const matchingLatestBookings = latestApiBookings ? latestApiBookings.filter(booking => {
        try {
          const bookingDate = parseIsoDate(booking.date);
          const bookingLocalDate = new Date(bookingDate);
          bookingLocalDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
          
          const selectedLocalDate = new Date(selectedDate);
          selectedLocalDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
          
          const matches = bookingLocalDate.getTime() === selectedLocalDate.getTime();
          
          console.log(`[Debug] CRITICAL - Comparing local dates: booking=${bookingLocalDate.toISOString()}, selected=${selectedLocalDate.toISOString()}, matches=${matches}`);
          return matches;
        } catch (error) {
          console.error(`[Debug] CRITICAL - Error comparing dates:`, error);
          return false;
        }
      }) : [];
      
      console.log(`[Debug] CRITICAL - Matching date bookings in latestApiBookings:`, matchingLatestBookings.length);
      
      // Process the matching bookings to ensure they appear in both sections
      const matchingBookingsProcessed = matchingLatestBookings.map(booking => {
        try {
          const bookingDate = parseIsoDate(booking.date);
          const formattedDate = formatDisplayDate(bookingDate);
          const formattedTime = formatDisplayTime(bookingDate);
          
          return {
            id: booking.id,
            customerName: booking.customerName || `Guest #${booking.userId}`,
            partySize: booking.partySize,
            time: formattedTime,
            date: formattedDate,
            status: booking.arrived ? (booking.completed ? 'Completed' : 'Seated') : 'Confirmed'
          };
        } catch (error) {
          console.error(`[Debug] Error processing matching booking:`, error);
          return null;
        }
      }).filter((booking): booking is Booking => booking !== null);
      
      // FIX: Use transformedBookings for the selected date instead of transformedTodayBookings
      // This ensures we're showing bookings for the selected date, not just "today"
      setLatestBookings(sortedLatestBookings); // Show the 5 most recent bookings regardless of date
      
      // IMPORTANT FIX: If no bookings are found through the date filter, use the matched bookings
      // This ensures bookings that appear in local time for the selected date will be displayed
      if (transformedBookings.length === 0 && matchingBookingsProcessed.length > 0) {
        console.log(`[Debug] CRITICAL - Using ${matchingBookingsProcessed.length} matched bookings from latestApiBookings for selected date`);
        setTodayBookings(matchingBookingsProcessed);
        
        // Update statistics to reflect the actual number of bookings we're displaying
        const updatedStatistics = {
          ...statistics,
          totalBookings: matchingBookingsProcessed.length
        };
        
        console.log(`[Debug] CRITICAL - Updating statistics to reflect ${matchingBookingsProcessed.length} actual bookings`);
        
        // Update the branch-specific booking summary with corrected data
        setBranchBookingSummaries(prev => ({
          ...prev,
          [branchId]: updatedStatistics
        }));
      } else {
        setTodayBookings(transformedBookings);
      }
      
      setAllLatestBookings(transformedLatestBookings); // Store all bookings for reference
    } catch (error) {
      console.error(`[Debug] Dashboard - Error fetching branch booking data:`, error);
      // Clear data on error
      setBranchBookingSummaries(prev => ({
        ...prev,
        [branchId]: {
          totalBookings: 0,
          totalSeats: 0,
          availableSeats: 0,
          currentlySeated: 0
        }
      }));
      setLatestBookings([]);
      setTodayBookings([]);
      setAllLatestBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication and fetch restaurant data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[DEBUG] RestaurantDashboard - Starting authentication check');
        setIsLoading(true);
        const token = await SecureStore.getItemAsync('auth_token');
        
        console.log('[DEBUG] RestaurantDashboard - Token check:', token ? 'Token exists' : 'No token');
        
        if (!token) {
          console.log('[DEBUG] RestaurantDashboard - No token found, redirecting to login');
          router.replace('/login');
          return;
        }
        
        console.log('[DEBUG] RestaurantDashboard - Fetching restaurant data from API');
        // Fetch real restaurant data from API
        const restaurantData = await getCurrentRestaurant();
        console.log('[DEBUG] RestaurantDashboard - Restaurant data received:', restaurantData ? 'Success' : 'Failed');
        
        if (!restaurantData) {
          console.log('[DEBUG] RestaurantDashboard - No restaurant data, redirecting to login');
          router.replace('/login');
          return;
        }
        
        console.log('[DEBUG] RestaurantDashboard - Restaurant data:', JSON.stringify(restaurantData, null, 2));
        
        // Set restaurant data
        setRestaurant(restaurantData);
        
        // Set profile form data
        setName(restaurantData.name || '');
        setEmail(restaurantData.email || '');
        setAbout(restaurantData.profile?.about || '');
        setCuisine(restaurantData.profile?.cuisine || '');
        setPriceRange(restaurantData.profile?.priceRange || '');
        setLogo(restaurantData.profile?.logo || '');
        console.log('[DEBUG] RestaurantDashboard - Logo set to:', restaurantData.profile?.logo || 'No logo');
        
        // Fetch restaurant branches if available
        if (restaurantData.branches && restaurantData.branches.length > 0) {
          setBranches(restaurantData.branches.map(branch => ({
            id: branch.id,
            address: branch.address || '',
            city: branch.city || ''
          })));
          
          // Select the first branch by default
          setSelectedBranch(restaurantData.branches[0].id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in authentication check:', error);
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    // Fetch branch-specific booking data when branch or date changes
    fetchBranchBookingData();
  }, [selectedBranch, selectedDate, branches]);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const renderDashboardTab = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 100}}>
      <View style={{padding: 20, backgroundColor: '#f8f8f8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <View>
          <Text style={{fontSize: 24, fontWeight: 'bold', color: '#000'}}>ehgezli</Text>
          <Text style={{fontSize: 16, color: '#666', marginTop: 4}}>Restaurant Dashboard</Text>
          <Text style={{fontSize: 16, color: '#333', marginTop: 8}}>Welcome, {restaurant?.name || ''}!</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('profile')}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.headerLogo} />
          ) : (
            <View style={styles.headerPlaceholderLogo}>
              <Text style={styles.headerPlaceholderText}>{name.charAt(0)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Branch Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.sectionTitle}>Select Branch:</Text>
        <View style={styles.branchSelector}>
          {branches.length > 0 ? (
            branches.map((branch) => (
              <TouchableOpacity 
                key={branch.id}
                style={[styles.branchOption, selectedBranch === branch.id && styles.selectedBranchOption]}
                onPress={() => setSelectedBranch(branch.id)}
              >
                <Text style={[styles.branchText, selectedBranch === branch.id && styles.selectedBranchText]}>
                  {branch.address}, {branch.city}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyMessage}>No branches available</Text>
          )}
        </View>
      </View>
      
      {/* Date Selector */}
      <View style={styles.dateContainer}>
        <View style={styles.dateNavigationContainer}>
          <TouchableOpacity 
            onPress={() => {
              const prevDay = addDays(selectedDate, -1);
              setSelectedDate(prevDay);
              fetchBranchBookingData(selectedBranch, prevDay);
            }}
            style={styles.dateNavButton}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)} 
            style={styles.datePickerButton}
          >
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
            <MaterialIcons name="calendar-today" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              const nextDay = addDays(selectedDate, 1);
              setSelectedDate(nextDay);
              fetchBranchBookingData(selectedBranch, nextDay);
            }}
            style={styles.dateNavButton}
          >
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateSelect}
              style={{ width: '100%' }}
              themeVariant="light"
              textColor="black"
            />
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Booking Summary Cards */}
      <View style={styles.summaryContainer}>
        {selectedBranch && branchBookingSummaries[selectedBranch] ? (
          <>
            <View style={[styles.summaryCard, styles.totalBookingsCard]}>
              <FontAwesome5 name="calendar-check" size={24} color="#fff" />
              <Text style={styles.summaryValue}>{branchBookingSummaries[selectedBranch].totalBookings}</Text>
              <Text style={styles.summaryLabel}>Total Bookings</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.totalSeatsCard]}>
              <FontAwesome5 name="chair" size={24} color="#fff" />
              <Text style={styles.summaryValue}>{branchBookingSummaries[selectedBranch].totalSeats}</Text>
              <Text style={styles.summaryLabel}>Total Seats</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.availableSeatsCard]}>
              <FontAwesome5 name="chair" size={24} color="#fff" />
              <Text style={styles.summaryValue}>{branchBookingSummaries[selectedBranch].availableSeats}</Text>
              <Text style={styles.summaryLabel}>Available Seats</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.currentlySeatedCard]}>
              <FontAwesome5 name="users" size={24} color="#fff" />
              <Text style={styles.summaryValue}>{branchBookingSummaries[selectedBranch].currentlySeated}</Text>
              <Text style={styles.summaryLabel}>Currently Seated</Text>
            </View>
          </>
        ) : (
          <Text style={styles.emptyMessage}>No booking data available for selected branch</Text>
        )}
      </View>
      

      
      {/* Bookings for Selected Date */}
      <View style={styles.bookingsContainer}>
        <Text style={styles.sectionTitle}>Bookings on {formatDisplayDate(selectedDate)}</Text>
        
        {todayBookings.length > 0 ? (
          todayBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{booking.customerName}</Text>
                <Text style={styles.bookingDetails}>
                  {booking.partySize} people • {booking.time}
                </Text>
              </View>
              
              <View style={styles.bookingStatusContainer}>
                <Text 
                  style={[
                    styles.bookingStatus, 
                    booking.status === 'confirmed' ? styles.confirmedStatus : 
                    booking.status === 'Completed' ? styles.completedStatus : styles.seatedStatus
                  ]}
                >
                  {booking.status === 'confirmed' ? 'Confirmed' : booking.status === 'Completed' ? 'Completed' : 'Seated'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyMessage}>No bookings available for today</Text>
        )}
      </View>
            {/* Latest Bookings */}
            <View style={styles.bookingsContainer}>
        <Text style={styles.sectionTitle}>Latest Bookings</Text>
        
        {latestBookings.length > 0 ? (
          latestBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{booking.customerName}</Text>
                <Text style={styles.bookingDetails}>
                  {booking.partySize} people • {booking.date} • {booking.time}
                </Text>
              </View>
              
              <View style={styles.bookingStatusContainer}>
                <Text 
                  style={[
                    styles.bookingStatus, 
                    booking.status === 'confirmed' ? styles.confirmedStatus : 
                    booking.status === 'Completed' ? styles.completedStatus : styles.seatedStatus
                  ]}
                >
                  {booking.status === 'confirmed' ? 'Confirmed' : booking.status === 'Completed' ? 'Completed' : 'Seated'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyMessage}>No bookings available</Text>
        )}
      </View>
    </ScrollView>
  );
  
  const renderProfileTab = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 100}}>
      <View style={styles.profileContainer}>
        <View style={styles.profileHeader}>
          <Text style={styles.profileTitle}>Restaurant Profile</Text>
        </View>
        
        <Text style={styles.profileSubtitle}>Manage your restaurant information</Text>

        <View style={styles.profileCard}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logo} />
            ) : (
              <View style={styles.placeholderLogo}>
                <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity 
                style={styles.pickImageButton} 
                onPress={pickImage}
              >
                <Text style={styles.pickImageText}>Pick Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            // Edit Mode
            <>
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Restaurant Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Restaurant Name"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                  />
                </View>
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Cuisine</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={cuisine}
                    onChangeText={setCuisine}
                    placeholder="e.g., Italian, Japanese, Mediterranean"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Price Range</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={priceRange}
                    onChangeText={setPriceRange}
                    placeholder="e.g., $, $$, $$$"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>About</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={about}
                    onChangeText={setAbout}
                    placeholder="Tell customers about your restaurant"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <EhgezliButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelButton}
                />
                
                <EhgezliButton
                  title="Save Changes"
                  variant="ehgezli"
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                />
              </View>
            </>
          ) : (
            // View Mode
            <>
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Restaurant Name</Text>
                <Text style={styles.infoValue}>{name}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
              
              {cuisine && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Cuisine</Text>
                  <Text style={styles.infoValue}>{cuisine}</Text>
                </View>
              )}
              
              {priceRange && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Price Range</Text>
                  <Text style={styles.infoValue}>{priceRange}</Text>
                </View>
              )}
              
              {about && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>About</Text>
                  <Text style={styles.infoValue}>{about}</Text>
                </View>
              )}
              
              {branches && branches.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Branches</Text>
                  {branches.map((branch, index) => (
                    <View key={branch.id} style={styles.branchItem}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <MaterialIcons name="location-on" size={16} color="#B41E1E" style={{marginRight: 8}} />
                        <Text style={{fontSize: 16, fontWeight: '500', color: '#333'}}>{branch.address}</Text>
                      </View>
                      <Text style={{fontSize: 14, color: '#666', marginLeft: 24}}>{branch.city}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {!isEditing && (
        <View style={{paddingHorizontal: 20}}>
          <EhgezliButton
            title="Edit Profile"
            variant="ehgezli"
            onPress={() => setIsEditing(true)}
            style={styles.editProfileButton}
          />
        </View>
      )}
      
      <View style={{paddingHorizontal: 20}}>
        <EhgezliButton
          title="Log Out"
          variant="ehgezli"
          onPress={() => {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', onPress: handleLogout, style: 'destructive' }
              ]
            );
          }}
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B41E1E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' ? renderDashboardTab() : renderProfileTab()}
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setActiveTab('dashboard')}
        >
          {activeTab === 'dashboard' ? (
            <Image 
              source={require('../assets/Ehgezli-logo.png')} 
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ) : (
            <Image 
              source={require('../assets/Ehgezli-logo-white.png')} 
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          )}
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons 
            name="person" 
            size={24} 
            color={activeTab === 'profile' ? '#B41E1E' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
  },
  selectorContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  branchSelector: {
    flexDirection: 'column',
  },
  branchOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedBranchOption: {
    borderColor: '#B41E1E',
    backgroundColor: '#f0f7ff',
  },
  branchText: {
    fontSize: 14,
    color: '#333',
  },
  selectedBranchText: {
    color: '#B41E1E',
    fontWeight: '600',
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  dateNavButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 15,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalBookingsCard: {
    backgroundColor: '#4361ee',
  },
  totalSeatsCard: {
    backgroundColor: '#3a0ca3',
  },
  availableSeatsCard: {
    backgroundColor: '#4cc9f0',
  },
  currentlySeatedCard: {
    backgroundColor: '#f72585',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  bookingsContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 0, // Add space for tab bar
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookingStatusContainer: {
    marginLeft: 10,
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  confirmedStatus: {
    backgroundColor: '#e6f7ff',
    color: '#0070f3',
  },
  seatedStatus: {
    backgroundColor: '#f6ffed',
    color: '#52c41a',
  },
  completedStatus: {
    backgroundColor: '#f6ffed',
    color: '#52c41a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 80, 
    display: 'flex',
    paddingBottom: 25, 
    paddingTop: 10, 
    position: 'absolute',
    bottom: 0, 
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    borderRadius: 15,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: '#B41E1E',
    fontWeight: '600',
  },
  // Profile styles
  profileContainer: {
    padding: 20,
    paddingTop: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  placeholderLogo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#B41E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  pickImageButton: {
    backgroundColor: '#B41E1E',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  pickImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  editProfileButton: {
    marginBottom: 12,
    marginTop: 0,
  },
  logoutButton: {
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#B41E1E',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  branchItem: {
    marginBottom: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerPlaceholderLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B41E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
