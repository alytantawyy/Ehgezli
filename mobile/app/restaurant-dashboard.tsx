import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { getCurrentRestaurant } from '../shared/api/client';

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
  const [bookingSummary, setBookingSummary] = useState({
    totalBookings: 0,
    totalSeats: 0,
    availableSeats: 0,
    currentlySeated: 0,
  });
  
  interface Booking {
    id: number;
    customerName: string;
    partySize: number;
    time: string;
    status: string;
  }
  
  const [latestBookings, setLatestBookings] = useState<Booking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [logo, setLogo] = useState('');
  
  // Check authentication and fetch restaurant data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = await SecureStore.getItemAsync('auth_token');
        
        if (!token) {
          router.replace('/login');
          return;
        }
        
        // Fetch real restaurant data from API
        const restaurantData = await getCurrentRestaurant();
        if (!restaurantData) {
          router.replace('/login');
          return;
        }
        
        // Set restaurant data
        setRestaurant(restaurantData);
        
        // Set profile form data
        setName(restaurantData.name || '');
        setEmail(restaurantData.email || '');
        setAbout(restaurantData.about || '');
        setCuisine(restaurantData.cuisine || '');
        setPriceRange(restaurantData.priceRange || '');
        setLogo(restaurantData.logo || '');
        
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
  
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handleDateChange = (daysToAdd: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    setSelectedDate(newDate);
  };
  
  const renderDashboardTab = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 100}}>
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>ehgezli</Text>
        <Text style={styles.subtitle}>Restaurant Dashboard</Text>
        <Text style={styles.welcomeText}>Welcome, {restaurant?.name || ''}!</Text>
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
        <TouchableOpacity onPress={() => handleDateChange(-1)} style={styles.dateArrow}>
          <MaterialIcons name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.dateText}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
        
        <TouchableOpacity onPress={() => handleDateChange(1)} style={styles.dateArrow}>
          <MaterialIcons name="chevron-right" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Booking Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.totalBookingsCard]}>
          <FontAwesome5 name="calendar-check" size={24} color="#fff" />
          <Text style={styles.summaryValue}>{bookingSummary.totalBookings}</Text>
          <Text style={styles.summaryLabel}>Total Bookings</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.totalSeatsCard]}>
          <FontAwesome5 name="chair" size={24} color="#fff" />
          <Text style={styles.summaryValue}>{bookingSummary.totalSeats}</Text>
          <Text style={styles.summaryLabel}>Total Seats</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.availableSeatsCard]}>
          <FontAwesome5 name="chair" size={24} color="#fff" />
          <Text style={styles.summaryValue}>{bookingSummary.availableSeats}</Text>
          <Text style={styles.summaryLabel}>Available Seats</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.currentlySeatedCard]}>
          <FontAwesome5 name="users" size={24} color="#fff" />
          <Text style={styles.summaryValue}>{bookingSummary.currentlySeated}</Text>
          <Text style={styles.summaryLabel}>Currently Seated</Text>
        </View>
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
                  {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'} • {booking.time}
                </Text>
              </View>
              
              <View style={styles.bookingStatusContainer}>
                <Text 
                  style={[
                    styles.bookingStatus, 
                    booking.status === 'confirmed' ? styles.confirmedStatus : styles.seatedStatus
                  ]}
                >
                  {booking.status === 'confirmed' ? 'Confirmed' : 'Seated'}
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
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setIsEditing(true)}
            >
              <MaterialIcons name="edit" size={24} color="#B41E1E" />
            </TouchableOpacity>
          )}
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
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
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
              
              {about && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>About</Text>
                  <Text style={styles.infoValue}>{about}</Text>
                </View>
              )}
              
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
            </>
          )}
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f8f9fa',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  dateArrow: {
    padding: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    marginTop: 15,
    marginBottom: 80, // Add space for tab bar
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
    paddingBottom: 80, // Add space for tab bar
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B41E1E',
  },
  editButton: {
    padding: 8,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 60, // Space for tab bar
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#B41E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  logoutButton: {
    backgroundColor: '#B41E1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
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
});
