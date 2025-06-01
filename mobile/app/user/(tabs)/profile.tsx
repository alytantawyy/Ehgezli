import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar } from '../../../components/common/Avatar';
import { useAuth } from '../../../hooks/useAuth';
import { useUser } from '../../../hooks/useUser';
import { User } from '../../../types/user';
import { format } from 'date-fns'; 
import { AuthRoute, UserRoute } from '../../../types/navigation';
import ModalPicker from '../../../components/common/ModalPicker';
import MultiSelectModalPicker from '../../../components/common/MultiSelectModalPicker';
import { CITY_OPTIONS, CUISINE_OPTIONS } from '../../../constants/FilterOptions';

/**
 * Profile Tab Screen
 * 
 * Displays user profile information and settings
 */
export default function ProfileScreen() {
  const { user, userType, logout, fetchProfile } = useAuth();
  const { updateUserProfile } = useUser();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state for edit mode
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    city: '',
    favoriteCuisines: ['', '', '']
  });
  
  // City picker state
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState(CITY_OPTIONS);

  // Cuisine picker state
  const [cuisinePickerVisible, setCuisinePickerVisible] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState(CUISINE_OPTIONS);

  // Check if the user is a regular user (not a restaurant)
  const isRegularUser = userType === 'user';
  
  // Type guard function to check if user is a User type
  const isUserType = (user: any): user is User => {
    return user && 'firstName' in user;
  };

  // Initialize form data when edit mode changes
  useEffect(() => {
    if (isEditMode && isUserType(user)) {
      // Initialize form data with current user data
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        city: user.city || '',
        favoriteCuisines: user.favoriteCuisines || []
      });
      
      // Initialize selected values for dropdowns
      setSelectedCity(user.city || '');
      setSelectedCuisines(user.favoriteCuisines?.filter(cuisine => cuisine.trim() !== '') || []);
    }
  }, [isEditMode, user]);

  // Simple toggle for edit mode
  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle cuisine change
  const handleCuisineChange = (index: number, value: string) => {
    const updatedCuisines = [...formData.favoriteCuisines];
    updatedCuisines[index] = value;
    setFormData(prev => ({
      ...prev,
      favoriteCuisines: updatedCuisines
    }));
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!isUserType(user)) {
      Alert.alert('Error', 'Unable to update profile. Please try again later.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare update data according to the UpdateUserData interface in types/user.ts
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        city: selectedCity,
        favoriteCuisines: selectedCuisines.filter(cuisine => cuisine.trim() !== ''),
      };
      
      console.log('Sending update data:', updateData);
      
      // Call API to update profile
      await updateUserProfile(updateData);
      
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Update error details:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.replace(AuthRoute.login);
  };

  // If not a regular user or user data doesn't have the right shape, show limited profile
  if (!isRegularUser || !isUserType(user)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>View and manage your account information</Text>
          </View>
          
          <View style={styles.profileCard}>
            <View style={styles.userInfoSection}>
              <Avatar size={80} firstName="" lastName="" />
              <View style={styles.userDetails}>
                <Text style={styles.greeting}>Hi there!</Text>
                <Text style={styles.memberSince}>Welcome to Ehgezli</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#B22222" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Edit Mode UI
  if (isEditMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your account information</Text>
          </View>

          {/* Edit Form */}
          <View style={styles.profileCard}>
            {/* Avatar Section */}
            <View style={styles.userInfoSection}>
              <Avatar 
                size={80} 
                firstName={formData.firstName} 
                lastName={formData.lastName} 
              />
              <View style={styles.userDetails}>
                <Text style={styles.greeting}>Hi, {formData.firstName || user.firstName}!</Text>
                <Text style={styles.memberSince}>Member since {format(user.createdAt, 'MMMM yyyy')}</Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder="Enter your last name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                <ModalPicker
                  visible={cityPickerVisible}
                  onClose={() => setCityPickerVisible(false)}
                  title="Select City"
                  options={cities.map(city => ({ label: city, value: city }))}
                  selectedValue={selectedCity}
                  onSelect={(value: string) => {
                    setSelectedCity(value);
                    setFormData(prev => ({ ...prev, city: value }));
                    setCityPickerVisible(false);
                  }}
                />
                <TouchableOpacity onPress={() => setCityPickerVisible(true)}>
                  <View style={styles.input}>
                    <Text style={styles.inputText}>
                      {selectedCity ? selectedCity : 'Select City'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" style={styles.dropdownIcon} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Favorite Cuisines</Text>
                <MultiSelectModalPicker
                  visible={cuisinePickerVisible}
                  onClose={() => setCuisinePickerVisible(false)}
                  title="Select Favorite Cuisines"
                  options={cuisines}
                  selectedValues={selectedCuisines}
                  onSelect={(values) => {
                    setSelectedCuisines(values);
                    setFormData(prev => ({ ...prev, favoriteCuisines: values }));
                    setCuisinePickerVisible(false);
                  }}
                />
                <TouchableOpacity onPress={() => setCuisinePickerVisible(true)}>
                  <View style={styles.input}>
                    <Text style={styles.inputText}>
                      {selectedCuisines.length > 0 ? selectedCuisines.join(', ') : 'Select Cuisines (Max 3)'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" style={styles.dropdownIcon} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancelEdit}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]} 
              onPress={handleSaveChanges}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // View Mode UI (Default)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>View and manage your account information</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            <Avatar 
              size={80} 
              firstName={user.firstName} 
              lastName={user.lastName} 
            />
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Hi, {user.firstName}!</Text>
              <Text style={styles.memberSince}>Member since {format(user.createdAt, 'MMMM yyyy')}</Text>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{`${user.firstName} ${user.lastName}`}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>City</Text>
              <View style={styles.cityContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoValue}>{user.city}</Text>
              </View>
            </View>
          </View>

          {/* Favorite Cuisines */}
          <View style={styles.cuisineSection}>
            <Text style={styles.sectionTitle}>Favorite Cuisines</Text>
            <View style={styles.cuisineContainer}>
              {user.favoriteCuisines && user.favoriteCuisines.length > 0 ? (
                user.favoriteCuisines.map((cuisine, index) => (
                  <View key={index} style={styles.cuisineItem}>
                    <Ionicons name="restaurant-outline" size={16} color="#666" style={styles.cuisineIcon} />
                    <Text style={styles.cuisineName}>{cuisine}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noCuisines}>No favorite cuisines added yet</Text>
              )}
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.editButton} 
          onPress={() => {
            console.log('Edit button pressed directly');
            setIsEditMode(true);
          }}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#B22222" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userDetails: {
    marginLeft: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  memberSince: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  infoSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItem: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuisineSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  cuisineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  cuisineIcon: {
    marginRight: 5,
  },
  cuisineName: {
    fontSize: 14,
    color: '#333',
  },
  noCuisines: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: '#B22222',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 30,
  },
  logoutText: {
    color: '#B22222',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  // Edit mode styles
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#B22222',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
