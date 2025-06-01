import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { EhgezliButton } from '../../components/common/EhgezliButton';
import { AuthRoute } from '../../types/navigation';

export default function VerificationPendingScreen() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.replace(AuthRoute.login as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <View style={styles.content}>
        <Image 
          source={require('../../assets/Ehgezli-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Thank You for Registering!</Text>
        
        <Text style={styles.message}>
          Your restaurant registration has been received and is pending verification.
        </Text>
        
        <Text style={styles.submessage}>
          Our team will review your information and verify your restaurant within the next 48 hours.
        </Text>
        
        <Text style={styles.submessage}>
          You'll receive an email notification once your restaurant is verified and your account is activated.
        </Text>
        
        <View style={styles.buttonContainer}>
          <EhgezliButton 
            title="Back to Login" 
            onPress={handleBackToLogin} 
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#B01C2E',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  submessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginTop: 10,
  },
});
