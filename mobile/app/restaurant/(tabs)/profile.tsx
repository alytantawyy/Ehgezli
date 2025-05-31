import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Stores and hooks
import { useAuth } from '@/hooks/useAuth';
import { Restaurant } from '@/types/restaurant';
import { AuthRoute } from '@/types/navigation';

/**
 * Restaurant Profile Screen
 * 
 * Displays and manages restaurant profile information
 */
export default function RestaurantProfileScreen() {
  const { user, logout } = useAuth();
  
  // State
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState(false);
  
  /**
   * Type guard to check if user is a Restaurant
   */
  const isRestaurant = (user: any): user is Restaurant => {
    return user && 'logo' in user;
  };
  
  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logout()
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
  
  if (!user) {
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
            {isRestaurant(user) && user.logo ? (
              <Image source={{ uri: user.logo }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="restaurant" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Hi, {isRestaurant(user) ? user.name.split(' ')[0] : 'Restaurant'}!</Text>
              <Text style={styles.memberSince}>Member since May 2025</Text>
            </View>
          </View>

          {/* Restaurant Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{isRestaurant(user) ? user.name : 'Your Restaurant'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cuisine</Text>
              <View style={styles.cuisineContainer}>
                <Ionicons name="restaurant-outline" size={16} color="#666" />
                <Text style={styles.infoValue}>
                  {isRestaurant(user) && user.cuisine ? user.cuisine : 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.sectionHeader}>
                <Text style={styles.infoLabel}>Branches</Text>
                <TouchableOpacity onPress={() => router.push('/restaurant/edit-branches')}>
                  <Text style={styles.manageText}>Manage Branches</Text>
                </TouchableOpacity>
              </View>
              
              {isRestaurant(user) && user.branches && user.branches.length > 0 ? (
                <View style={styles.branchList}>
                  {user.branches.map((branch, index) => (
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
                    onPress={() => router.push('/restaurant/add-branch')}
                  >
                    <Text style={styles.addBranchText}>Add Branch</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.editButton} 
          onPress={() => router.push('/restaurant/edit-profile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#B22222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    marginBottom: 20,
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
  cuisineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  manageText: {
    fontSize: 14,
    color: '#B22222',
  },
  branchList: {
    marginBottom: 20,
  },
  branchItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  branchDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  branchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  addBranchButton: {
    backgroundColor: '#B22222',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBranchText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
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
});
