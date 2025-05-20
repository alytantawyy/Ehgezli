import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { register } from '../../api/auth';

interface RegisterFormProps {
  onSuccess?: () => void;
  isLoginMode?: boolean;
  setIsLoginMode?: Dispatch<SetStateAction<boolean>>;
  isRestaurantMode?: boolean;
  setIsRestaurantMode?: Dispatch<SetStateAction<boolean>>;
  isRestaurantLoginMode?: boolean;
  setIsRestaurantLoginMode?: Dispatch<SetStateAction<boolean>>;
  firstName?: string;
  setFirstName?: Dispatch<SetStateAction<string>>;
  lastName?: string;
  setLastName?: Dispatch<SetStateAction<string>>;
  gender?: string;
  setGender?: Dispatch<SetStateAction<string>>;
  birthday?: Date | null;
  setBirthday?: Dispatch<SetStateAction<Date | null>>;
  city?: string;
  setCity?: Dispatch<SetStateAction<string>>;
  cuisines?: string[];
  setCuisines?: Dispatch<SetStateAction<string[]>>;
  availableCuisines?: string[];
  showCityDropdown?: boolean;
  setShowCityDropdown?: Dispatch<SetStateAction<boolean>>;
  showBirthdayPicker?: boolean;
  setShowBirthdayPicker?: Dispatch<SetStateAction<boolean>>;
  datePickerMode?: 'date' | 'time';
  setDatePickerMode?: Dispatch<SetStateAction<'date' | 'time'>>;
  showGenderDropdown?: boolean;
  setShowGenderDropdown?: Dispatch<SetStateAction<boolean>>;
  restaurantAbout?: string;
  setRestaurantAbout?: Dispatch<SetStateAction<string>>;
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
  restaurantLoading?: boolean;
  setRestaurantLoading?: Dispatch<SetStateAction<boolean>>;
  restaurantError?: string | null;
  setRestaurantError?: Dispatch<SetStateAction<string | null>>;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  pickImage?: () => Promise<void>;
  takePhoto?: () => Promise<void>;
  onChangeBirthday?: (event: any, selectedDate?: Date | undefined) => void;
  formatDate?: (date: Date) => string;
  handleSubmit?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess,
  firstName,
  handleSubmit
}) => {
  // Use the existing state if not provided via props
  const [name, setName] = useState(firstName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the handleSubmit prop if provided, otherwise use the default implementation
  const handleRegister = () => {
    if (handleSubmit) {
      handleSubmit();
      return;
    }
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      register({
          firstName: name, lastName: name, email, password,
          phone: '',
          city: '',
          gender: '',
          birthday: '',
          nationality: '',
          favoriteCuisines: []
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF385C',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF385C',
    marginBottom: 10,
  },
});

export default RegisterForm;
