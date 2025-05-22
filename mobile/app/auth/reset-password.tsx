import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EhgezliButton } from '../../components/common/EhgezliButton';
import Colors from '../../constants/Colors';
import { resetPassword, validateResetToken } from '../../api/auth';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string || '';
  
  useEffect(() => {
    // Set up deep link handling
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      try {
        // Parse the URL to get the token
        const url = new URL(event.url);
        const tokenParam = url.searchParams.get('token');
        
        if (tokenParam) {
          console.log('Token from deep link:', tokenParam);
        }
      } catch (error) {
        console.error('Error parsing deep link URL:', error);
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        console.log('App opened with URL:', initialUrl);
        handleDeepLink({ url: initialUrl });
      }
    });

    // Clean up
    return () => {
      subscription.remove();
    };
  }, [params]);

  const handleSubmit = async () => {
    // Validate inputs
    if (!token) {
      setError('Please enter the reset code from your email');
      return;
    }
    
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Submitting password reset with token:', token);
      
      // First validate the token
      const isValid = await validateResetToken(token);
      
      if (!isValid) {
        setError('Invalid or expired reset token. Please request a new password reset.');
        setIsLoading(false);
        return;
      }
      
      // Then reset the password
      await resetPassword({ token, password });
      console.log('Password reset successful');
      setResetSuccess(true);
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now log in with your new password.'
      );
      
      // Navigate to login with a small delay
      setTimeout(() => {
        console.log('Navigating to login screen');
        router.replace('./login');
      }, 500);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formSection}>
            <View style={styles.header}>
              <Text style={styles.logo}>Ehgezli</Text>
              <Text style={styles.tagline}>Reset Your Password</Text>
            </View>
            
            <View style={styles.formContainer}>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your new password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
              
              {error && <Text style={styles.errorText}>{error}</Text>}
              
              <EhgezliButton
                title="Reset Password"
                onPress={handleSubmit}
                variant="ehgezli"
                loading={isLoading}
                style={styles.button}
              />
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.push('/login' as any)}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formSection: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
});