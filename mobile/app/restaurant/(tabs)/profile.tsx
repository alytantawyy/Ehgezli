import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Stores and hooks
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useRestaurantUserStore } from '@/store/restaurantUser-store';
import { Restaurant } from '@/types/restaurant';
import { UpdateRestaurantUserData } from '@/types/restaurantUser';
import { AuthRoute, RestaurantRoute } from '@/types/navigation';
import { CUISINE_OPTIONS } from '@/constants/FilterOptions';
import ModalPicker from '@/components/common/ModalPicker';
import { updateRestaurantUserProfile } from '@/api/restaurantUser';
import { useRestaurantUser } from '@/hooks/useRestaurantUser';

/**
 * Restaurant Profile Screen
 * 
 * Displays and manages restaurant profile information
 */
export default function RestaurantProfileScreen() {
  const { logout } = useAuth();
  const { restaurant, isLoading, refreshRestaurantData } = useRestaurant();
  const { updateProfile } = useRestaurantUserStore();
  
  // State
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState(false);
  
  // State for in-place profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UpdateRestaurantUserData>({});
  const [showCuisineModal, setShowCuisineModal] = useState(false);

  // Transform CUISINE_OPTIONS to format expected by ModalPicker
  const cuisineOptions = CUISINE_OPTIONS.map(cuisine => ({
    label: cuisine,
    value: cuisine
  }));

  /**
   * Type guard to check if user is a Restaurant
   */
  const isRestaurant = (user: any): user is Restaurant => {
    return user && 'logo' in user;
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace(AuthRoute.login);
          }
        }
      ]
    );
  };
  
  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            Alert.alert('Account Deletion', 'This feature is not yet implemented.');
          }
        }
      ]
    );
  };
  
  // Start editing profile
  const handleEditProfile = () => {
    if (!restaurant) return;
    
    setEditedProfile({
      name: restaurant.name || '',
      email: restaurant.email || '',
      cuisine: restaurant.cuisine || '',
    });
    setIsEditing(true);
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      await updateRestaurantUserProfile(editedProfile);
      
      // Refresh restaurant data after update
      await refreshRestaurantData();
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  useEffect(() => {
    refreshRestaurantData();
  }, []);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>View and manage your restaurant account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Restaurant Info Section */}
          <View style={styles.userInfoSection}>
            {restaurant && restaurant.logo ? (
              <Image source={{ uri: restaurant.logo }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="restaurant" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Hi, {restaurant ? restaurant.name.split(' ')[0] : 'Restaurant'}!</Text>
              <Text style={styles.memberSince}>Member since May 2025</Text>
            </View>
          </View>

          {/* Restaurant Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Restaurant Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.name}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                  placeholder="Restaurant Name"
                />
              ) : (
                <Text style={styles.infoValue}>{restaurant ? restaurant.name : 'Your Restaurant'}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.email}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{restaurant ? restaurant.email : ''}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cuisine</Text>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.textInput, styles.dropdownInput]}
                  onPress={() => setShowCuisineModal(true)}
                >
                  <Text style={editedProfile.cuisine ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {editedProfile.cuisine || "Select cuisine"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              ) : (
                <View style={styles.cuisineContainer}>
                  <Ionicons name="restaurant-outline" size={16} color="#666" />
                  <Text style={styles.infoValue}>
                    {restaurant && restaurant.cuisine ? restaurant.cuisine : 'Not specified'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.infoItem}>
              <View style={styles.sectionHeader}>
                <Text style={styles.infoLabel}>Branches</Text>
                <TouchableOpacity onPress={() => router.push(RestaurantRoute.editBranches)}>
                  <Text style={styles.manageText}>Manage Branches</Text>
                </TouchableOpacity>
              </View>
              
              {restaurant && restaurant.branches && restaurant.branches.length > 0 ? (
                <View style={styles.branchList}>
                  {restaurant.branches.map((branch, index) => (
                    <View key={branch.id} style={styles.branchItem}>
                      <View style={styles.branchDetails}>
                        <Text style={styles.branchName}>{branch.restaurantName}</Text>
                        <View style={styles.branchLocation}>
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text style={styles.branchAddress}>{branch.address}</Text>
                        </View>
                        {branch.city && (
                          <View style={styles.branchLocation}>
                          <Ionicons name="business-outline" size={14} color="#666" />
                          <Text style={styles.branchCity}>{branch.city}</Text>
                        </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBranches}>
                  <Text style={styles.emptyText}>No branches added yet</Text>
                  <TouchableOpacity 
                    style={styles.addBranchButton}
                    onPress={() => router.push(RestaurantRoute.addBranch)}
                  >
                    <Text style={styles.addBranchText}>Add Branch</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Edit/Save Profile Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.editButton, styles.cancelButton]} 
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                activeOpacity={0.7}
                style={styles.editButton} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.editButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.editButton} 
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutButtonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#B22222" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Cuisine Picker Modal */}
      <ModalPicker
        visible={showCuisineModal}
        onClose={() => setShowCuisineModal(false)}
        title="Select Cuisine"
        options={cuisineOptions}
        onSelect={(value) => {
          setEditedProfile({ ...editedProfile, cuisine: value });
        }}
        selectedValue={editedProfile.cuisine}
      />
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfoSection: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B22222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 10,
  },
  infoItem: {
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
  textInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#666',
  },
  cuisineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  manageText: {
    color: '#B22222',
    fontSize: 14,
    fontWeight: '600',
  },
  branchList: {
    marginTop: 5,
  },
  branchItem: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  branchDetails: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  branchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  branchCity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  emptyBranches: {
    alignItems: 'center',
    padding: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  addBranchButton: {
    backgroundColor: '#B22222',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addBranchText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#B22222',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#B22222',
    fontSize: 16,
    marginLeft: 5,
  },
});
