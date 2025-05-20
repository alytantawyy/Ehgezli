import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthRoute, UserRoute, RestaurantRoute } from '../types/navigation';

/**
 * App Entry Point
 * 
 * Handles initial routing based on authentication state
 * Redirects to the appropriate section of the app
 */
export default function Index() {
  const { user, isLoading, isRestaurant } = useAuth();

  // Show loading indicator while auth state is being determined
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF385C" />
      </View>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Redirect href={AuthRoute.login as any} />;
  }

  // If user is a restaurant owner, redirect to restaurant dashboard
  if (isRestaurant) {
    return <Redirect href={RestaurantRoute.tabs as any} />;
  }

  // Otherwise, redirect to user home
  return <Redirect href={UserRoute.tabs as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
