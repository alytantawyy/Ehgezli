import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { EhgezliButton } from '../common/EhgezliButton';

interface RestaurantLoginFormProps {
  onSuccess?: () => void;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  onFormSubmit?: (formData: any) => void;
  onToggleMode?: () => void;
  onForgotPassword?: () => void;
}

const RestaurantLoginForm: React.FC<RestaurantLoginFormProps> = ({
  onSuccess,
  isAuthenticating,
  setIsAuthenticating,
  onFormSubmit,
  onToggleMode,
  onForgotPassword
}) => {
  // Local state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(isAuthenticating || false);
  const [error, setError] = useState<string | null>(null);

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
      // Store email/password in parent component's state before submitting
      // This would typically be done via state update callbacks passed from parent
      onFormSubmit({
        email,
        password,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Login</Text>
      <Text style={styles.subtitle}>Access your restaurant dashboard</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your restaurant email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <EhgezliButton
        title={isLoading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={isLoading}
        style={styles.loginButton}
      />
      
      {onForgotPassword && (
        <TouchableOpacity 
          style={styles.forgotPasswordButton}
          onPress={onForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.switchModeButton}
        onPress={onToggleMode}
      >
        <Text style={styles.switchModeText}>Don't have a restaurant account? Register</Text>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
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
  loginButton: {
    marginTop: 10,
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
  forgotPasswordButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#B01C2E',
    fontSize: 16,
  },
});

export default RestaurantLoginForm;
