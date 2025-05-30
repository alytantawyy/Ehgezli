import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActivityItemProps {
  type: 'new_booking' | 'cancellation' | 'completed' | 'arrived' | 'modified';
  message: string;
  time: string;
}

/**
 * ActivityItem Component
 * 
 * Displays a single activity item in the recent activity feed
 * Used in the restaurant dashboard
 */
export const ActivityItem: React.FC<ActivityItemProps> = ({ type, message, time }) => {
  // Get icon and color based on activity type
  const getActivityIcon = () => {
    switch (type) {
      case 'new_booking':
        return { name: 'add-circle-outline', color: '#007AFF' };
      case 'cancellation':
        return { name: 'close-circle-outline', color: '#FF3B30' };
      case 'completed':
        return { name: 'checkmark-circle-outline', color: '#34C759' };
      case 'arrived':
        return { name: 'person-outline', color: '#5AC8FA' };
      case 'modified':
        return { name: 'create-outline', color: '#FF9500' };
      default:
        return { name: 'information-circle-outline', color: '#8E8E93' };
    }
  };

  const { name, color } = getActivityIcon();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={name as any} size={20} color={color} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
