import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar } from '../../../components/common/Avatar';
import { useAuth } from '../../../hooks/useAuth';
import { User } from '../../../types/user';
import { format } from 'date-fns'; 
import { AuthRoute } from '../../../types/navigation';

/**
 * Profile Tab Screen
 * 
 * Displays user profile information and settings
 */
export default function ProfileScreen() {
  const { user, userType, logout } = useAuth();
  
  // Check if the user is a regular user (not a restaurant)
  const isRegularUser = userType === 'user';
  
  // Type guard function to check if user is a User type
  const isUserType = (user: any): user is User => {
    return user && 'firstName' in user;
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.replace(AuthRoute.login);
  };

  // Handle edit profile
  const handleEditProfile = () => {
    // Navigate to edit profile screen
    // This would be implemented in a future update
    console.log('Navigate to edit profile');
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
              <View style={styles.cuisineItem}>
                <Ionicons name="restaurant-outline" size={16} color="#666" style={styles.cuisineIcon} />
                <Text style={styles.cuisineName}>{user.favoriteCuisines?.[0]}</Text>
              </View>
              <View style={styles.cuisineItem}>
                <Ionicons name="restaurant-outline" size={16} color="#666" style={styles.cuisineIcon} />
                <Text style={styles.cuisineName}>{user.favoriteCuisines?.[1]}</Text>
              </View>
              <View style={styles.cuisineItem}>
                <Ionicons name="restaurant-outline" size={16} color="#666" style={styles.cuisineIcon} />
                <Text style={styles.cuisineName}>{user.favoriteCuisines?.[2]}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
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
});
