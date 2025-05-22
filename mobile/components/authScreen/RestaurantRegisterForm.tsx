import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

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
  showCuisineDropdown?: boolean;
  setShowCuisineDropdown?: Dispatch<SetStateAction<boolean>>;
  showPriceRangeDropdown?: boolean;
  setShowPriceRangeDropdown?: Dispatch<SetStateAction<boolean>>;
  showImagePickerModal?: boolean;
  setShowImagePickerModal?: Dispatch<SetStateAction<boolean>>;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  handleSubmit?: () => void;
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
  showCuisineDropdown,
  setShowCuisineDropdown,
  showPriceRangeDropdown,
  setShowPriceRangeDropdown,
  showImagePickerModal,
  setShowImagePickerModal,
  isAuthenticating,
  setIsAuthenticating,
  handleSubmit,
  onToggleMode
}) => {
  // Local state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(isAuthenticating || false);
  const [error, setError] = useState<string | null>(null);

  // Update local loading state when prop changes
  React.useEffect(() => {
    if (isAuthenticating !== undefined) {
      setIsLoading(isAuthenticating);
    }
  }, [isAuthenticating]);

  // Handle form submission
  const handleRegister = () => {
    // Validate form fields
    if (!restaurantName || !email || !password || !confirmPassword || !restaurantCuisine || !priceRange) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Start loading state and clear any previous errors
    setIsLoading(true);
    if (setIsAuthenticating) {
      setIsAuthenticating(true);
    }
    setError(null);

    // If external submit handler is provided, use it
    if (handleSubmit) {
      handleSubmit();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Registration</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Text style={styles.label}>Restaurant Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter restaurant name"
        value={restaurantName}
        onChangeText={setRestaurantName}
      />
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <Text style={styles.label}>Cuisine</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowCuisineDropdown && setShowCuisineDropdown(true)}
      >
        <Text>{restaurantCuisine || 'Select cuisine'}</Text>
      </TouchableOpacity>
      
      <Text style={styles.label}>Price Range</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowPriceRangeDropdown && setShowPriceRangeDropdown(true)}
      >
        <Text>{priceRange || 'Select price range'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Registering...' : 'Register Restaurant'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchModeButton}
        onPress={onToggleMode}
      >
        <Text style={styles.switchModeText}>Already have an account? Login</Text>
      </TouchableOpacity>
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
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#FF6B00',
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
    color: '#FF6B00',
  },
});

export default RestaurantRegisterForm;