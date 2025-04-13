import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from 'react-native';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  size?: number;
  onPress?: () => void;
}

/**
 * Avatar component that displays either a user's profile image or their initials
 * in a circle if no image is available.
 */
export function Avatar({ 
  firstName = '', 
  lastName = '', 
  imageUrl, 
  size = 40, 
  onPress 
}: AvatarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Use Colors directly
  const colors = Colors;
  
  // Get user initials for the fallback avatar
  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const avatarContent = imageUrl ? (
    <Image 
      source={{ uri: imageUrl }} 
      style={[styles.image, { width: size, height: size }]} 
      resizeMode="cover"
    />
  ) : (
    <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
      {getInitials()}
    </Text>
  );

  const avatarComponent = (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: imageUrl ? 'transparent' : colors.primary 
        }
      ]}
    >
      {avatarContent}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {avatarComponent}
      </TouchableOpacity>
    );
  }

  return avatarComponent;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: 'white',
    fontWeight: 'bold',
  },
});
