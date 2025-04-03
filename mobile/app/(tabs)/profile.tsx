import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { EhgezliButton } from '@/components/EhgezliButton';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { TextInput } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { updateUserProfile } from '@/shared/api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [city, setCity] = useState(user?.city || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(user?.favoriteCuisines || []);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    }
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-outline" size={64} color={colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.message, { color: colors.text }]}>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Profile</Text>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={20} color={colors.primary} />
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.profileCard, { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? colors.background : '#fff' }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              {isEditing ? (
                <>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First Name"
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last Name"
                      placeholderTextColor="#999"
                    />
                  </View>
                </>
              ) : (
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user.firstName} {user.lastName}
                </Text>
              )}
              <Text style={[styles.userEmail, { color: colors.text }]}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>City</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Your City"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {user.city || 'Not specified'}
                </Text>
              )}
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Gender</Text>
              {isEditing ? (
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Male' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setGender('Male')}
                  >
                    <Text 
                      style={[
                        styles.genderOptionText, 
                        gender === 'Male' && styles.selectedOptionText
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Female' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setGender('Female')}
                  >
                    <Text 
                      style={[
                        styles.genderOptionText, 
                        gender === 'Female' && styles.selectedOptionText
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Other' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setGender('Other')}
                  >
                    <Text 
                      style={[
                        styles.genderOptionText, 
                        gender === 'Other' && styles.selectedOptionText
                      ]}
                    >
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {user.gender || 'Not specified'}
                </Text>
              )}
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Favorite Cuisines</Text>
              {isEditing ? (
                <View style={styles.cuisinesGrid}>
                  {CUISINES.map((cuisine) => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineOption,
                        favoriteCuisines.includes(cuisine) && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => toggleCuisine(cuisine)}
                    >
                      <Text 
                        style={[
                          styles.cuisineOptionText, 
                          favoriteCuisines.includes(cuisine) && styles.selectedOptionText
                        ]}
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.cuisinesList}>
                  {user.favoriteCuisines && user.favoriteCuisines.length > 0 ? (
                    user.favoriteCuisines.map((cuisine, index) => (
                      <View key={index} style={[styles.cuisineTag, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.cuisineTagText, { color: colors.text }]}>{cuisine}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.detailValue, { color: colors.text }]}>No favorite cuisines selected</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <EhgezliButton
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setIsEditing(false);
                  // Reset form values
                  setFirstName(user.firstName || '');
                  setLastName(user.lastName || '');
                  setCity(user.city || '');
                  setGender(user.gender || '');
                  setFavoriteCuisines(user.favoriteCuisines || []);
                }}
                style={styles.editActionButton}
              />
              <EhgezliButton
                title="Save"
                variant="ehgezli"
                onPress={handleSaveProfile}
                loading={updateProfileMutation.isPending}
                style={styles.editActionButton}
              />
            </View>
          )}
        </View>

        <EhgezliButton
          title="Log Out"
          variant="outline"
          onPress={logout}
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // Add space for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 16,
  },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  profileDetails: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOptions: {
    flexDirection: 'row',
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  genderOptionText: {
    fontSize: 14,
    color: '#333',
  },
  cuisinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  cuisineOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  cuisineOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  cuisinesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  cuisineTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  cuisineTagText: {
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editActionButton: {
    minWidth: 100,
    marginLeft: 8,
  },
  logoutButton: {
    marginBottom: 40,
  },
  authPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    minWidth: 150,
  },
});
