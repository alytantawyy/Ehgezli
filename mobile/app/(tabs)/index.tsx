import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { SearchBar } from '@/components/SearchBar';
import { RestaurantList } from '@/components/RestaurantList';
import { FilterDrawer } from '@/components/FilterDrawer';
import { EhgezliButton } from '@/components/EhgezliButton';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { router } from 'expo-router';

export default function TabOneScreen() {
  console.log('[HomePage] rendering');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // UI state
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleSavedOnly = () => {
    setShowSavedOnly(!showSavedOnly);
  };

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
        <SearchBar onSearch={handleSearch} />
        
        <View style={styles.filterButtons}>
          <EhgezliButton
            title="Filters"
            variant="outline"
            size="sm"
            onPress={() => setIsFilterDrawerVisible(true)}
            style={styles.filterButton}
            textStyle={styles.filterButtonText}
          />
          
          <TouchableOpacity 
            style={[styles.savedButton, showSavedOnly && styles.savedButtonActive]} 
            onPress={toggleSavedOnly}
          >
            <Ionicons 
              name={showSavedOnly ? 'star' : 'star-outline'} 
              size={20} 
              color={showSavedOnly ? '#fff' : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.dateInfo}>
        <Text style={styles.dateText}>
          Showing results for {format(date, 'MMM d')}, Party of {partySize}
        </Text>
      </View>
      
      <RestaurantList
        searchQuery={searchQuery}
        cityFilter={cityFilter}
        cuisineFilter={cuisineFilter}
        priceFilter={priceFilter}
        date={date}
        time={time}
        partySize={partySize}
        showSavedOnly={showSavedOnly}
      />
      
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
          onApplyFilters={() => {}}
        />
      </Modal>
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
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  filterButton: {
    flex: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
  },
  savedButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  dateInfo: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    opacity: 0.7,
  },
});
