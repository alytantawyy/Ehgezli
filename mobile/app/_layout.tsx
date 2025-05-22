import React from 'react';
// Import Stack component from expo-router for navigation
import { Stack } from 'expo-router';
// Import our context providers that will share data across the app
import { AuthProvider } from '../context/auth-context';
import { LocationProvider } from '../context/location-context';
import { ThemeProvider } from '../context/theme-context';
// Import React Query for data fetching and state management
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import StatusBar to control the appearance of the status bar
import { StatusBar } from 'expo-status-bar';
// Import hook to detect if user has dark or light mode enabled
import { useColorScheme } from 'react-native';

// Create a new React Query client to manage API requests and caching
const queryClient = new QueryClient();

/**
 * Root Layout
 * 
 * Main layout for the entire application
 * Sets up providers and global navigation structure
 */
export default function RootLayout() {
  // Get the user's color scheme preference (light or dark mode)
  const colorScheme = useColorScheme();

  return (
    // Provider pattern: nested providers make data available to all components
    <QueryClientProvider client={queryClient}>
      {/* Theme provider for light/dark mode */}
      <ThemeProvider>
        {/* Auth provider for user authentication */}
        <AuthProvider>
          {/* Location provider for geolocation services */}
          <LocationProvider>
            {/* Status bar that adapts to light/dark mode */}
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            {/* Main navigation container */}
            <Stack
              screenOptions={{
                headerShown: false, // Hide headers by default for all screens
              }}
            >
              {/* Define the main routes of the application */}
              {/* Each Screen corresponds to a folder or file in the app directory */}
              <Stack.Screen name="index" options={{ headerShown: false }} /> {/* Root/home route */}
              <Stack.Screen name="auth" options={{ headerShown: false }} /> {/* Authentication routes */}
              <Stack.Screen name="user" options={{ headerShown: false }} /> {/* User-specific routes */}
              <Stack.Screen name="restaurant" options={{ headerShown: false }} /> {/* Restaurant-specific routes */}
            </Stack>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
