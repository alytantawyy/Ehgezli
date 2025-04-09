import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme, Image } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#ffffff',
          height: 60, // Explicit height
          display: 'flex', // Ensure it's displayed
          position: 'absolute', // Position it absolutely
          bottom: 15, // Move it up by 15 pixels from the bottom
          left: 0,
          right: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          borderRadius: 15, // Add rounded corners
          marginHorizontal: 10, // Add some margin on the sides
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
