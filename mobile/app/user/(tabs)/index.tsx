import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getSmartDefaultDateTime, formatDisplayTime, getMinSelectableDate } from '@/app/utils/date-time';
import * as Location from 'expo-location';
import { useBranchStore } from '../../../store/branch-store';

// Components
import { SearchBar } from '@/components/userScreen/SearchBar';
import { BranchList } from '@/components/userScreen/BranchList';
import { FilterDrawer } from '@/components/userScreen/FilterDrawer';
import DatePickerModal from '@/components/common/DatePickerModal';
import TimePickerModal from '@/components/common/TimePickerModal';
import PartySizePickerModal from '@/components/common/PartySizePickerModal';
import { Avatar } from '@/components/common/Avatar';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useSavedBranches } from '@/hooks/useSavedBranches';

// Types
import { User } from '@/types/auth';
import { Restaurant } from '@/types/restaurant';
import { UserRoute } from '@/types/navigation';

// Constants
import { CITY_OPTIONS, CUISINE_OPTIONS, PRICE_RANGE_OPTIONS } from '@/constants/FilterOptions';
import { BranchCard, BranchCardRefType } from '@/components/userScreen/BranchCard';
import { BranchListItem } from '@/types/branch';
import { AuthRoute } from '@/types/navigation';

/**
 * Home Screen
 * 
 * Main screen for users to discover and filter restaurants
 */
export default function HomeScreen() {
  // Authentication
  const { user, userType } = useAuth();
  const isRestaurant = userType === 'restaurant';
  
  // Branch data
  const { 
    branches,
    filteredBranches,
    loading: branchesLoading,
    searchBranches,
    filterByCity,
    filterByCuisine,
    filterByPriceRange,
    sortByDistance,
    resetAllFilters,
    clearError,
    sortBranches,
    userLocation,
    calculateAvailability
  } = useBranches();
  
  // Saved branches
  const { toggleSavedBranch, isBranchSaved } = useSavedBranches();
  
  // Get smart default date and time based on current time of day
  const defaultDateTime = getSmartDefaultDateTime();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date>(() => {
    const defaults = getSmartDefaultDateTime();
    return defaults.date;
  });
  const [time, setTime] = useState<string>(() => {
    const defaults = getSmartDefaultDateTime();
    return defaults.time;
  });
  const [partySize, setPartySize] = useState(2);
  
  // Store the last selected date and time to prevent reset on navigation
  const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
  const [lastSelectedTime, setLastSelectedTime] = useState<string | null>(null);
  
  // Preserve date and time selection when navigating back to this screen
  useFocusEffect(
    React.useCallback(() => {
      // If we have stored a last selected date/time, use it instead of resetting
      if (lastSelectedDate) {
        setDate(lastSelectedDate);
      }
      if (lastSelectedTime) {
        setTime(lastSelectedTime);
      }
    }, [lastSelectedDate, lastSelectedTime])
  );
  
  // Update the last selected values whenever date or time changes
  useEffect(() => {
    setLastSelectedDate(date);
  }, [date]);
  
  useEffect(() => {
    setLastSelectedTime(time);
  }, [time]);
  
  // Debug log function to show current date and time
  const logDateTimeState = () => {
    console.log(`CURRENT STATE: Date=${format(date, 'yyyy-MM-dd')}, Time=${time}, Real time=${new Date().toTimeString().slice(0, 5)}`);
  };

  // Log whenever date or time changes
  useEffect(() => {
    logDateTimeState();
  }, [date, time]);

  // Track if we've just mounted the component to avoid initial refresh
  const isInitialMount = useRef(true);
  
  // Create a ref to store branch card references
  const branchCardsRef = useRef<Map<number, BranchCardRefType>>(new Map());
  
  // Filter state
  const [cityFilter, setCityFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');
  
  // UI state
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isPartySizePickerVisible, setIsPartySizePickerVisible] = useState(false);
  
  // State for showing saved branches only
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // Calculate displayed branches based on filters and saved status
  const displayedBranches = useMemo(() => {
    if (showSavedOnly && user) {
      return filteredBranches.filter(branch => isBranchSaved(branch.branchId));
    }
    return filteredBranches;
  }, [filteredBranches, showSavedOnly, user, isBranchSaved]);

  // Effect to refresh time slots when date or time changes
  useEffect(() => {
    // Update time slots in all branch cards when date or time changes
    branchCardsRef.current.forEach((cardRef) => {
      if (cardRef && cardRef.refreshTimeSlots) {
        cardRef.refreshTimeSlots(date, time);
      }
    });
    
    console.log(`DEBUG: Refreshing time slots for all branches with date=${format(date, 'yyyy-MM-dd')} and time=${time}`);
  }, [date, time]);

  // Refresh time slots when date or time changes
  useEffect(() => {
    // Skip the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Use a debounce to avoid too many refreshes
    const timer = setTimeout(() => {
      // Only refresh if we have branches to display
      if (displayedBranches.length > 0) {
        console.log(`Refreshing time slots with date: ${format(date, 'yyyy-MM-dd')} and time: ${time}`);
        // Call refreshTimeSlots on all branch cards
        branchCardsRef.current.forEach((branchCardRef) => {
          if (branchCardRef && typeof branchCardRef.refreshTimeSlots === 'function') {
            branchCardRef.refreshTimeSlots(date, time);
          }
        });
        
        // Wait a bit for time slots to be updated, then calculate availability and sort
        setTimeout(() => {
          calculateAvailability();
          sortBranches();
        }, 1000);
      }
    }, 500); // Increased delay to reduce API calls
    
    return () => clearTimeout(timer);
  }, [date, time, displayedBranches.length, calculateAvailability, sortBranches]);
  
  // Sort branches when they're loaded or when location changes
  useEffect(() => {
    if (branches.length > 0) {
      console.log('Branches loaded or location changed, sorting branches...');
      sortBranches();
    }
  }, [branches.length, userLocation, sortBranches]);
  
  // Format time from 24-hour to AM/PM format for display
  const formatDisplayTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchBranches(query);
  };
  
  // Handle star button press
  const handleStarButtonPress = () => {
    if (!user) {
      // If user is not logged in, redirect to auth screen
      router.push(AuthRoute.login);
      return;
    }
    // Toggle saved only filter
    setShowSavedOnly(!showSavedOnly);
  };
  
  // Apply filters
  const applyFilters = () => {
    // Apply each filter individually
    filterByCity(cityFilter === 'all' ? null : cityFilter);
    filterByCuisine(cuisineFilter === 'all' ? null : cuisineFilter);
    filterByPriceRange(priceFilter === 'all' ? null : priceFilter);
    
    // For distance filter, you might need to use sortByDistance
    if (distanceFilter !== 'all') {
      sortByDistance();
    }
    
    setIsFilterDrawerVisible(false);
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    // Reset filter state variables in the component
    setCityFilter('all');
    setCuisineFilter('all');
    setPriceFilter('all');
    setDistanceFilter('all');
    setSearchQuery('');
    
    // Reset filters in the branch store
    resetAllFilters();
    
    // Close the filter drawer
    setIsFilterDrawerVisible(false);
  };
  
  // Date picker handlers
  const handleDateChange = (selectedDate: Date) => {
    if (selectedDate) {
      // Ensure we're not selecting a date in the past
      const minDate = getMinSelectableDate();
      if (selectedDate < minDate) {
        selectedDate = minDate;
      }
      
      const oldDate = date;
      setDate(selectedDate);
      
      console.log(`DEBUG: Date changed from ${format(oldDate, 'yyyy-MM-dd')} to ${format(selectedDate, 'yyyy-MM-dd')}`);
      console.log(`DEBUG: Current time is ${time}, current real time is ${new Date().toTimeString().slice(0, 5)}`);
      
      // When changing dates, reset to an appropriate default time
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      
      if (isToday) {
        // For today, check if current selected time has already passed
        const [selectedHours, selectedMinutes] = time.split(':').map(Number);
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // If selected time has already passed today, use smart default time
        if (selectedHours < currentHours || 
            (selectedHours === currentHours && selectedMinutes <= currentMinutes)) {
          // Get new valid time using our smart default logic
          const smartDefaults = getSmartDefaultDateTime();
          const oldTime = time;
          setTime(smartDefaults.time);
          console.log(`DEBUG: Time updated from ${oldTime} to ${smartDefaults.time} (using smart defaults)`);
        } else {
          console.log(`DEBUG: Keeping current time ${time} as it's still valid for today`);
        }
      } else {
        // For future dates, default to dinner time (6:00 PM)
        const oldTime = time;
        setTime('18:00');
        console.log(`DEBUG: Time updated from ${oldTime} to 18:00 (default dinner time for future date)`);
      }
    }
  };

  const getTimePickerValue = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date;
  };

  const handleTimeChange = (selectedTime: Date) => {
    if (selectedTime) {
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      // For today, ensure selected time is in the future
      if (isToday) {
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const selectedHours = selectedTime.getHours();
        const selectedMinutes = selectedTime.getMinutes();
        
        console.log(`DEBUG: Time selection - Current: ${currentHours}:${currentMinutes}, Selected: ${selectedHours}:${selectedMinutes}`);
        
        // If selected time has already passed today
        if (selectedHours < currentHours || 
            (selectedHours === currentHours && selectedMinutes <= currentMinutes)) {
          console.log(`DEBUG: Rejected time ${selectedHours}:${selectedMinutes} as it's in the past`);
          // Don't update the time and return early
          return;
        }
      }
      
      // Update time if it's valid
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;
      const oldTime = time;
      setTime(newTime);
      console.log(`DEBUG: Time updated from ${oldTime} to ${newTime}`);
    }
  };
  
  // Party size handlers
  const handlePartySizeSelect = (size: number) => {
    setPartySize(size);
    setIsPartySizePickerVisible(false);
  };
  
  useEffect(() => {
    if (showSavedOnly) {
    }
  }, [showSavedOnly]);
  
  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      cityFilter !== 'all' || 
      cuisineFilter !== 'all' || 
      priceFilter !== 'all' || 
      distanceFilter !== 'all'
    );
  }, [cityFilter, cuisineFilter, priceFilter, distanceFilter]);
  
  // Format the filter button text to show active filters
  const getFilterButtonText = useMemo(() => {
    // Always return 'Filters' regardless of which filters are active
    return 'Filters';
  }, []);
  
  // Track if we've shown the location permission dialog
  const [hasRequestedLocationPermission, setHasRequestedLocationPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  
  // Function to request location permission with a custom dialog
  const requestLocationPermission = async () => {
    if (hasRequestedLocationPermission || isCheckingPermission) return;
    
    setIsCheckingPermission(true);
    
    try {
      // First check if permission was already granted in a previous session
      const permissionGranted = await useBranchStore.getState().checkLocationPermission();
      
      if (permissionGranted) {
        // Permission was already granted, the branch store has handled getting the location
        setHasRequestedLocationPermission(true);
        setIsCheckingPermission(false);
        return;
      }
      
      // If not previously granted, show the custom dialog
      setHasRequestedLocationPermission(true);
      useBranchStore.getState().setHasRequestedLocationPermission(true);
      
      // Show custom alert to explain why we need location
      Alert.alert(
        "Location Access",
        "Ehgezli would like to access your location to show you the distance to restaurants. Would you like to grant permission?",
        [
          {
            text: "Don't Allow",
            onPress: () => {
              console.log("Location permission denied by user via custom dialog");
              // We'll set userLocation to null in the branch store
              useBranchStore.getState().setUserLocationNull();
            },
            style: "cancel"
          },
          {
            text: "Allow",
            onPress: async () => {
              console.log("User agreed to location permission via custom dialog");
              // Now we'll request the actual system permission
              const { status } = await Location.requestForegroundPermissionsAsync();
              
              if (status === 'granted') {
                // Get the user's location
                useBranchStore.getState().getUserLocation();
              } else {
                // Permission was denied
                console.log("System location permission denied");
                useBranchStore.getState().setUserLocationNull();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error checking location permission:", error);
    } finally {
      setIsCheckingPermission(false);
    }
  };
  
  // Show location permission dialog on first load
  useEffect(() => {
    // Small delay to ensure the app is fully loaded
    const timer = setTimeout(() => {
      requestLocationPermission();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>ehgezli</Text>
            <Text style={styles.subtitle}>Find and book restaurants</Text>
          </View>
          
          {user && (
            <TouchableOpacity onPress={() => router.push(UserRoute.profile)}>
              {isRestaurant ? (
                <Avatar 
                  firstName={(user as Restaurant).name || ''} 
                  lastName="" 
                  size={40}
                />
              ) : (
                <Avatar 
                  firstName={(user as User).firstName} 
                  lastName={(user as User).lastName} 
                  size={40}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            onSearch={handleSearch}
            initialValue={searchQuery}
            placeholder="Search restaurants, cuisines or cities..."
            containerStyle={styles.searchBar}
          />
        </View>
        <TouchableOpacity 
          style={[styles.favoriteButton, showSavedOnly && styles.favoriteButtonActive]}
          onPress={handleStarButtonPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={showSavedOnly ? "star" : "star-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Filters Row */}
      <View style={styles.filtersContainer}>
        {/* Date Selector */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.filterButtonText}>
            {format(date, 'MMM d')}
          </Text>
        </TouchableOpacity>

        {/* Time Selector */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsTimePickerVisible(true)}
        >
          <Ionicons name="time-outline" size={18} color="#fff" />
          <Text style={styles.filterButtonText}>{formatDisplayTime(time)}</Text>
        </TouchableOpacity>

        {/* Party Size Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsPartySizePickerVisible(true)}
        >
          <Ionicons name="people-outline" size={18} color="#fff" />
          <Text style={styles.filterButtonText}>{partySize} people</Text>
        </TouchableOpacity>

        {/* Filters Button */}
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setIsFilterDrawerVisible(true)}
        >
          <Ionicons 
            name={hasActiveFilters ? "funnel" : "funnel-outline"} 
            size={18} 
            color="#fff" 
          />
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            {getFilterButtonText}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Restaurant List or No Results Message */}
      <View style={styles.contentContainer}>
        {displayedBranches.length > 0 ? (
          <BranchList
            branches={displayedBranches}
            loading={branchesLoading}
            onBranchPress={(branchId: number) => router.push({
              pathname: '/user/branch-details',
              params: {
                id: branchId.toString(),
                selectedDate: format(date, 'yyyy-MM-dd'),
                selectedTime: time
              }
            })}
            renderBranchCard={(branch: BranchListItem) => {
              return (
                <BranchCard
                  ref={(ref) => {
                    if (ref) {
                      branchCardsRef.current.set(branch.branchId, ref);
                    }
                  }}
                  branch={branch}
                  onPress={(branchId: number) => router.push({
                    pathname: '/user/branch-details',
                    params: {
                      id: branchId.toString(),
                      selectedDate: format(date, 'yyyy-MM-dd'),
                      selectedTime: time
                    }
                  })}
                  isSaved={user ? isBranchSaved(branch.branchId) : false}
                  onToggleSave={(branchId: number) => {
                    if (!user) {
                      router.push(AuthRoute.login);
                      return;
                    }
                    toggleSavedBranch(branchId);
                  }}
                />
              );
            }}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              {showSavedOnly 
                ? "You don't have any saved restaurants yet." 
                : "No restaurants found matching your criteria."}
            </Text>
          </View>
        )}
      </View>
      
      {/* Date Picker Modal */}
      {isDatePickerVisible && (
        <DatePickerModal
          visible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onSelect={handleDateChange}
          selectedDate={date}
          minDate={getMinSelectableDate()} // Ensure minimum date is today
          maxDays={60} // Allow booking up to 60 days in advance
        />
      )}

      {/* Time Picker Modal */}
      {isTimePickerVisible && (
        <TimePickerModal
          visible={isTimePickerVisible}
          onClose={() => setIsTimePickerVisible(false)}
          onSelect={handleTimeChange}
          selectedTime={getTimePickerValue()}
          selectedDate={date} // Pass the selected date
          startHour={10} // Start from 10 AM
          endHour={23} // End at 11 PM
          interval={30} // 30-minute intervals
        />
      )}

      {/* Party Size Picker Modal */}
      {isPartySizePickerVisible && (
        <PartySizePickerModal
          visible={isPartySizePickerVisible}
          onClose={() => setIsPartySizePickerVisible(false)}
          onSelect={handlePartySizeSelect}
          selectedSize={partySize}
        />
      )}

      {/* Filter Drawer */}
      {isFilterDrawerVisible && (
        <FilterDrawer
          isVisible={isFilterDrawerVisible}
          onClose={() => setIsFilterDrawerVisible(false)}
          onApplyFilters={applyFilters}
          onResetFilters={handleResetFilters}
          cities={CITY_OPTIONS}
          cuisines={CUISINE_OPTIONS}
          priceRanges={PRICE_RANGE_OPTIONS}
          onSelectCity={(city) => setCityFilter(city || 'all')}
          onSelectCuisine={(cuisine) => setCuisineFilter(cuisine || 'all')}
          onSelectPriceRange={(priceRange) => setPriceFilter(priceRange || 'all')}
          onSortByDistance={() => setDistanceFilter('nearby')}
          cityFilter={cityFilter}
          cuisineFilter={cuisineFilter}
          priceFilter={priceFilter}
          distanceFilter={distanceFilter}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  searchBar: {
    flex: 1,
    height: 36,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#B22222',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  favoriteButtonActive: {
    backgroundColor: '#8B0000', // Darker red to indicate active state
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B22222',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 4,
  },
  filterButtonActive: {
    backgroundColor: '#8B0000', // Darker red to indicate active state
  },
  filterButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
  },
  filterButtonTextActive: {
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedOption: {
    backgroundColor: '#B22222',
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: '#B22222',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 8,
  },
});
