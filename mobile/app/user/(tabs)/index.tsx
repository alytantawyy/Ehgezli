import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { SearchBar } from '../../../components/userScreen/SearchBar';
import { RestaurantList } from '../../../components/userScreen/RestaurantList';
import { FilterDrawer } from '../../../components/userScreen/FilterDrawer';
import { Avatar } from '../../../components/common/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../../context/auth-context';
import { useLocation } from '../../../context/location-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDefaultTimeForDisplay, getBaseTime, generateTimeSlotsFromTime } from '../../../shared/utils/time-slots';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getRestaurants } from '../../../api/restaurant';
import * as ExpoLocation from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Home Tab Screen
 * 
 * Main discovery screen for users to find and filter restaurants
 */
export default function HomeScreen() {
  // Component state will be added here
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(getDefaultTimeForDisplay());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user context
  const { user } = useAuth();

  // Fetch restaurants data
  const { data: restaurants = [], isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => getRestaurants(),
  });

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Toggle filter drawer
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Handle date selection
  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  // Handle time selection
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || new Date();
    setShowTimePicker(Platform.OS === 'ios');
    setSelectedTime(currentTime);
  };

  // Handle party size change
  const handlePartySizeChange = (size: number) => {
    setPartySize(size);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => router.push('/user/profile' as any)}>
          <Avatar size={40} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search restaurants..."
        />
        <TouchableOpacity style={styles.filterButton} onPress={toggleFilter}>
          <Ionicons name="options" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {isLoadingRestaurants ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : (
        <RestaurantList
          restaurants={restaurants}
          searchQuery={searchQuery}
          onSelectRestaurant={(id) => router.push(`/user/restaurant-details?id=${id}` as any)}
        />
      )}
      
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={toggleFilter}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedTime={selectedTime}
        onTimeChange={handleTimeChange}
        partySize={partySize}
        onPartySizeChange={handlePartySizeChange}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
