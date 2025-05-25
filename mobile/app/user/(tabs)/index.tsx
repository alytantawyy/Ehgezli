import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components
import { SearchBar } from '@/components/userScreen/SearchBar';
import { BranchList } from '@/components/userScreen/BranchList';
import { FilterDrawer } from '@/components/userScreen/FilterDrawer';
import DatePickerModal from '@/components/common/DatePickerModal';
import TimePickerModal from '../../../components/common/TimePickerModal';
import PartySizePickerModal from '@/components/common/PartySizePickerModal';
import { Avatar } from '@/components/common/Avatar';

// Hooks
import { useAuth } from '../../../hooks/useAuth';
import { useBranches } from '../../../hooks/useBranches';

// Types
import { User } from '../../../types/auth';
import { Restaurant } from '@/types/restaurant';
import { UserRoute } from '@/types/navigation';

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
    clearError
  } = useBranches();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('18:00');
  const [partySize, setPartySize] = useState(2);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
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
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchBranches(query);
  };
  
  // Toggle saved restaurants filter
  const toggleSavedOnly = () => {
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
  
  // Date picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Time picker handlers
  const getTimePickerValue = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date;
  };
  
  const getMinimumTime = () => {
    const now = new Date();
    return now;
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setIsTimePickerVisible(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  };
  
  // Party size handlers
  const handlePartySizeSelect = (size: number) => {
    setPartySize(size);
    setIsPartySizePickerVisible(false);
  };
  
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
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <SearchBar
            onSearch={handleSearch}
            initialValue={searchQuery}
            placeholder="Search restaurants, cuisines or cities..."
            containerStyle={styles.searchBar}
          />
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="star-outline" size={24} color="#fff" />
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
          <Text style={styles.filterButtonText}>{time}</Text>
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
          style={styles.filterButton}
          onPress={() => setIsFilterDrawerVisible(true)}
        >
          <Ionicons name="options-outline" size={18} color="#fff" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>
      
      {/* Restaurant List or No Results Message */}
      {filteredBranches.length > 0 ? (
        <BranchList
          branches={filteredBranches}
          loading={branchesLoading}
          onBranchPress={(branchId: number) => router.push({pathname: '/user/branch-details', params: {id: branchId.toString()}})}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No restaurants found matching your criteria.</Text>
        </View>
      )}
      
      {/* Date Picker Modal */}
      {isDatePickerVisible && (
        <DatePickerModal
          visible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onSelect={handleDateChange}
          selectedDate={date}
          minDate={new Date()}
        />
      )}

      {/* Time Picker Modal */}
      {isTimePickerVisible && (
        <TimePickerModal
          visible={isTimePickerVisible}
          onClose={() => setIsTimePickerVisible(false)}
          onSelect={handleTimeChange}
          selectedTime={getTimePickerValue()}
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
      <FilterDrawer
        isVisible={isFilterDrawerVisible}
        onClose={() => setIsFilterDrawerVisible(false)}
        onApplyFilters={applyFilters}
        onResetFilters={resetAllFilters}
        cities={[]}
        cuisines={[]}
        priceRanges={[]}
        onSelectCity={(city) => setCityFilter(city || '')}
        onSelectCuisine={(cuisine) => setCuisineFilter(cuisine || '')}
        onSelectPriceRange={(priceRange) => setPriceFilter(priceRange || '')}
        onSortByDistance={() => setDistanceFilter('nearby')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  searchIcon: {
    marginRight: 6,
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
});
