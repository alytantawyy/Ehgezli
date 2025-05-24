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
      <Stack.Screen
        name="restaurant-details"
        options={{
          title: 'Restaurant Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="booking-details"
        options={{
          title: 'Booking Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="saved-restaurants"
        options={{
          title: 'Saved Restaurants',
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          title: 'Payment Methods',
        }}
      />
      <Stack.Screen
        name="help-center"
        options={{
          title: 'Help Center',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: 'Privacy Policy',
        }}
      />
    </Stack>
  );
}
