import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, Switch, Image } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/auth-context';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { updateRestaurantProfile } from '../../../api/restaurant';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Restaurant Profile Tab Screen
 * 
 * Displays restaurant profile information and settings
 */
export default function RestaurantProfileScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // Type assertion to tell TypeScript this is a Restaurant type
  // This is safe because this screen is only accessible to restaurant users
  const restaurantUser = user as any;

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoConfirmBookings, setAutoConfirmBookings] = useState(false);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateRestaurantProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantProfile'] });
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Update profile error:', error);
    }
  });

  // Handle profile picture selection
  const handleSelectProfilePicture = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Only pass the specific properties needed for the update
      // instead of the entire user object to avoid type conflicts
      updateProfileMutation.mutate({
        logo: result.assets[0].uri
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login' as any);
          }
        }
      ]
    );
  };

  // Render settings section
  const renderSettingsSection = (title: string, items: any[]) => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item: any, index: number) => (
        <TouchableOpacity 
          key={index}
          style={styles.settingsItem}
          onPress={item.onPress}
        >
          <View style={styles.settingsItemLeft}>
            <Ionicons name={item.icon} size={24} color="#666" />
            <Text style={styles.settingsItemText}>{item.title}</Text>
          </View>
          
          {item.hasSwitch ? (
            <Switch
              value={item.switchValue}
              onValueChange={item.onToggle}
              trackColor={{ false: '#ccc', true: '#FF385C' }}
              thumbColor="#fff"
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleSelectProfilePicture}>
            {restaurantUser?.logo ? (
              <Image 
                source={{ uri: restaurantUser.logo }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Ionicons name="restaurant" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.restaurantName}>
            {restaurantUser?.name || 'Restaurant Name'}
          </Text>
          <Text style={styles.restaurantEmail}>
            {restaurantUser?.email || 'restaurant@example.com'}
          </Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/restaurant/edit-restaurant' as any)}
          >
            <Text style={styles.editProfileText}>Edit Restaurant Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Restaurant Management */}
        {renderSettingsSection('Restaurant Management', [
          {
            icon: 'business',
            title: 'Manage Branches',
            onPress: () => router.push('/restaurant/(tabs)/branches' as any),
          },
          {
            icon: 'restaurant',
            title: 'Manage Menu',
            onPress: () => router.push('/restaurant/manage-menu' as any),
          },
          {
            icon: 'time',
            title: 'Opening Hours',
            onPress: () => router.push('/restaurant/opening-hours' as any),
          },
        ])}
        
        {/* App Settings */}
        {renderSettingsSection('Settings', [
          {
            icon: 'notifications',
            title: 'Notifications',
            hasSwitch: true,
            switchValue: notificationsEnabled,
            onToggle: setNotificationsEnabled,
          },
          {
            icon: 'checkmark-circle',
            title: 'Auto-confirm Bookings',
            hasSwitch: true,
            switchValue: autoConfirmBookings,
            onToggle: setAutoConfirmBookings,
          },
        ])}
        
        {/* Support & About */}
        {renderSettingsSection('Support', [
          {
            icon: 'help-circle',
            title: 'Help Center',
            onPress: () => router.push('/restaurant/help-center' as any),
          },
          {
            icon: 'information-circle',
            title: 'About',
            onPress: () => router.push('/restaurant/about' as any),
          },
          {
            icon: 'shield-checkmark',
            title: 'Privacy Policy',
            onPress: () => router.push('/restaurant/privacy-policy' as any),
          },
        ])}
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#FF385C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF385C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF385C',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  restaurantEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF385C',
  },
  editProfileText: {
    color: '#FF385C',
    fontWeight: '600',
  },
  settingsSection: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF385C',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#999',
    fontSize: 12,
  },
});
