import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { Image } from 'react-native';

export default function TabLayout() {
  // Use Colors directly without color scheme
  const colors = Colors;

  useEffect(() => {
    console.log('Tab layout is rendering');
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          backgroundColor: '#ffffff',
          height: 80, // Increased height
          display: 'flex',
          paddingBottom: 25, // Increased bottom padding to account for iPhone home indicator
          paddingTop: 10, // Increased top padding to shift icons up
          position: 'absolute',
          bottom: 0, // Position at the bottom of the screen
          left: 0,
          right: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          borderRadius: 15,
          //marginHorizontal: 10,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            focused ? (
              <Image 
                source={require('../../assets/Ehgezli-logo.png')} 
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="home-outline" size={size} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
