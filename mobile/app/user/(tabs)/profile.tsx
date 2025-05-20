import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Avatar } from '../../../components/common/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/auth-context';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile } from '../../../api/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Profile Tab Screen
 * 
 * Displays user profile information and settings
 */
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
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
      updateProfileMutation.mutate({
        ...user
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
  const renderSettingsSection = (title: string, items: { icon: string; title: string; onPress: () => void }[]) => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
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
            <Avatar size={100} />
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'guest@example.com'}
          </Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/user/edit-profile' as any)}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Settings */}
        {renderSettingsSection('Account', [
          {
            icon: 'person',
            title: 'Personal Information',
            onPress: () => router.push('/user/edit-profile' as any),
          },
          {
            icon: 'heart',
            title: 'Saved Restaurants',
            onPress: () => router.push('/user/saved-restaurants' as any),
          },
          {
            icon: 'card',
            title: 'Payment Methods',
            onPress: () => router.push('/user/payment-methods' as any),
          },
        ])}
        
        {/* App Settings */}
        {renderSettingsSection('Settings', [
          {
            icon: 'notifications',
            title: 'Notifications',
            switchValue: notificationsEnabled,
            onToggle: setNotificationsEnabled,
          },
          {
            icon: 'location',
            title: 'Location Services',
            switchValue: locationEnabled,
            onToggle: setLocationEnabled,
          },
          {
            icon: 'moon',
            title: 'Dark Mode',
            switchValue: darkModeEnabled,
            onToggle: setDarkModeEnabled,
          },
        ])}
        
        {/* Support & About */}
        {renderSettingsSection('Support', [
          {
            icon: 'help-circle',
            title: 'Help Center',
            onPress: () => router.push('/user/help-center' as any),
          },
          {
            icon: 'information-circle',
            title: 'About',
            onPress: () => router.push('/user/about' as any),
          },
          {
            icon: 'shield-checkmark',
            title: 'Privacy Policy',
            onPress: () => router.push('/user/privacy-policy' as any),
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
