import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthTabs from '../../components/authScreen/AuthTabs';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import * as ImagePicker from 'expo-image-picker';
import { restaurantRegister } from '../../api/auth';

const { height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const [isRestaurantMode, setIsRestaurantMode] = React.useState(false);
  const [isRestaurantLoginMode, setIsRestaurantLoginMode] = React.useState(true); // For restaurant login/register toggle
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [birthday, setBirthday] = React.useState<Date | null>(null);
  const [city, setCity] = React.useState('');
  const [cuisines, setCuisines] = React.useState<string[]>([]);
  const [availableCuisines] = React.useState([
    'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'French', 
    'Thai', 'Mediterranean', 'American', 'Middle Eastern', 'Greek', 
    'Spanish', 'Korean', 'Vietnamese', 'Turkish', 'Egyptian'
  ]);
  const [showCityDropdown, setShowCityDropdown] = React.useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = React.useState(false);
  const [restaurantCuisine, setRestaurantCuisine] = React.useState('');
  const [priceRange, setPriceRange] = React.useState('');
  const [restaurantLogo, setRestaurantLogo] = React.useState('');
  const [showCuisineDropdown, setShowCuisineDropdown] = React.useState(false);
  const [showPriceRangeDropdown, setShowPriceRangeDropdown] = React.useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = React.useState(false);
  const [restaurantLoading, setRestaurantLoading] = React.useState(false);
  const [restaurantError, setRestaurantError] = React.useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  
  const { login, register, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const onChangeBirthday = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || birthday;
    setShowBirthdayPicker(Platform.OS === 'ios');
    setBirthday(currentDate);
  };

  const formatBirthdayForAPI = () => {
    return birthday ? birthday.toISOString() : '';
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select a date';
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    try {
      setIsAuthenticating(true);
      
      if (isRestaurantMode) {
        // Clear any previous errors
        setRestaurantError(null);
        
        // Handle restaurant authentication
        if (isRestaurantLoginMode) {
          // Restaurant login
          console.log('Restaurant login with:', email, password);
          setRestaurantLoading(true);
          try {
            // First clear any existing auth state
            await restaurantRegister({
              name: firstName,
              email,
              password,
              cuisine: restaurantCuisine,
              priceRange,
              logo: restaurantLogo
            });
            console.log('Restaurant login successful, navigating to dashboard');
            // Wait a moment before navigation to ensure auth state is updated
            setTimeout(() => {
              router.replace('/restaurant-dashboard' as any);
              setIsAuthenticating(false); // Reset auth state after navigation
            }, 500);
          } catch (err: any) {
            setRestaurantError(err.message || 'Login failed. Please try again.');
            setIsAuthenticating(false);
            return;
          } finally {
            setRestaurantLoading(false);
          }
        } else {
          // Restaurant registration
          console.log('Restaurant registration with:', firstName, email, password, restaurantCuisine, priceRange, restaurantLogo);
          
          // Validate form
          if (!firstName || !email || !password) {
            setRestaurantError('Please fill in all required fields');
            setIsAuthenticating(false);
            return;
          }
          
          setRestaurantLoading(true);
          try {
            await restaurantRegister({
              name: firstName,
              email,
              password,
              cuisine: restaurantCuisine,
              priceRange,
              logo: restaurantLogo
            });
            console.log('About to navigate to restaurant dashboard after registration');
            router.replace('/restaurant-dashboard');
            setIsAuthenticating(false); // Reset auth state after navigation
          } catch (err: any) {
            setRestaurantError(err.message || 'Registration failed. Please try again.');
            setIsAuthenticating(false);
            return;
          } finally {
            setRestaurantLoading(false);
          }
        }
      } else if (isLoginMode) {
        try {
          console.log('User login with:', email, password);
          await login(email, password);
          console.log('User login successful, navigating to tabs');
          // Wait a moment before navigation to ensure auth state is updated
          setTimeout(() => {
            router.replace('/(tabs)' as any);
            setIsAuthenticating(false); // Reset auth state after navigation
          }, 500);
        } catch (err: any) {
          Alert.alert('Login Failed', err.message || 'Invalid credentials');
          setIsAuthenticating(false);
          return;
        }
      } else {
        // Validate form
        if (!firstName || !lastName || !email || !password || !gender || !birthday || !city || cuisines.length === 0) {
          Alert.alert('Error', 'Please fill in all fields');
          setIsAuthenticating(false);
          return;
        }
        
        // Register user
        try {
          const userData = await register({
            firstName,
            lastName,
            email,
            password,
            gender,
            birthday: formatBirthdayForAPI(),
            city,
            cuisines,
          });
          console.log('User registration successful, navigating to tabs');
          // Wait a moment before navigation
          setTimeout(() => {
            router.replace('/(tabs)' as any);
            setIsAuthenticating(false); // Reset auth state after navigation
          }, 500);
        } catch (err: any) {
          Alert.alert('Registration Failed', err.message || 'Registration failed. Please try again.');
          setIsAuthenticating(false);
          return;
        }
      }
    } catch (err: any) {
      // Error is already set in the auth context
      // We don't need to log the error here since it's already logged in the API client
      // Just handle any additional UI feedback if needed
      
      // Optional: Add specific UI feedback based on error type
      if (err.type === 'network_error') {
        // Could show a network status indicator
      }
      setIsAuthenticating(false);
    }
  };

  const toggleMode = (mode: 'login' | 'register' | 'restaurant') => {
    clearError();
    setIsLoginMode(mode === 'login');
    setIsRestaurantMode(mode === 'restaurant');
  };

  const toggleRestaurantLoginRegister = (isLogin: boolean) => {
    clearError();
    setIsRestaurantLoginMode(isLogin);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setRestaurantLogo(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setRestaurantLogo(result.assets[0].uri);
    }
  };

  const handleLoginSuccess = () => {
    router.replace('/(tabs)');
  };

  const handleRegisterSuccess = () => {
    router.replace('/(tabs)');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={isWeb ? styles.webContainer : styles.mobileContainer}>
            <View style={styles.imageSection}>
              <ImageBackground
                source={require('../assets/images/restaurant-background.jpg')}
                style={styles.imageBackground}
                resizeMode="cover"
              >
                <View style={styles.imageOverlay}>
                  <Text style={styles.logoOnImage}>Ehgezli</Text>
                  <Text style={styles.taglineOnImage}>Find and book the best restaurants</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.formSection}>
              <View style={styles.header}>
                <Text style={styles.logo}>Ehgezli</Text>
                <Text style={styles.tagline}>Find and book the best restaurants</Text>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.welcomeText}>Welcome</Text>
                <Text style={styles.subtitle}>Sign in or create an account</Text>

                <AuthTabs
                  firstName={firstName}
                  setFirstName={setFirstName}
                  gender={gender}
                  setGender={setGender}
                  city={city}
                  setCity={setCity}
                  cuisines={cuisines}
                  setCuisines={setCuisines}
                  availableCuisines={availableCuisines}
                  showCityDropdown={showCityDropdown}
                  setShowCityDropdown={setShowCityDropdown}
                  showGenderDropdown={showGenderDropdown}
                  setShowGenderDropdown={setShowGenderDropdown}
                  showCuisineDropdown={showCuisineDropdown}
                  setShowCuisineDropdown={setShowCuisineDropdown}
                  showImagePickerModal={showImagePickerModal}
                  setShowImagePickerModal={setShowImagePickerModal}
                  isAuthenticating={isAuthenticating}
                  setIsAuthenticating={setIsAuthenticating}
                  onLoginSuccess={handleLoginSuccess}
                  onRegisterSuccess={handleRegisterSuccess}
                  onForgotPassword={handleForgotPassword}
                  handleSubmit={handleSubmit}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: height,
  },
  mobileContainer: {
    flex: 1,
  },
  imageSection: {
    flex: isWeb ? 1 : undefined,
    height: isWeb ? '100%' : height * 0.3,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoOnImage: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  taglineOnImage: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formSection: {
    flex: isWeb ? 1 : undefined,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    display: isWeb ? 'none' : 'flex',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF385C',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  welcomeText: {
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
});
function setShowBirthdayPicker(arg0: boolean) {
  throw new Error('Function not implemented.');
}
