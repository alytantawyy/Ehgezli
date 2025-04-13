import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Colors from '../constants/Colors';
import { useColorScheme } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'default' | 'outline' | 'ehgezli' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function EhgezliButton({ 
  onPress, 
  title, 
  variant = 'default', 
  size = 'md', 
  disabled = false, 
  loading = false,
  style,
  textStyle
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Use Colors directly
  const colors = Colors;
  
  // Determine styles based on variant and size
  const getButtonStyle = () => {
    let baseStyle: ViewStyle = {
      ...styles.button,
      opacity: disabled ? 0.5 : 1,
    };
    
    // Size variations
    if (size === 'sm') {
      baseStyle = { ...baseStyle, ...styles.buttonSm };
    } else if (size === 'lg') {
      baseStyle = { ...baseStyle, ...styles.buttonLg };
    }
    
    // Variant styles
    if (variant === 'ehgezli') {
      return { 
        ...baseStyle, 
        backgroundColor: colors.primary,
        borderWidth: 0,
      };
    } else if (variant === 'outline') {
      return { 
        ...baseStyle, 
        backgroundColor: 'transparent',
        borderColor: colors.primary,
        borderWidth: 1,
      };
    } else if (variant === 'ghost') {
      return { 
        ...baseStyle, 
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
    }
    
    // Default variant
    return { 
      ...baseStyle, 
      backgroundColor: colors.tint,
    };
  };
  
  const getTextStyle = () => {
    let baseStyle: TextStyle = { ...styles.text };
    
    // Size variations
    if (size === 'sm') {
      baseStyle = { ...baseStyle, ...styles.textSm };
    } else if (size === 'lg') {
      baseStyle = { ...baseStyle, ...styles.textLg };
    }
    
    // Variant-specific text colors
    if (variant === 'ehgezli') {
      return { ...baseStyle, color: '#FFFFFF' };
    } else if (variant === 'outline' || variant === 'ghost') {
      return { ...baseStyle, color: colors.primary };
    }
    
    // Default text color
    return { ...baseStyle, color: '#FFFFFF' };
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonLg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 18,
  },
});
