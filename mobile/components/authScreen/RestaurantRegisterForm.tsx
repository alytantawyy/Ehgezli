import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import ModalPicker from '../common/ModalPicker';
import * as ImagePicker from 'expo-image-picker';
import { EhgezliButton } from '../common/EhgezliButton';

interface RestaurantRegisterFormProps {
  onSuccess?: () => void;
  restaurantName?: string;
  setRestaurantName?: Dispatch<SetStateAction<string>>;
  restaurantCuisine?: string;
  setRestaurantCuisine?: Dispatch<SetStateAction<string>>;
  priceRange?: string;
  setPriceRange?: Dispatch<SetStateAction<string>>;
  restaurantLogo?: string;
  setRestaurantLogo?: Dispatch<SetStateAction<string>>;
  about?: string;
  setAbout?: Dispatch<SetStateAction<string>>;
  description?: string;
  setDescription?: Dispatch<SetStateAction<string>>;
  showCuisineDropdown?: boolean;
  setShowCuisineDropdown?: Dispatch<SetStateAction<boolean>>;
  showPriceRangeDropdown?: boolean;
  setShowPriceRangeDropdown?: Dispatch<SetStateAction<boolean>>;
  showImagePickerModal?: boolean;
  setShowImagePickerModal?: Dispatch<SetStateAction<boolean>>;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  onFormSubmit?: (formData: any) => void;
  onToggleMode?: () => void;
}

const RestaurantRegisterForm: React.FC<RestaurantRegisterFormProps> = ({
  onSuccess,
  restaurantName,
  setRestaurantName,
  restaurantCuisine,
  setRestaurantCuisine,
  priceRange,
  setPriceRange,
  restaurantLogo,
  setRestaurantLogo,
  about,
  setAbout,
  description,
  setDescription,
  showCuisineDropdown,
  setShowCuisineDropdown,
  showPriceRangeDropdown,
  setShowPriceRangeDropdown,
  showImagePickerModal,
  setShowImagePickerModal,
  isAuthenticating,
  setIsAuthenticating,
  onFormSubmit,
  onToggleMode
}) => {
  // Local state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aboutLocal, setAboutLocal] = useState(about || '');
  const [descriptionLocal, setDescriptionLocal] = useState(description || '');
  const [isLoading, setIsLoading] = useState(isAuthenticating || false);
  const [error, setError] = useState<string | null>(null);

  // Update parent state when local state changes
  useEffect(() => {
    if (setAbout && aboutLocal !== about) {
      setAbout(aboutLocal);
    }
  }, [aboutLocal, about, setAbout]);

  useEffect(() => {
    if (setDescription && descriptionLocal !== description) {
      setDescription(descriptionLocal);
    }
  }, [descriptionLocal, description, setDescription]);

  // Update local loading state when prop changes
  useEffect(() => {
    if (isAuthenticating !== undefined) {
      setIsLoading(isAuthenticating);
    }
  }, [isAuthenticating]);

  // Handle form submission
  const handleRegister = () => {
    console.log('handleRegister called'); // Debug log
    
    // Validate form fields
    if (!restaurantName || !email || !password || !restaurantCuisine || !priceRange || !aboutLocal || !descriptionLocal || !restaurantLogo) {
      console.log('Validation failed:', { restaurantName, email, password, restaurantCuisine, priceRange, aboutLocal, descriptionLocal });
      setError('Please fill in all required fields');
      return;
    }

    // Start loading state and clear any previous errors
    setIsLoading(true);
    if (setIsAuthenticating) {
      setIsAuthenticating(true);
    }
    setError(null);

    // If external submit handler is provided, use it
    if (onFormSubmit) {
      console.log('Submitting registration with data:', {
        restaurantName,
        email,
        password,
        restaurantCuisine,
        priceRange,
        aboutLocal,
        descriptionLocal,
        restaurantLogo,
      });
      onFormSubmit({
        restaurantName,
        email,
        password,
        restaurantCuisine,
        priceRange,
        aboutLocal,
        descriptionLocal,
        restaurantLogo,
      });
    } else {
      console.log('onFormSubmit is not defined');
    }
  };

  // Handle image picking from camera roll
  const pickImage = async () => {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      return;
    }

    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Get the selected asset
      const selectedAsset = result.assets[0];
      
      // Update the logo state with the URI of the selected image
      if (setRestaurantLogo) {
        setRestaurantLogo(selectedAsset.uri);
      }
      
      // Close the modal if it was open
      if (setShowImagePickerModal) {
        setShowImagePickerModal(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Registration</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {/* Restaurant Logo Upload */}
      <View style={styles.logoContainer}>
        <TouchableOpacity 
          style={styles.logoUpload}
          onPress={pickImage}
        >
          {restaurantLogo ? (
            <Image source={{ uri: restaurantLogo }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.logoHelperText}>Tap to upload restaurant logo</Text>
      </View>
      
      <Text style={styles.label}>Restaurant Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter restaurant name"
        placeholderTextColor="#999"
        value={restaurantName}
        onChangeText={setRestaurantName}
      />
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email address"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
        }}
        secureTextEntry
      />
      
      <Text style={styles.label}>Cuisine</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowCuisineDropdown && setShowCuisineDropdown(true)}
      >
        <Text>{restaurantCuisine || 'Select cuisine'}</Text>
         <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showCuisineDropdown && (
        <ModalPicker
          visible={showCuisineDropdown}
          onClose={() => setShowCuisineDropdown && setShowCuisineDropdown(false)}
          title="Select Cuisine"
          options={[
            { label: 'Italian', value: 'Italian' },
            { label: 'Chinese', value: 'Chinese' },
            { label: 'Japanese', value: 'Japanese' },
            { label: 'Mexican', value: 'Mexican' },
            { label: 'Indian', value: 'Indian' },
            { label: 'Thai', value: 'Thai' },
            { label: 'Mediterranean', value: 'Mediterranean' },
            { label: 'American', value: 'American' },
            { label: 'Middle Eastern', value: 'Middle Eastern' },
            { label: 'Seafood', value: 'Seafood' },
            { label: 'Vegetarian', value: 'Vegetarian' },
            { label: 'Steakhouse', value: 'Steakhouse' },
            { label: 'Fast Food', value: 'Fast Food' },
            { label: 'Bakery', value: 'Bakery' },
            { label: 'Other', value: 'Other' }
          ]}
          selectedValue={restaurantCuisine}
          onSelect={(value) => setRestaurantCuisine && setRestaurantCuisine(value)}
        />
      )}

      <Text style={styles.label}>About</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter about"
        placeholderTextColor="#999"
        value={aboutLocal}
        onChangeText={setAboutLocal}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter description"
        placeholderTextColor="#999"
        value={descriptionLocal}
        onChangeText={setDescriptionLocal}
      />
      
      <Text style={styles.label}>Price Range</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowPriceRangeDropdown && setShowPriceRangeDropdown(true)}
      >
        <Text>{priceRange || 'Select price range'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showPriceRangeDropdown && (
        <ModalPicker
          visible={showPriceRangeDropdown}
          onClose={() => setShowPriceRangeDropdown && setShowPriceRangeDropdown(false)}
          title="Select Price Range"
          options={[
            { label: '$', value: '$' },
            { label: '$$', value: '$$' },
            { label: '$$$', value: '$$$' },
            { label: '$$$$', value: '$$$$' },
          ]}
          selectedValue={priceRange}
          onSelect={(value) => setPriceRange && setPriceRange(value)}
        />
      )}
      
      <EhgezliButton
              title="Register"
              onPress={handleRegister}
              disabled={isLoading}
              loading={isLoading}
              variant="ehgezli"
              size="md"
              style={styles.buttonContainer}
            />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  dropdownArrow: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  button: {
    backgroundColor: '#B01C2E',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#B01C2E',
    fontSize: 16,
  },
  logoContainer: {
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    backgroundColor: '#B01C2E',
  },
  logoUpload: {
    height: 100,
    width: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    height: 100,
    width: 100,
    borderRadius: 8,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    height: 100,
    width: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  logoPlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  logoHelperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default RestaurantRegisterForm;