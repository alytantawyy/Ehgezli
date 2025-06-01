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
import RestaurantLoginForm from './RestaurantLoginForm';
import RestaurantRegisterForm from './RestaurantRegisterForm';

/**
 * Defines the possible tab types that can be active at any given time.
 * - 'login': For regular user login
 * - 'register': For new user registration
 * - 'restaurant': For restaurant owner login/registration
 */
type TabType = 'login' | 'register' | 'restaurant';

/**
 * Props interface for the AuthTabs component
 */
interface AuthTabsProps {
  // Tab configuration
  initialTab?: TabType;
  
  // Grouped objects for better organization
  userProfile?: {
    firstName: string;
    setFirstName: Dispatch<SetStateAction<string>>;
    lastName: string;
    setLastName: Dispatch<SetStateAction<string>>;
    phoneNumber: string;
    setPhoneNumber: Dispatch<SetStateAction<string>>;
    gender: string;
    setGender: Dispatch<SetStateAction<string>>;
    birthday: Date | null;
    setBirthday: Dispatch<SetStateAction<Date | null>>;
    city: string;
    setCity: Dispatch<SetStateAction<string>>;
    nationality: string;
    setNationality: Dispatch<SetStateAction<string>>;
    cuisines: string[];
    setCuisines: Dispatch<SetStateAction<string[]>>;
    availableCuisines: string[];
  };
  
  restaurantProfile?: {
    restaurantName: string;
    setRestaurantName: Dispatch<SetStateAction<string>>;
    restaurantCuisine: string;
    setRestaurantCuisine: Dispatch<SetStateAction<string>>;
    priceRange: string;
    setPriceRange: Dispatch<SetStateAction<string>>;
    restaurantLogo: string;
    setRestaurantLogo: Dispatch<SetStateAction<string>>;
  };
  
  uiState?: {
    showCityDropdown: boolean;
    setShowCityDropdown: Dispatch<SetStateAction<boolean>>;
    showGenderDropdown: boolean;
    setShowGenderDropdown: Dispatch<SetStateAction<boolean>>;
    showCuisineDropdown: boolean;
    setShowCuisineDropdown: Dispatch<SetStateAction<boolean>>;
    showPriceRangeDropdown: boolean;
    setShowPriceRangeDropdown: Dispatch<SetStateAction<boolean>>;
    showImagePickerModal: boolean;
    setShowImagePickerModal: Dispatch<SetStateAction<boolean>>;
    showBirthdayPicker: boolean;
    setShowBirthdayPicker: Dispatch<SetStateAction<boolean>>;
    showNationalityDropdown: boolean;
    setShowNationalityDropdown: Dispatch<SetStateAction<boolean>>;
  };
  
  authState?: {
    isAuthenticating: boolean;
    setIsAuthenticating: Dispatch<SetStateAction<boolean>>;
    authError: string | null;
  };
  
  authCallbacks?: {
    onLoginSuccess: () => void;
    onRegisterSuccess: () => void;
    onRestaurantLogin: () => void;
    onRestaurantRegister: () => void;
    onForgotPassword: () => void;
    onFormSubmit: (formData: any) => void;
    onTabChange: (tab: TabType) => void;
    onRestaurantModeToggle: (isLogin: boolean) => void;
    isRestaurantLoginMode: boolean;
  };
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
  
  // Extract values from grouped objects
  userProfile,
  restaurantProfile,
  uiState,
  authState,
  authCallbacks,
}) => {
  // Extract values from grouped objects
  const _firstName = userProfile?.firstName;
  const _setFirstName = userProfile?.setFirstName;
  const _lastName = userProfile?.lastName;
  const _setLastName = userProfile?.setLastName;
  const _phoneNumber = userProfile?.phoneNumber;
  const _setPhoneNumber = userProfile?.setPhoneNumber;
  const _gender = userProfile?.gender;
  const _setGender = userProfile?.setGender;
  const _birthday = userProfile?.birthday;
  const _setBirthday = userProfile?.setBirthday;
  const _city = userProfile?.city;
  const _setCity = userProfile?.setCity;
  const _nationality = userProfile?.nationality;
  const _setNationality = userProfile?.setNationality;
  const _cuisines = userProfile?.cuisines;
  const _setCuisines = userProfile?.setCuisines;
  const _availableCuisines = userProfile?.availableCuisines;
  
  const _restaurantName = restaurantProfile?.restaurantName;
  const _setRestaurantName = restaurantProfile?.setRestaurantName;
  const _restaurantCuisine = restaurantProfile?.restaurantCuisine;
  const _setRestaurantCuisine = restaurantProfile?.setRestaurantCuisine;
  const _priceRange = restaurantProfile?.priceRange;
  const _setPriceRange = restaurantProfile?.setPriceRange;
  const _restaurantLogo = restaurantProfile?.restaurantLogo;
  const _setRestaurantLogo = restaurantProfile?.setRestaurantLogo;
  
  const _isAuthenticating = authState?.isAuthenticating;
  const _setIsAuthenticating = authState?.setIsAuthenticating;
  const _authError = authState?.authError;
  
  const _onLoginSuccess = authCallbacks?.onLoginSuccess;
  const _onRegisterSuccess = authCallbacks?.onRegisterSuccess;
  const _onRestaurantLogin = authCallbacks?.onRestaurantLogin;
  const _onRestaurantRegister = authCallbacks?.onRestaurantRegister;
  const _onForgotPassword = authCallbacks?.onForgotPassword;
  const _onFormSubmit = authCallbacks?.onFormSubmit;
  
  // Extract restaurant mode toggle from authCallbacks
  const _onRestaurantModeToggle = authCallbacks?.onRestaurantModeToggle;
  const _isRestaurantLoginMode = authCallbacks?.isRestaurantLoginMode !== undefined ? 
    authCallbacks.isRestaurantLoginMode : true; // Default to login mode if not specified

  // UI state variables
  const _showCityDropdown = uiState?.showCityDropdown;
  const _setShowCityDropdown = uiState?.setShowCityDropdown;
  const _showGenderDropdown = uiState?.showGenderDropdown;
  const _setShowGenderDropdown = uiState?.setShowGenderDropdown;
  const _showCuisineDropdown = uiState?.showCuisineDropdown;
  const _setShowCuisineDropdown = uiState?.setShowCuisineDropdown;
  const _showPriceRangeDropdown = uiState?.showPriceRangeDropdown;
  const _setShowPriceRangeDropdown = uiState?.setShowPriceRangeDropdown;
  const _showImagePickerModal = uiState?.showImagePickerModal;
  const _setShowImagePickerModal = uiState?.setShowImagePickerModal;
  const _showBirthdayPicker = uiState?.showBirthdayPicker;
  const _setShowBirthdayPicker = uiState?.setShowBirthdayPicker;
  const _showNationalityDropdown = uiState?.showNationalityDropdown;
  const _setShowNationalityDropdown = uiState?.setShowNationalityDropdown;

  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // If there's an external tab change handler, call it
    if (authCallbacks?.onTabChange) {
      authCallbacks.onTabChange(tab);
    }
  };

  // Early return if required props are missing
  if (!userProfile || !authCallbacks) {
    console.warn('AuthTabs: Missing required props (userProfile or authCallbacks)');
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Tab navigation buttons */}
      <View style={styles.tabsContainer}>
        {/* Login Tab Button */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => handleTabChange('login')}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
            Login
          </Text>
        </TouchableOpacity>
        
        {/* Register Tab Button */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => handleTabChange('register')}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
            Register
          </Text>
        </TouchableOpacity>
        
        {/* Restaurant Tab Button */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'restaurant' && styles.activeTab]}
          onPress={() => handleTabChange('restaurant')}
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
            onSuccess={_onLoginSuccess}
            isAuthenticating={_isAuthenticating}
            setIsAuthenticating={_setIsAuthenticating}
            onFormSubmit={_onFormSubmit}
            authError={_authError}
          />
        ) : activeTab === 'register' ? (
          // Register Form - shown when activeTab is 'register'
          <RegisterForm 
            onSuccess={_onRegisterSuccess}
            firstName={_firstName}
            setFirstName={_setFirstName}
            lastName={_lastName}
            setLastName={_setLastName}
            phoneNumber={_phoneNumber}
            setPhoneNumber={_setPhoneNumber}
            gender={_gender}
            setGender={_setGender}
            birthday={_birthday}
            setBirthday={_setBirthday}
            city={_city}
            setCity={_setCity}
            nationality={_nationality}
            setNationality={_setNationality}
            availableCuisines={_availableCuisines}
            showGenderDropdown={_showGenderDropdown}
            setShowGenderDropdown={_setShowGenderDropdown}
            showCuisineDropdown={_showCuisineDropdown}
            setShowCuisineDropdown={_setShowCuisineDropdown}
            showImagePickerModal={_showImagePickerModal}
            setShowImagePickerModal={_setShowImagePickerModal}
            isAuthenticating={_isAuthenticating}
            setIsAuthenticating={_setIsAuthenticating}
            onFormSubmit={_onFormSubmit}
            showBirthdayPicker={_showBirthdayPicker}
            setShowBirthdayPicker={_setShowBirthdayPicker}
            showNationalityDropdown={_showNationalityDropdown}
            setShowNationalityDropdown={_setShowNationalityDropdown}
            showCityDropdown={_showCityDropdown}
            setShowCityDropdown={_setShowCityDropdown}
            cuisines={_cuisines}
            setCuisines={_setCuisines}
          />
        ) : _isRestaurantLoginMode ? (
          // Restaurant Login Form - shown when activeTab is 'restaurant' and in login mode
          <RestaurantLoginForm 
            onSuccess={_onRestaurantLogin}
            isAuthenticating={_isAuthenticating}
            onFormSubmit={_onFormSubmit}
            onToggleMode={() => _onRestaurantModeToggle && _onRestaurantModeToggle(false)}
            authError={_authError}
          />
        ) : (
          // Restaurant Register Form - shown when activeTab is 'restaurant' and in register mode
          <RestaurantRegisterForm 
            onSuccess={_onRestaurantRegister}
            isAuthenticating={_isAuthenticating}
            onFormSubmit={_onFormSubmit}
            onToggleMode={() => _onRestaurantModeToggle && _onRestaurantModeToggle(true)}
            restaurantName={_restaurantName}
            setRestaurantName={_setRestaurantName}
            restaurantCuisine={_restaurantCuisine}
            setRestaurantCuisine={_setRestaurantCuisine}
            priceRange={_priceRange}
            setPriceRange={_setPriceRange}
            restaurantLogo={_restaurantLogo}
            setRestaurantLogo={_setRestaurantLogo}
            showCuisineDropdown={_showCuisineDropdown}
            setShowCuisineDropdown={_setShowCuisineDropdown}
            showPriceRangeDropdown={_showPriceRangeDropdown}
            setShowPriceRangeDropdown={_setShowPriceRangeDropdown}
            showImagePickerModal={_showImagePickerModal}
            setShowImagePickerModal={_setShowImagePickerModal}
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
    width: '100%',
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#B01C2E',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#B01C2E',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default AuthTabs;
