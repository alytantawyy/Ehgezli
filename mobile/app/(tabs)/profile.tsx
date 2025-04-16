import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { EhgezliButton } from '@/components/EhgezliButton';
import { Avatar } from '@/components/Avatar';
import { useColorScheme } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { updateUserProfile, getCurrentUser, User } from '@/shared/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, refreshUser, isRestaurant } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  
  // If this is a restaurant user, redirect to restaurant profile
  React.useEffect(() => {
    if (isRestaurant) {
      router.replace('/restaurant-dashboard');
    }
  }, [isRestaurant, router]);
  
  // Type assertion - we know this is a regular user in this tab
  const regularUser = user as User;
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(regularUser?.firstName || '');
  const [lastName, setLastName] = useState(regularUser?.lastName || '');
  const [city, setCity] = useState(regularUser?.city || '');
  const [gender, setGender] = useState(regularUser?.gender || '');
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(regularUser?.favoriteCuisines || []);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: async () => {
      try {
        // Refresh user data after successful update
        await refreshUser();
        setIsEditing(false);
        Alert.alert('Success', 'Your profile has been updated');
      } catch (error) {
        console.error('Failed to refresh user data after update:', error);
      }
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    }
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-outline" size={64} color={Colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: Colors.text }]}>Profile</Text>
          <Text style={[styles.message, { color: Colors.text }]}>
            Please log in to view and edit your profile
          </Text>
          <EhgezliButton 
            title="Log In" 
            variant="ehgezli" 
            onPress={() => {/* Navigate to login */}}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  const handleSaveProfile = () => {
    console.log('Attempting to update profile with:', {
      firstName,
      lastName,
      city,
      gender,
      favoriteCuisines
    });
    
    updateProfileMutation.mutate({
      firstName,
      lastName,
      city,
      gender,
      favoriteCuisines
    });
  };

  const toggleCuisine = (cuisine: string) => {
    if (favoriteCuisines.includes(cuisine)) {
      setFavoriteCuisines(favoriteCuisines.filter(c => c !== cuisine));
    } else {
      setFavoriteCuisines([...favoriteCuisines, cuisine]);
    }
  };

  // List of cuisines from your web app
  const CUISINES = [
    "American",
    "Egyptian",
    "Italian",
    "Japanese",
    "Chinese",
    "Indian",
    "Mexican",
    "French",
    "Thai",
    "Mediterranean",
    "Lebanese",
  ];

  return (
    <ScrollView style={styles.scrollView}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>
        
        <Text style={styles.subtitle}>View and manage your account information</Text>

        <View style={styles.profileCard}>
          {isEditing ? (
            // Edit Mode
            <>
              <View style={styles.welcomeSection}>
                <View style={styles.avatarContainer}>
                  <Avatar 
                    firstName={firstName}
                    lastName={lastName}
                    size={70}
                  />
                  <View style={styles.welcomeTextContainer}>
                    <Text style={styles.welcomeText}>Hi, {firstName}!</Text>
                    <Text style={styles.memberSince}>Member since March 2025</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.rowContainer}>
                <View style={styles.halfFieldSection}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity 
                      style={[styles.cityOption, city === 'Alexandria' && styles.cityOptionSelected]} 
                      onPress={() => setCity('Alexandria')}
                    >
                      <Text style={[styles.cityText, city === 'Alexandria' && styles.cityTextSelected]}>Alexandria</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.cityOption, city === 'Cairo' && styles.cityOptionSelected]} 
                      onPress={() => setCity('Cairo')}
                    >
                      <Text style={[styles.cityText, city === 'Cairo' && styles.cityTextSelected]}>Cairo</Text>
                    </TouchableOpacity>
                    
                  </View>
                </View>
              </View>
              
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Favorite Cuisines</Text>
                <Text style={styles.cuisineHelper}>Select up to 3 of your favorite cuisines to get better restaurant recommendations</Text>
                <View style={styles.cuisinesGrid}>
                  {CUISINES.map((cuisine) => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineOption,
                        favoriteCuisines.includes(cuisine) && styles.cuisineOptionSelected
                      ]}
                      onPress={() => {
                        if (favoriteCuisines.length < 3 || favoriteCuisines.includes(cuisine)) {
                          toggleCuisine(cuisine);
                        }
                      }}
                    >
                      <Text 
                        style={[
                          styles.cuisineOptionText,
                          favoriteCuisines.includes(cuisine) && styles.cuisineOptionTextSelected
                        ]}
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setIsEditing(false);
                    setFirstName(regularUser?.firstName || '');
                    setLastName(regularUser?.lastName || '');
                    setCity(regularUser?.city || '');
                    setGender(regularUser?.gender || '');
                    setFavoriteCuisines(regularUser?.favoriteCuisines || []);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // View Mode
            <>
              <View style={styles.welcomeSection}>
                <View style={styles.avatarContainer}>
                  <Avatar 
                    firstName={regularUser.firstName}
                    lastName={regularUser.lastName}
                    size={70}
                  />
                  <View style={styles.welcomeTextContainer}>
                    <Text style={styles.welcomeText}>Hi, {regularUser.firstName}!</Text>
                    <Text style={styles.memberSince}>Member since March 2025</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Full Name</Text>
                    <Text style={styles.infoValue}>{regularUser.firstName} {regularUser.lastName}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{regularUser.email}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>City</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
                      <Text style={styles.infoValue}>{regularUser.city || 'Not specified'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.cuisineSection}>
                <Text style={styles.cuisineLabel}>Favorite Cuisines</Text>
                <View style={styles.cuisineTagsContainer}>
                  {regularUser.favoriteCuisines && regularUser.favoriteCuisines.length > 0 ? (
                    regularUser.favoriteCuisines.map((cuisine) => (
                      <View key={cuisine} style={styles.cuisineTag}>
                        <Ionicons name="restaurant-outline" size={16} color="#666" style={styles.cuisineIcon} />
                        <Text style={styles.cuisineTagText}>{cuisine}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noCuisinesText}>No favorite cuisines selected</Text>
                  )}
                </View>
              </View>
              
            </>
          )}
        </View>

        
        {!isEditing && (
                <EhgezliButton
                  title="Edit Profile"
                  variant="ehgezli"
                  onPress={() => setIsEditing(true)}
                  style={styles.editProfileButton}
                />
              )}        
              <EhgezliButton
          title="Log Out"
          variant="ehgezli"
          onPress={() => {
            // Use different confirmation approaches based on platform
            if (Platform.OS === 'web') {
              // For web, use the browser's native confirm dialog
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            } else {
              // For native platforms, use React Native's Alert
              Alert.alert(
                'Log Out',
                'Are you sure you want to log out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Log Out', onPress: logout, style: 'destructive' }
                ]
              );
            }
          }}
          style={styles.logoutButton}
        />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  editProfileButton: {
    marginBottom: 12,
    marginTop: 0,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    marginBottom: 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cuisineSection: {
    marginTop: 8,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
  },
  cuisineLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cuisineTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cuisineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cuisineIcon: {
    marginRight: 4,
  },
  cuisineTagText: {
    fontSize: 14,
    color: '#333',
  },
  noCuisinesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  fieldSection: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfFieldSection: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  cuisineHelper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cuisinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  cuisineOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    margin: 4,
    marginBottom: 8,
  },
  cuisineOptionSelected: {
    backgroundColor: '#B91C1C',
  },
  cuisineOptionText: {
    fontSize: 14,
    color: '#333',
  },
  cuisineOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  logoutButton: {
    marginBottom: 40,
  },
  authPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  icon: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  button: {
    minWidth: 150,
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '180%',
  },
  cityOption: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  cityOptionSelected: {
    backgroundColor: '#B91C1C',
  },
  cityText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  cityTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
});
