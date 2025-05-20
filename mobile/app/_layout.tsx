import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/auth-context';
import { LocationProvider } from '../context/location-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '../context/theme-context';

// Create a client for React Query
const queryClient = new QueryClient();

/**
 * Root Layout
 * 
 * Main layout for the entire application
 * Sets up providers and global navigation structure
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="user" options={{ headerShown: false }} />
              <Stack.Screen name="restaurant" options={{ headerShown: false }} />
            </Stack>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
