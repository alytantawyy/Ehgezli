import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { SearchBar } from '@/components/SearchBar';
import { RestaurantList } from '@/components/RestaurantList';
import { FilterDrawer } from '@/components/FilterDrawer';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useLocation } from '@/context/location-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDefaultTimeForDisplay, getBaseTime, generateTimeSlotsFromTime } from '@/shared/utils/time-slots';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getRestaurants, getRestaurantLocation, getNearbyRestaurants } from '@/shared/api/client';

export default function TabOneScreen() {
  console.log('[HomePage] rendering');
  const { user } = useAuth();
  const { location, requestLocationPermission } = useLocation();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');
  
  // Get the default date (today or tomorrow for late night hours)
  const getDefaultDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // If it's late night (10 PM to 6 AM), use tomorrow's date
    if (currentHour >= 22 || currentHour < 6) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      console.log('Using tomorrow for default date:', tomorrow.toDateString());
      return tomorrow;
    }
    
    console.log('Using today for default date:', now.toDateString());
    return now;
  };
  
  const [date, setDate] = useState(getDefaultDate());
  const [time, setTime] = useState(getDefaultTimeForDisplay());
  const [partySize, setPartySize] = useState(2);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // UI state
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isPartySizePickerVisible, setIsPartySizePickerVisible] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleSavedOnly = () => {
    setShowSavedOnly(!showSavedOnly);
  };

  // Validate time whenever date changes
  useEffect(() => {
    // If we have a time selected, validate it for the current date
    if (time) {
      const isValid = validateTimeForDate(date, time);
      if (!isValid) {
        console.log('Time is invalid for the current date, resetting to default');
        setTime(getDefaultTimeForDisplay());
      }
    }
  }, [date]); // This effect runs whenever date changes

  // Validate if a time is valid for a given date
  const validateTimeForDate = (dateToCheck: Date, timeString: string): boolean => {
    try {
      // Parse the time string
      const [timePart, ampm] = timeString.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      
      let hour24 = hours;
      if (ampm === 'PM' && hours < 12) hour24 += 12;
      if (ampm === 'AM' && hours === 12) hour24 = 0;
      
      // Create a date-time with the given date and time
      const dateTime = new Date(dateToCheck);
      dateTime.setHours(hour24, minutes, 0, 0);
      
      // Check if this date-time is in the past
      const now = new Date();
      return dateTime.getTime() >= now.getTime();
    } catch (error) {
      console.error('Error validating time:', error);
      return false;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    
    if (selectedDate) {
      // Ensure we don't allow past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today
      
      if (selectedDate.getTime() >= today.getTime()) {
        setDate(selectedDate);
        // Time validation will happen in the useEffect
      } else {
        // If past date was selected, default to today
        console.log('Past date selected, defaulting to today');
        setDate(today);
        // Time validation will happen in the useEffect
      }
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setIsTimePickerVisible(false);
    
    if (selectedTime) {
      // Format the selected time for display
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      
      // Validate the time for the current date before setting it
      if (validateTimeForDate(date, displayTime)) {
        console.log('User selected valid time:', displayTime);
        setTime(displayTime);
      } else {
        console.log('Selected time is in the past, using default time instead');
        setTime(getDefaultTimeForDisplay());
      }
    }
  };

  const handlePartySizeSelect = (size: number) => {
    setPartySize(size);
    setIsPartySizePickerVisible(false);
  };

  const getTimePickerValue = () => {
    try {
      // If there's a selected time, use it
      if (time) {
        const [timePart, ampm] = time.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        
        let hour24 = hours;
        if (ampm === 'PM' && hours < 12) hour24 += 12;
        if (ampm === 'AM' && hours === 12) hour24 = 0;
        
        const date = new Date();
        date.setHours(hour24, minutes, 0, 0);
        return date;
      }
      
      // Otherwise, use the current time or default time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // If it's late night, use noon as default
      if (currentHour >= 22 || currentHour < 6) {
        now.setHours(12, 0, 0, 0);
      } else {
        // Add 2 hours to current time as default
        now.setHours(currentHour + 2, currentMinute, 0, 0);
      }
      
      return now;
    } catch (error) {
      console.error('Error getting time picker value:', error);
      return new Date();
    }
  };
  
  // Get the minimum allowed time based on the selected date
  const getMinimumTime = () => {
    const now = new Date();
    const selectedDate = new Date(date);
    
    // If selected date is today, minimum time is current time
    if (selectedDate.toDateString() === now.toDateString()) {
      return now;
    }
    
    // If selected date is in the future, no minimum time
    return undefined;
  };

  const isDateToday = () => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const applyFilters = () => {
    // This would typically trigger a new search with the current filters
    // For now, just close the filter drawer
    setIsFilterDrawerVisible(false);
  };

  const { data: nearbyRestaurants, isLoading: isLoadingNearbyRestaurants } = useQuery({
    queryKey: ['nearbyRestaurants', location?.coords?.latitude, location?.coords?.longitude],
    queryFn: async () => {
      if (!location) return [];
      try {
        const restaurants = await getNearbyRestaurants({
          latitude: location.coords.latitude.toString(),
          longitude: location.coords.longitude.toString(),
          radius: 5, // 5km radius
          limit: 10 // Limit to 10 restaurants
        });
        
        // For each restaurant, fetch location data with distance
        const restaurantsWithDistance = await Promise.all(
          restaurants.map(async (restaurant) => {
            try {
              // Only fetch if we have location data
              if (location?.coords) {
                const locationData = await getRestaurantLocation(restaurant.id, {
                  userLatitude: location.coords.latitude.toString(),
                  userLongitude: location.coords.longitude.toString(),
                });
                
                // Return restaurant with updated branches that include distance
                return {
                  ...restaurant,
                  branches: locationData.branches
                };
              }
              return restaurant;
            } catch (error) {
              console.error(`Error fetching location for restaurant ${restaurant.id}:`, error);
              return restaurant;
            }
          })
        );
        
        console.log('Restaurants with distance data:', 
          restaurantsWithDistance.map(r => ({
            id: r.id,
            name: r.name,
            branches: r.branches?.map(b => ({
              id: b.id,
              distance: b.distance,
              hasDistance: b.distance !== undefined
            }))
          }))
        );
        
        return restaurantsWithDistance;
      } catch (error) {
        console.error('Error fetching nearby restaurants:', error);
        return [];
      }
    },
    enabled: !!location,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Ehgezli</Text>
            <Text style={styles.subtitle}>Find and book restaurants</Text>
          </View>
          
          {user && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Avatar 
                firstName={user.firstName} 
                lastName={user.lastName} 
                size={40} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>
              Welcome, {user.firstName}!
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <SearchBar onSearch={handleSearch} containerStyle={styles.searchBar} />
          
          <TouchableOpacity 
            style={styles.starButton} 
            onPress={toggleSavedOnly}
          >
            <Ionicons 
              name={showSavedOnly ? 'star' : 'star-outline'} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{format(date, 'MMM d')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setIsTimePickerVisible(true)}
          >
            <Ionicons name="time-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{time}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setIsPartySizePickerVisible(true)}
          >
            <Ionicons name="people-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{partySize} {partySize === 1 ? 'person' : 'people'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsFilterDrawerVisible(true)}
          >
            <Ionicons 
              name={(cityFilter == 'all' && cuisineFilter == 'all' && priceFilter == 'all' && distanceFilter == 'all') ? 'funnel-outline' : 'funnel'} 
              size={16} 
              color="#fff"    
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {!location && (
        <TouchableOpacity 
          style={styles.locationPrompt}
          onPress={() => {
            if (location) return;
            requestLocationPermission();
          }}
        >
          <Ionicons name="location-outline" size={20} color="#007AFF" />
          <Text style={styles.locationPromptText}>Enable location to see nearby restaurants</Text>
        </TouchableOpacity>
      )}
      
      {isLoadingNearbyRestaurants ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Finding restaurants near you...</Text>
        </View>
      ) : (
        <RestaurantList
          searchQuery={searchQuery}
          cityFilter={cityFilter}
          cuisineFilter={cuisineFilter}
          priceFilter={priceFilter}
          distanceFilter={distanceFilter}
          date={date}
          time={time}
          partySize={partySize}
          showSavedOnly={showSavedOnly}
          nearbyRestaurants={nearbyRestaurants}
        />
      )}
      
      <Modal
        visible={isFilterDrawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterDrawerVisible(false)}
      >
        <FilterDrawer
          isVisible={isFilterDrawerVisible}
          onClose={() => setIsFilterDrawerVisible(false)}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          cuisineFilter={cuisineFilter}
          setCuisineFilter={setCuisineFilter}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          distanceFilter={distanceFilter}
          setDistanceFilter={setDistanceFilter}
          onApplyFilters={applyFilters}
        />
      </Modal>
      
      {isDatePickerVisible && (
        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsDatePickerVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsDatePickerVisible(false)}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                minimumDate={new Date()}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      
      {isTimePickerVisible && (
        <Modal
          visible={isTimePickerVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsTimePickerVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsTimePickerVisible(false)}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setIsTimePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                testID="timeTimePicker"
                value={getTimePickerValue()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={{ width: '100%' }}
                minimumDate={getMinimumTime()}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      
      {isPartySizePickerVisible && (
        <Modal
          visible={isPartySizePickerVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPartySizePickerVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsPartySizePickerVisible(false)}
          >
            <View style={styles.partySizePickerContainer}>
              <View style={styles.partySizePickerHeader}>
                <Text style={styles.partySizePickerTitle}>Select Party Size</Text>
                <TouchableOpacity onPress={() => setIsPartySizePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.partySizePickerScrollView}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(size => (
                  <TouchableOpacity 
                    key={size}
                    style={[styles.partySizeOption, partySize === size && styles.selectedOption]}
                    onPress={() => handlePartySizeSelect(size)}
                  >
                    <Text style={[styles.partySizeText, partySize === size && styles.selectedOptionText]}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  header: {
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
  userInfo: {
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 14,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    height: 48,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  starButton: {
    backgroundColor: 'hsl(355,79%,36%)', 
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    overflow: 'hidden',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(355,79%,36%)', 
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 5,
    marginBottom: 5,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 12,
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  partySizePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  partySizePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  partySizePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  partySizePickerScrollView: {
    maxHeight: 200,
  },
  partySizeOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: 'hsl(355,79%,36%)',
  },
  selectedOptionText: {
    color: '#fff',
  },
  partySizeText: {
    fontSize: 16,
  },
  locationPrompt: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPromptText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
});
