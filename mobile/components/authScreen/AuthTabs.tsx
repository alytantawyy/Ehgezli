/**
 * AuthTabs.tsx
 * 
 * This component provides a tabbed interface for authentication in the Ehgezli app.
 * It manages three main tabs: Login, Register, and Restaurant, each rendering a different form component.
 * The component acts as a container that coordinates between these different authentication methods
 * and passes the necessary props to each child component.
 */
import React, { useState, Dispatch, SetStateAction } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import RestaurantForm from './RestaurantForm';

/**
 * Defines the possible tab types that can be active at any given time.
 * - 'login': For regular user login
 * - 'register': For new user registration
 * - 'restaurant': For restaurant owner login/registration
 */
type TabType = 'login' | 'register' | 'restaurant';

/**
 * Interface defining all props that can be passed to the AuthTabs component.
 * This extensive list of props allows for highly customizable behavior and state management.
 */
interface AuthTabsProps {
  // Core tab functionality props
  initialTab?: TabType;                                 // Which tab should be active initially
  onLoginSuccess?: () => void;                          // Callback for successful login
  onRegisterSuccess?: () => void;                       // Callback for successful registration
  onForgotPassword?: () => void;                        // Callback for forgot password action
  onRestaurantLogin?: () => void;                       // Callback for successful restaurant login
  
  // User profile props passed from login.tsx
  firstName?: string;                                   // User's first name
  setFirstName?: Dispatch<SetStateAction<string>>;      // Setter for firstName
  gender?: string;                                      // User's gender
  setGender?: Dispatch<SetStateAction<string>>;         // Setter for gender
  city?: string;                                        // User's city
  setCity?: Dispatch<SetStateAction<string>>;           // Setter for city
  cuisines?: string[];                                  // User's favorite cuisines
  setCuisines?: Dispatch<SetStateAction<string[]>>;     // Setter for cuisines
  availableCuisines?: string[];                         // List of available cuisine options
  
  // UI control props
  showCityDropdown?: boolean;                           // Whether to show city dropdown
  setShowCityDropdown?: Dispatch<SetStateAction<boolean>>; // Setter for showCityDropdown
  datePickerMode?: 'date' | 'time';                     // Mode for date picker
  setDatePickerMode?: Dispatch<SetStateAction<'date' | 'time'>>; // Setter for datePickerMode
  showGenderDropdown?: boolean;                         // Whether to show gender dropdown
  setShowGenderDropdown?: Dispatch<SetStateAction<boolean>>; // Setter for showGenderDropdown
  
  // Restaurant-specific props
  restaurantCuisine?: string;                           // Restaurant cuisine type
  setRestaurantCuisine?: Dispatch<SetStateAction<string>>; // Setter for restaurantCuisine
  priceRange?: string;                                  // Restaurant price range
  setPriceRange?: Dispatch<SetStateAction<string>>;     // Setter for priceRange
  restaurantLogo?: string;                              // Restaurant logo URL
  setRestaurantLogo?: Dispatch<SetStateAction<string>>; // Setter for restaurantLogo
  showCuisineDropdown?: boolean;                        // Whether to show cuisine dropdown
  setShowCuisineDropdown?: Dispatch<SetStateAction<boolean>>; // Setter for showCuisineDropdown
  showPriceRangeDropdown?: boolean;                     // Whether to show price range dropdown
  setShowPriceRangeDropdown?: Dispatch<SetStateAction<boolean>>; // Setter for showPriceRangeDropdown
  showImagePickerModal?: boolean;                       // Whether to show image picker modal
  setShowImagePickerModal?: Dispatch<SetStateAction<boolean>>; // Setter for showImagePickerModal
  
  // Authentication state props
  isAuthenticating?: boolean;                           // Whether authentication is in progress
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>; // Setter for isAuthenticating
  
  // Form submission handler
  handleSubmit?: () => void;                            // Custom submit handler for forms
}

/**
 * AuthTabs Component
 * 
 * This component renders a tabbed interface for authentication with three tabs:
 * 1. Login - For existing users to log in
 * 2. Register - For new users to create an account
 * 3. Restaurant - For restaurant owners to log in or register
 * 
 * The component maintains its own state for which tab is active and renders
 * the appropriate form component based on that state.
 */
const AuthTabs: React.FC<AuthTabsProps> = ({
  // Destructure all props with default value for initialTab
  initialTab = 'login',
  onLoginSuccess,
  onRegisterSuccess,
  onForgotPassword,
  onRestaurantLogin,
  firstName,
  setFirstName,
  city,
  setCity,
  cuisines,
  setCuisines,
  availableCuisines,
  showCityDropdown,
  setShowCityDropdown,
  datePickerMode,
  setDatePickerMode,
  showGenderDropdown,
  setShowGenderDropdown,
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
}) => {
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  return (
    <View style={styles.container}>
      {/* Tab navigation buttons */}
      <View style={styles.tabsContainer}>
        {/* Login Tab Button */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]} // Apply active styling conditionally
          onPress={() => setActiveTab('login')} // Change active tab on press
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
            Login
          </Text>
        </TouchableOpacity>
        
        {/* Register Tab Button */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => setActiveTab('register')}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
            Register
          </Text>
        </TouchableOpacity>
        
        {/* Restaurant Tab Button */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'restaurant' && styles.activeTab]}
          onPress={() => setActiveTab('restaurant')}
        >
          <Text style={[styles.tabText, activeTab === 'restaurant' && styles.activeTabText]}>
            Restaurant
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form container - renders different form based on active tab */}
      <View style={styles.formContainer}>
        {/* Conditional rendering based on activeTab state */}
        {activeTab === 'login' ? (
          // Login Form - shown when activeTab is 'login'
          <LoginForm 
            onSuccess={onLoginSuccess} // Callback for successful login
            onForgotPassword={onForgotPassword} // Callback for forgot password
            // Pass down all relevant props for the login form
            firstName={firstName}
            setFirstName={setFirstName}
            city={city}
            setCity={setCity}
            cuisines={cuisines}
            setCuisines={setCuisines}
            availableCuisines={availableCuisines}
            showCityDropdown={showCityDropdown}
            setShowCityDropdown={setShowCityDropdown}
            datePickerMode={datePickerMode}
            setDatePickerMode={setDatePickerMode}
            showGenderDropdown={showGenderDropdown}
            setShowGenderDropdown={setShowGenderDropdown}
            showCuisineDropdown={showCuisineDropdown}
            setShowCuisineDropdown={setShowCuisineDropdown}
            showImagePickerModal={showImagePickerModal}
            setShowImagePickerModal={setShowImagePickerModal}
            isAuthenticating={isAuthenticating}
            setIsAuthenticating={setIsAuthenticating}
            handleSubmit={handleSubmit} // Custom submit handler if provided
          />
        ) : activeTab === 'register' ? (
          // Register Form - shown when activeTab is 'register'
          <RegisterForm 
            onSuccess={onRegisterSuccess} // Callback for successful registration
            // Pass down all relevant props for the register form
            firstName={firstName}
            availableCuisines={availableCuisines}
            datePickerMode={datePickerMode}
            setDatePickerMode={setDatePickerMode}
            showGenderDropdown={showGenderDropdown}
            setShowGenderDropdown={setShowGenderDropdown}
            showCuisineDropdown={showCuisineDropdown}
            setShowCuisineDropdown={setShowCuisineDropdown}
            showImagePickerModal={showImagePickerModal}
            setShowImagePickerModal={setShowImagePickerModal}
            isAuthenticating={isAuthenticating}
            setIsAuthenticating={setIsAuthenticating}
            handleSubmit={handleSubmit} // Custom submit handler if provided
          />
        ) : (
          // Restaurant Form - shown when activeTab is 'restaurant'
          <RestaurantForm 
            onSuccess={onRestaurantLogin} // Callback for successful restaurant login/registration
            // Pass down all restaurant-specific props
            restaurantCuisine={restaurantCuisine}
            setRestaurantCuisine={setRestaurantCuisine}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            restaurantLogo={restaurantLogo}
            setRestaurantLogo={setRestaurantLogo}
            showCuisineDropdown={showCuisineDropdown}
            setShowCuisineDropdown={setShowCuisineDropdown}
            showPriceRangeDropdown={showPriceRangeDropdown}
            setShowPriceRangeDropdown={setShowPriceRangeDropdown}
            showImagePickerModal={showImagePickerModal}
            setShowImagePickerModal={setShowImagePickerModal}
            isAuthenticating={isAuthenticating}
            setIsAuthenticating={setIsAuthenticating}
            handleSubmit={handleSubmit} // Custom submit handler if provided
          />
        )}
      </View>
    </View>
  );
};

/**
 * Styles for the AuthTabs component
 * Uses React Native's StyleSheet for optimized style objects
 */
const styles = StyleSheet.create({
  container: {
    width: '100%', // Take up full width of parent
  },
  tabsContainer: {
    flexDirection: 'row', // Arrange tabs horizontally
    marginBottom: 20, // Space between tabs and form
    borderBottomWidth: 1, // Bottom border for tab container
    borderBottomColor: '#ddd', // Light gray border
  },
  tab: {
    paddingVertical: 10, // Vertical padding inside tabs
    paddingHorizontal: 20, // Horizontal padding inside tabs
    marginRight: 10, // Space between tabs
  },
  activeTab: {
    borderBottomWidth: 2, // Thicker bottom border for active tab
    borderBottomColor: '#FF385C', // Brand color for active tab indicator
  },
  tabText: {
    fontSize: 16, // Font size for tab text
    color: '#666', // Gray color for inactive tab text
  },
  activeTabText: {
    color: '#FF385C', // Brand color for active tab text
    fontWeight: 'bold', // Bold text for active tab
  },
  formContainer: {
    width: '100%', // Take up full width of parent
  },
});

export default AuthTabs;
