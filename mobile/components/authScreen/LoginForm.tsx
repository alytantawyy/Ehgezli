import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { login } from '../../api/auth';

/**
 * Props interface for the LoginForm component
 * 
 * This component is designed to be flexible and can be used in different contexts:
 * 1. As a standalone login form with its own state management
 * 2. As a controlled component where parent manages state and handles submission
 */
interface LoginFormProps {
  /** Callback function triggered on successful login */
  onSuccess?: () => void;
  
  /** Callback function for forgot password action */
  onForgotPassword?: () => void;
  
  /** The following props are used when the form is part of a larger auth flow */
  firstName?: string;
  setFirstName?: Dispatch<SetStateAction<string>>;
  gender?: string;
  setGender?: Dispatch<SetStateAction<string>>;
  city?: string;
  setCity?: Dispatch<SetStateAction<string>>;
  cuisines?: string[];
  setCuisines?: Dispatch<SetStateAction<string[]>>;
  availableCuisines?: string[];
  
  /** UI state controls for dropdowns and modals */
  showCityDropdown?: boolean;
  setShowCityDropdown?: Dispatch<SetStateAction<boolean>>;
  datePickerMode?: 'date' | 'time';
  setDatePickerMode?: Dispatch<SetStateAction<'date' | 'time'>>;
  showGenderDropdown?: boolean;
  setShowGenderDropdown?: Dispatch<SetStateAction<boolean>>;
  showCuisineDropdown?: boolean;
  setShowCuisineDropdown?: Dispatch<SetStateAction<boolean>>;
  showPriceRangeDropdown?: boolean;
  setShowPriceRangeDropdown?: Dispatch<SetStateAction<boolean>>;
  showImagePickerModal?: boolean;
  setShowImagePickerModal?: Dispatch<SetStateAction<boolean>>;
  
  /** Authentication state management */
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  
  /** Optional external submit handler that overrides the default behavior */
  handleSubmit?: () => void;
}

/**
 * LoginForm Component
 * 
 * A reusable form component for user authentication that can either:
 * - Handle the login process independently using the login API
 * - Delegate the submission handling to a parent component
 * 
 * @param {LoginFormProps} props - Component props
 * @returns {React.ReactElement} Rendered form component
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  handleSubmit,
}) => {
  // Internal state for form fields and UI state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the login form submission
   * 
   * Either delegates to the provided handleSubmit prop or
   * performs the login operation directly using the API
   */
  const handleLogin = async () => {
    // If external submit handler is provided, use it and exit
    if (handleSubmit) {
      handleSubmit();
      return;
    }

    // Form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Start loading state and clear any previous errors
    setIsLoading(true);
    setError(null);

    try {
      // Attempt login with provided credentials
      await login({ email, password });
      
      // Handle successful login
      if (onSuccess) {
        // Use provided success callback if available
        onSuccess();
      } else {
        // Navigate to the new tabs location per our restructuring plan
        router.replace('/user/(tabs)' as any);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      // Reset loading state regardless of outcome
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Email input field */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password input field */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Error message display */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Login button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      {/* Forgot password link */}
      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={onForgotPassword || (() => router.push('/auth/forgot-password' as any))}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Component styles
 */
const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  forgotPassword: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#FF385C',
    fontSize: 14,
  },
});

export default LoginForm;
