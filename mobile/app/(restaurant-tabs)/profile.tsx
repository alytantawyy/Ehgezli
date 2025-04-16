import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { getCurrentRestaurant } from '../../shared/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function RestaurantProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [logo, setLogo] = useState('');
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const [showPriceRangeDropdown, setShowPriceRangeDropdown] = useState(false);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setIsLoading(true);
        const data = await getCurrentRestaurant();
        
        if (!data) {
          console.log('No restaurant data found, redirecting to login');
          router.replace('/login');
          return;
        }
        
        console.log('Restaurant data:', data);
        setRestaurant(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setAbout(data.about || '');
        setCuisine(data.cuisine || '');
        setPriceRange(data.priceRange || '');
        setLogo(data.logo || '');
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        Alert.alert('Error', 'Failed to load restaurant profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, []);

  // Mock update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      // This would be replaced with an actual API call
      console.log('Updating restaurant profile with:', profileData);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...restaurant, ...profileData };
    },
    onSuccess: (data) => {
      setRestaurant(data);
      setIsEditing(false);
      Alert.alert('Success', 'Your restaurant profile has been updated');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update restaurant profile');
    }
  });

  const handleLogout = () => {
    // Clear auth token and navigate to login
    router.replace('/login');
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      name,
      email,
      about,
      cuisine,
      priceRange,
      logo
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.tint} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Restaurant Profile</Text>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setIsEditing(!isEditing)}
              >
                <Ionicons name="pencil" size={24} color="#B41E1E" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.subtitle}>Manage your restaurant information</Text>
            
            <View style={styles.profileCard}>
              <View style={styles.logoContainer}>
                {logo ? (
                  <Image 
                    source={{ uri: logo }} 
                    style={styles.logo} 
                    onError={() => {
                      console.log('Error loading logo image');
                      setLogo('');
                    }}
                  />
                ) : (
                  <View style={styles.placeholderLogo}>
                    <Text style={styles.placeholderText}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                
                {isEditing && (
                  <TouchableOpacity 
                    style={styles.changeLogo}
                    onPress={pickImage}
                  >
                    <Text style={styles.changeLogoText}>Change Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Restaurant Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Restaurant Name"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{name}</Text>
                )}
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{email}</Text>
                )}
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>About</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={about}
                    onChangeText={setAbout}
                    placeholder="About your restaurant"
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{about || 'No description provided'}</Text>
                )}
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Cuisine</Text>
                {isEditing ? (
                  <View>
                    <TouchableOpacity 
                      style={styles.dropdown}
                      onPress={() => setShowCuisineDropdown(!showCuisineDropdown)}
                    >
                      <Text style={styles.dropdownText}>{cuisine || 'Select Cuisine'}</Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    
                    {showCuisineDropdown && (
                      <View style={styles.dropdownMenu}>
                        {['Italian', 'Japanese', 'Chinese', 'Indian', 'American', 'Middle Eastern', 'Egyptian'].map((item) => (
                          <TouchableOpacity 
                            key={item} 
                            style={styles.dropdownItem}
                            onPress={() => {
                              setCuisine(item);
                              setShowCuisineDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>{cuisine || 'Not specified'}</Text>
                )}
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Price Range</Text>
                {isEditing ? (
                  <View>
                    <TouchableOpacity 
                      style={styles.dropdown}
                      onPress={() => setShowPriceRangeDropdown(!showPriceRangeDropdown)}
                    >
                      <Text style={styles.dropdownText}>{priceRange || 'Select Price Range'}</Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    
                    {showPriceRangeDropdown && (
                      <View style={styles.dropdownMenu}>
                        {['$', '$$', '$$$', '$$$$'].map((item) => (
                          <TouchableOpacity 
                            key={item} 
                            style={styles.dropdownItem}
                            onPress={() => {
                              setPriceRange(item);
                              setShowPriceRangeDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>{priceRange || 'Not specified'}</Text>
                )}
              </View>

              {restaurant?.branches && restaurant.branches.length > 0 && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Branches</Text>
                  <View style={styles.branchList}>
                    {restaurant.branches.map((branch: { id: any; address: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; city: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; openingTime: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; closingTime: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }, index: any) => (
                      <View key={branch.id || index} style={styles.branchItem}>
                        <Text style={styles.branchName}>{branch.address}</Text>
                        <Text style={styles.branchDetail}>{branch.city}</Text>
                        {branch.openingTime && branch.closingTime && (
                          <Text style={styles.branchHours}>
                            {branch.openingTime} - {branch.closingTime}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            
            {isEditing && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    // Reset form values
                    setName(restaurant?.name || '');
                    setEmail(restaurant?.email || '');
                    setAbout(restaurant?.about || '');
                    setCuisine(restaurant?.cuisine || '');
                    setPriceRange(restaurant?.priceRange || '');
                    setLogo(restaurant?.logo || '');
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Logout', 
                      style: 'destructive',
                      onPress: handleLogout 
                    }
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.tint,
  },
  editButton: {
    padding: 8,
  },
  subtitle: {
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
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  placeholderLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: '#666',
  },
  changeLogo: {
    marginTop: 10,
  },
  changeLogoText: {
    color: '#B41E1E',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownMenu: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tint,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  branchList: {
    marginTop: 8,
  },
  branchItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#B41E1E',
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  branchDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  branchHours: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
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
});
