import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { SearchBar } from '@/components/SearchBar';
import { RestaurantList } from '@/components/RestaurantList';
import { FilterDrawer } from '@/components/FilterDrawer';
import { EhgezliButton } from '@/components/EhgezliButton';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

export default function HomeScreen() {
  console.log('[HomePage] rendering');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuth();
  
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Ehgezli</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>Find and book restaurants</Text>
            
            {user && (
              <View style={styles.userInfo}>
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  Welcome, {user.firstName}!
                </Text>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                  <Ionicons name="log-out-outline" size={20} color={colors.text} />
                </TouchableOpacity>
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
            <Text style={[styles.dateText, { color: colors.text }]}>
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
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 20,
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
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 4,
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
