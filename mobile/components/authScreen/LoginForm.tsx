import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { EhgezliButton } from '../common/EhgezliButton';

interface LoginFormProps {
  onSuccess?: () => void;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  onFormSubmit?: (formData?: { email: string; password: string }) => void;
  onToggleMode?: () => void;
  setEmail?: Dispatch<SetStateAction<string>>;
  setPassword?: Dispatch<SetStateAction<string>>;
  authError?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  isAuthenticating,
  setIsAuthenticating,
  onFormSubmit,
  onToggleMode,
  setEmail,
  setPassword,
  authError
}) => {
  // Local state for form fields
  const [email, setEmailState] = useState('');
  const [password, setPasswordState] = useState('');
  const [isLoading, setIsLoading] = useState(isAuthenticating || false);
  const [error, setError] = useState<string | null>(null);

  // Show alert when auth error is received
  useEffect(() => {
    if (authError && authError.length > 0) {
      // Check if it's an invalid credentials error
      if (authError.includes('Invalid credentials') || 
          authError.includes('invalid email') || 
          authError.includes('invalid password') ||
          authError.includes('Unauthorized')) {
        Alert.alert(
          'Login Failed',
          'Invalid email or password. Please try again.',
          [{ text: 'OK', style: 'cancel' }]
        );
      }
      // Set the local error state
      setError(authError);
    }
  }, [authError]);

  // Update local loading state when prop changes
  React.useEffect(() => {
    if (isAuthenticating !== undefined) {
      setIsLoading(isAuthenticating);
    }
  }, [isAuthenticating]);

  // Handle form submission
  const handleLogin = () => {
    // Validate form fields
    if (!email || !password) {
      setError('Please enter both email and password');
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
      onFormSubmit({ email, password });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to manage your restaurant reservations</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => {
          setEmailState(text);
          if (setEmail) {
            setEmail(text);
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={(text) => {
          setPasswordState(text);
          if (setPassword) {
            setPassword(text);
          }
        }}
        secureTextEntry
      />
      
      <EhgezliButton
        title={isLoading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={isLoading}
        loading={isLoading}
        variant="ehgezli"
        size="md"
        style={styles.buttonContainer}
      />
      
      <TouchableOpacity 
        style={styles.forgotPasswordButton}
      >
        <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'left',
    color: '#666',
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
    marginBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  buttonContainer: {
    marginTop: 16,
    backgroundColor: '#B01C2E',
  },
  errorText: {
    color: '#B01C2E',
    marginBottom: 16,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#B01C2E',
    fontSize: 14,
  },
});

export default LoginForm;
