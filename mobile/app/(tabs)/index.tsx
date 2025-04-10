import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { SearchBar } from '@/components/SearchBar';
import { RestaurantList } from '@/components/RestaurantList';
import { FilterDrawer } from '@/components/FilterDrawer';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { router } from 'expo-router';

export default function TabOneScreen() {
  console.log('[HomePage] rendering');
  const { user } = useAuth();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
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
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{format(date, 'MMM d')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="time-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{time || '5:00 PM'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{partySize} people</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsFilterDrawerVisible(true)}
          >
            <Ionicons 
              name={(cityFilter || cuisineFilter || priceFilter) ? 'funnel' : 'funnel-outline'} 
              size={16} 
              color="#fff" 
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Filters</Text>
          </TouchableOpacity>
        </View>
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
});
