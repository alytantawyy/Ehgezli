import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { Redirect } from 'expo-router';

/**
 * Restaurant Section Layout
 * 
 * Main layout for the restaurant owner section of the app
 * Handles authentication checking and navigation structure
 */
export default function RestaurantLayout() {
  const { user, isLoading, isRestaurant } = useAuth();

  // If the user is not authenticated or not a restaurant owner, redirect to the login screen
  if (!isLoading && (!user || !isRestaurant)) {
    // Using type assertion to bypass route validation during restructuring
    const loginPath: any = "/auth/login";
    return <Redirect href={loginPath} />;
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
        name="reservation-details"
        options={{
          title: 'Reservation Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="edit-restaurant"
        options={{
          title: 'Edit Restaurant',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-branch"
        options={{
          title: 'Add Branch',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit-branch"
        options={{
          title: 'Edit Branch',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="manage-menu"
        options={{
          title: 'Manage Menu',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Stack>
  );
}
