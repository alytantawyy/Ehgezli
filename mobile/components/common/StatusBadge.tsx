import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Themed';

type StatusType = 'confirmed' | 'pending' | 'cancelled' | 'arrived' | 'completed';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * StatusBadge Component
 * 
 * A reusable badge component for displaying status information
 * Used in both user and restaurant sections for booking/reservation status
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'medium' 
}) => {
  const backgroundColor = getStatusColor(status);
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor },
      styles[size]
    ]}>
      <Text style={[
        styles.text,
        styles[`${size}Text`]
      ]}>
        {status}
      </Text>
    </View>
  );
};

/**
 * Get color for a status
 * 
 * @param status The status string
 * @returns Color code for the status
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'confirmed':
      return '#4CAF50';
    case 'pending':
      return '#FFC107';
    case 'cancelled':
      return '#F44336';
    case 'arrived':
      return '#2196F3';
    case 'completed':
      return '#9C27B0';
    default:
      return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  medium: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  large: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});
