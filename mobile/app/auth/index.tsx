/**
 * Authentication Screen (index.tsx)
 * 
 * This is the main authentication screen for the Ehgezli app.
 * It handles user login, registration, and restaurant owner authentication.
 * The screen uses a tabbed interface to switch between different auth modes.
 */
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthTabs from '../../components/authScreen/AuthTabs';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { AuthRoute, UserRoute, RestaurantRoute } from '../../types/navigation';
import { CUISINE_OPTIONS } from '../../constants/FilterOptions';

// Get screen dimensions for responsive layout
const { height } = Dimensions.get('window');
// Check if running on web platform for conditional rendering
const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  // ===== STATE MANAGEMENT =====
  // Authentication mode - single state to track all auth flows
  const [authMode, setAuthMode] = React.useState<'userLogin' | 'userRegister' | 'restaurantLogin' | 'restaurantRegister'>('userLogin');
  
  // Loading and error states
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  
  // User profile information for registration
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [birthday, setBirthday] = React.useState<Date | null>(null);
  const [city, setCity] = React.useState('');
  const [nationality, setNationality] = React.useState('');
  const [cuisines, setCuisines] = React.useState<string[]>([]);
  
  // Available cuisine options for user preferences
  const [availableCuisines] = React.useState(CUISINE_OPTIONS);
  
  // Restaurant profile information for registration
  const [restaurantCuisine, setRestaurantCuisine] = React.useState('');
  const [restaurantName, setRestaurantName] = React.useState('');
  const [priceRange, setPriceRange] = React.useState('');
  const [restaurantLogo, setRestaurantLogo] = React.useState('');
  
  // UI state for dropdowns and modals
  const [showCityDropdown, setShowCityDropdown] = React.useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = React.useState(false);
  const [showCuisineDropdown, setShowCuisineDropdown] = React.useState(false);
  const [showPriceRangeDropdown, setShowPriceRangeDropdown] = React.useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = React.useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = React.useState(false);
  const [showBirthdayPicker, setShowBirthdayPicker] = React.useState(false);

  
  /**
   * Handle successful login
   * Redirects user to the main tabs screen
   */
    const handleLoginSuccess = () => {
      router.replace(UserRoute.tabs as any);
    };
  
    /**
     * Handle successful registration
     * Redirects user to the main tabs screen
     */
    const handleRegisterSuccess = () => {
      console.log('Registration successful, navigating to user tabs...');
      // Add a small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        router.replace(UserRoute.tabs as any);
      }, 1500); // Increased delay to give more time for auth state to update
    };
  
    /**
     * Handle successful restaurant login
     * Redirects restaurant owner to the restaurant dashboard
     */
    const handleRestaurantLoginSuccess = () => {
      router.replace(RestaurantRoute.tabs as any);
    };
  
    /**
     * Handle successful restaurant registration
     * Redirects restaurant owner to the restaurant dashboard
     */
    const handleRestaurantRegisterSuccess = () => {
      console.log('Restaurant registration success, redirecting to restaurant tabs');
      // Force a small delay to ensure state is updated before navigation
      setTimeout(() => {
        router.replace(RestaurantRoute.tabs as any);
      }, 100);
    };
  
    /**
     * Navigate to forgot password screen
     */
    const handleForgotPassword = () => {
      router.push(AuthRoute.forgotPassword as any);
    };
  
    const handleRestaurantForgotPassword = () => {
      router.push(AuthRoute.forgotPassword as any);
    };

  /**
   * Handle tab changes in the AuthTabs component
   * @param tab - The tab that was selected
   */
  const handleTabChange = (tab: 'login' | 'register' | 'restaurant') => {
    if (tab === 'login') {
      setAuthMode('userLogin');
    } else if (tab === 'register') {
      setAuthMode('userRegister');
    } else if (tab === 'restaurant') {
      // Default to restaurant login when restaurant tab is selected
      setAuthMode('restaurantLogin');
    }
  };

  /**
   * Toggle between restaurant login and registration modes
   * @param isLogin - Whether to show login (true) or registration (false)
   */
  const handleRestaurantModeToggle = (isLogin: boolean) => {
    setAuthMode(isLogin ? 'restaurantLogin' : 'restaurantRegister');
  };

  // Group related state variables into logical objects for better organization
  const userProfile = {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phoneNumber,
    setPhoneNumber,
    gender,
    setGender,
    birthday,
    setBirthday,              
    city,
    setCity,
    nationality,
    setNationality,
    cuisines,
    setCuisines,
    availableCuisines,
  };

  const restaurantProfile = {
    restaurantCuisine,
    setRestaurantCuisine,
    restaurantName,
    setRestaurantName,
    priceRange,
    setPriceRange,
    restaurantLogo,
    setRestaurantLogo,
  };

  const uiState = {
    showCityDropdown,
    setShowCityDropdown,
    showGenderDropdown,
    setShowGenderDropdown,
    showCuisineDropdown,
    setShowCuisineDropdown,
    showPriceRangeDropdown,    
    setShowPriceRangeDropdown,
    showImagePickerModal,
    setShowImagePickerModal,
    showBirthdayPicker,
    setShowBirthdayPicker,
    showNationalityDropdown,
    setShowNationalityDropdown,
  };

  const authState = {
    isAuthenticating,
    setIsAuthenticating,
  };

  // Hooks for authentication and navigation
  const { login, register, restaurantLogin, restaurantRegister } = useAuth();
  const router = useRouter();

  /**
   * Handle login form submission
   */
  const handleSubmit = async (formData?: any) => {
    // Set loading state
    setIsAuthenticating(true);
    
    try {
      if (authMode === 'userLogin') {
        // Handle user login
        if (!formData?.email || !formData?.password) {
          console.error('Empty credentials in handleLogin:', { email: formData?.email || '', password: formData?.password ? '****' : '' });
          throw new Error('Email and password are required');
        }
        
        // Call login API
        await login(formData.email, formData.password);
        handleLoginSuccess();
      } else if (authMode === 'userRegister') {
        // Handle user registration
        // Use the formData passed from RegisterForm instead of component state
        if (!formData) {
          throw new Error('Registration data is required');
        }
        
        console.log('Registration data received in auth/index.tsx:', formData);
        
        // Ensure all required fields are present
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone) {
          console.error('Missing required fields in registration data');
          throw new Error('All required fields must be filled');
        }
        
        try {
          // Call register API with the form data
          await register(formData);
          // If registration is successful, redirect to user dashboard
          handleRegisterSuccess();
        } catch (registrationError) {
          console.error('Registration error:', registrationError);
          // Show error to user but don't throw, so we can still handle cleanup
          // You could add a state variable for registration error and display it in the UI
        }
      } else if (authMode === 'restaurantLogin') {
        // Handle restaurant login
        await restaurantLogin(formData.email, formData.password);
        handleRestaurantLoginSuccess();
      } else if (authMode === 'restaurantRegister') {
        // Handle restaurant registration
        handleRestaurantRegister(formData);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Set error state (you could add this to your state management)
      // setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Handle restaurant registration form submission
   */
  const handleRestaurantRegister = async (formData: any) => {
    console.log('Handling restaurant registration with data:', formData);
    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.restaurantName || 
          !formData.restaurantCuisine || !formData.priceRange || 
          !formData.restaurantLogo || !formData.aboutLocal || !formData.descriptionLocal) {
        throw new Error('All required fields must be filled');
      }
      
      // Prepare the data for API
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.restaurantName,
        cuisine: formData.restaurantCuisine,
        priceRange: formData.priceRange,
        logo: formData.restaurantLogo,
        about: formData.aboutLocal,
        description: formData.descriptionLocal
      };
      
      console.log('Submitting restaurant registration with data:', registrationData);
      await restaurantRegister(registrationData);
      
      // Add a delay to ensure state updates before navigation
      setTimeout(() => {
        console.log('Restaurant registration successful, navigating to dashboard');
        handleRestaurantRegisterSuccess();
      }, 300);
    } catch (error) {
      console.error('Restaurant registration error:', error);
      setIsAuthenticating(false);
      // You could add error handling UI here
    }
  };

  // Complete authCallbacks object with all handlers
  const authCallbacks = {
    onLoginSuccess: handleLoginSuccess,
    onRegisterSuccess: handleRegisterSuccess,
    onRestaurantLogin: handleRestaurantLoginSuccess,
    onRestaurantRegister: handleRestaurantRegisterSuccess,
    onForgotPassword: handleForgotPassword,
    onRestaurantForgotPassword: handleRestaurantForgotPassword,
    onFormSubmit: handleSubmit,  // Renamed for consistency
    onTabChange: handleTabChange,
    isRestaurantLoginMode: authMode === 'restaurantLogin',
    onRestaurantModeToggle: handleRestaurantModeToggle
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {/* KeyboardAvoidingView adjusts layout when keyboard appears */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main container with different layouts for web and mobile */}
          <View style={isWeb ? styles.webContainer : styles.mobileContainer}>
            {/* Left side image section (full width on mobile, half width on web) */}
            <View style={styles.imageSection}>
              <ImageBackground
                source={require('../../assets/images/food.jpeg')}
                style={styles.imageBackground}
                resizeMode="cover"
                imageStyle={{ opacity: 0.9 }} // Slightly adjust image opacity
              >
                <View style={styles.imageOverlay}>
                  <Text style={styles.logoOnImage}>Ehgezli</Text>
                  <Text style={styles.taglineOnImage}>Find and book the best restaurants</Text>
                </View>
              </ImageBackground>
            </View>

            {/* Right side form section (full width on mobile, half width on web) */}
            <View style={styles.formSection}>

              {/* Form container with welcome text and AuthTabs component */}
              <View style={styles.formContainer}>

                {/* AuthTabs component handles all the form UI and tab switching */}
                <AuthTabs
                  initialTab={authMode === 'userLogin' ? 'login' : authMode === 'userRegister' ? 'register' : 'restaurant'}
                  userProfile={userProfile}
                  restaurantProfile={restaurantProfile}
                  uiState={uiState}
                  authState={authState}
                  authCallbacks={authCallbacks}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**l
 * Styles for the authentication screen
 * Includes responsive layouts for both web and mobile platforms
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
  },
  // Web-specific container with side-by-side layout
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: height,
  },
  // Mobile-specific container with stacked layout
  mobileContainer: {
    flex: 1,
  },
  // Image section styling
  imageSection: {
    flex: isWeb ? 1 : undefined,
    height: isWeb ? '100%' : height * 0.3, // Reduce height on mobile
    overflow: 'hidden', // Prevent image from overflowing
    justifyContent: 'center',
    alignItems: 'center', 
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Ensure full width
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)', // Slightly darker overlay for better contrast
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Add padding for text content
  },
  logoOnImage: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15, // Slightly more spacing
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Add text shadow for better readability
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  taglineOnImage: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Add text shadow for better readability
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  // Form section styling
  formSection: {
    flex: isWeb ? 1 : undefined,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    display: isWeb ? 'none' : 'flex', // Hide on web, show on mobile
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF385C',
    marginBottom: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
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

/**
 * Function to show/hide the birthday picker
 * Note: This function is not implemented in the current code
 * and should be properly defined to handle the birthday picker UI
 */
function setShowBirthdayPicker(arg0: boolean) {
  throw new Error('Function not implemented.');
}
