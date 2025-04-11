import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { SearchBar } from '@/components/SearchBar';
import { RestaurantList } from '@/components/RestaurantList';
import { FilterDrawer } from '@/components/FilterDrawer';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TabOneScreen() {
  console.log('[HomePage] rendering');
  const { user } = useAuth();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [date, setDate] = useState(new Date());
  
  // Calculate default time (2 hours from now, rounded to nearest 30 min)
  const getDefaultTime = () => {
    // Add 2 hours to current time
    const now = new Date();
    
    // Special handling for late night hours (10 PM to 6 AM)
    let baseTime;
    const currentHour = now.getHours();
    
    if (currentHour >= 22 || currentHour < 6) {
      // If it's late night, use noon the next day as the base time instead of now + 2 hours
      baseTime = new Date(now);
      baseTime.setDate(baseTime.getDate() + 1); // Next day
      baseTime.setHours(12, 0, 0, 0); // Set to noon
    } else {
      // Normal case: add 2 hours to current time
      baseTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }
    
    // Round down to nearest 30 mins
    const minutes = baseTime.getMinutes();
    const roundedMinutes = Math.floor(minutes / 30) * 30;
    baseTime.setMinutes(roundedMinutes);
    
    // Format for display (12-hour with AM/PM)
    const hours = baseTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${roundedMinutes.toString().padStart(2, '0')} ${ampm}`;
  };
  
  const [time, setTime] = useState(getDefaultTime());
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setIsTimePickerVisible(false);
    
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      
      setTime(displayTime);
    }
  };

  const handlePartySizeSelect = (size: number) => {
    setPartySize(size);
    setIsPartySizePickerVisible(false);
  };

  const getTimePickerValue = () => {
    try {
      const [timePart, ampm] = time.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      
      let hour24 = hours;
      if (ampm === 'PM' && hours < 12) hour24 += 12;
      if (ampm === 'AM' && hours === 12) hour24 = 0;
      
      const date = new Date();
      date.setHours(hour24, minutes, 0, 0);
      return date;
    } catch (error) {
      return new Date();
    }
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
});
