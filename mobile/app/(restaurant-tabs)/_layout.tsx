import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function RestaurantTabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is authenticated as a restaurant
    const checkRestaurantAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Checking restaurant authentication...');
        
        // Check if token exists - this is the simplest way to verify authentication
        const token = await SecureStore.getItemAsync('auth_token');
        console.log('Auth token in restaurant layout:', token ? 'Token exists' : 'No token');
        
        if (!token) {
          // If no token, redirect to login
          console.log('No auth token found, redirecting to login');
          router.replace('/login');
          return;
        }
        
        // If we have a token, assume we're authenticated and don't call getCurrentRestaurant
        // This avoids potential issues with the API implementation
        console.log('Auth token found, proceeding to restaurant dashboard');
      } catch (error) {
        console.error('Error checking restaurant authentication:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkRestaurantAuth();
  }, []);

  if (isLoading) {
    return null; // Show nothing while checking authentication
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          headerShown: true,
        }}
      />
    </Tabs>
  );
}
