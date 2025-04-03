import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { SearchBar } from '@/components/SearchBar';
import { RestaurantList } from '@/components/RestaurantList';
import { FilterDrawer } from '@/components/FilterDrawer';
import { EhgezliButton } from '@/components/EhgezliButton';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { format } from 'date-fns';

export default function TabOneScreen() {
  console.log('[HomePage] rendering');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
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
        <Text style={styles.title}>Ehgezli</Text>
        <Text style={styles.subtitle}>Find and book restaurants</Text>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  searchContainer: {
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
