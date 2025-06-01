import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Redirect } from 'expo-router';

/**
 * User Section Layout
 * 
 * Main layout for the user section of the app
 * Handles authentication checking and navigation structure
 */
export default function UserLayout() {
  const { user, isLoading } = useAuth();

  // If the user is not authenticated, redirect to the login screen
  if (!isLoading && !user) {
    return <Redirect href={("/auth") as any} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF385C',
        },
        headerTintColor: '#fff',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
