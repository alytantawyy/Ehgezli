import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface RestaurantLoginFormProps {
  onSuccess?: () => void;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  handleSubmit?: () => void;
  onToggleMode?: () => void;
}

const RestaurantLoginForm: React.FC<RestaurantLoginFormProps> = ({
  onSuccess,
  isAuthenticating,
  setIsAuthenticating,
  handleSubmit,
  onToggleMode
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
      setError('Please enter email and password');
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
      // Store email/password in parent component's state before submitting
      // This would typically be done via state update callbacks passed from parent
      handleSubmit();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Login</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
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
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchModeButton}
        onPress={onToggleMode}
      >
        <Text style={styles.switchModeText}>Don't have an account? Register</Text>
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

export default RestaurantLoginForm;
