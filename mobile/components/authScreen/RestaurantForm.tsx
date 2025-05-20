import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { restaurantLogin, restaurantRegister } from '../../api/auth';

interface RestaurantFormProps {
  onSuccess?: () => void;
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
}

type RestaurantTabType = 'login' | 'register';

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  onSuccess,
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
  handleSubmit
}) => {
  const [activeTab, setActiveTab] = useState<RestaurantTabType>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [isLoading, setIsLoading] = useState(isAuthenticating || false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    if (handleSubmit) {
      handleSubmit();
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the restaurant login API
      restaurantLogin({ email, password })
        .then(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.replace('/restaurant-dashboard');
          }
        })
        .catch((err) => {
          console.error('Restaurant login error:', err);
          setError('Invalid email or password. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (err) {
      console.error('Restaurant login error:', err);
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (handleSubmit) {
      handleSubmit();
      return;
    }

    if (!restaurantName || !email || !password || !confirmPassword) {
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
      // Call the restaurant register API
      restaurantRegister({
        name: restaurantName,
        email,
        password,
        cuisine: restaurantCuisine || '',
        priceRange: priceRange || '',
        logo: restaurantLogo || ''
      })
        .then(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.replace('/restaurant-dashboard');
          }
        })
        .catch((err) => {
          console.error('Restaurant registration error:', err);
          setError('Registration failed. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (err) {
      console.error('Restaurant registration error:', err);
      setError('Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Mode</Text>
      <Text style={styles.subtitle}>Restaurant mode</Text>
      
      {/* Inner tabs for login/register */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => setActiveTab('login')}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => setActiveTab('register')}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Register</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'login' ? (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your restaurant email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your restaurant name"
            value={restaurantName}
            onChangeText={setRestaurantName}
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
              {isLoading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF385C',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#FF385C',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
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
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF385C',
    marginBottom: 10,
  },
});

export default RestaurantForm;
