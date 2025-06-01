import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Themed';
import { Ionicons } from '@expo/vector-icons';

interface DetailRowProps {
  icon: string;
  text: string;
  iconColor?: string;
  textColor?: string;
  iconSize?: number;
  rightContent?: ReactNode;
}

/**
 * DetailRow Component
 * 
 * A reusable component for displaying a row with an icon and text
 * Used in both user and restaurant sections for displaying details
 */
export const DetailRow: React.FC<DetailRowProps> = ({
  icon,
  text,
  iconColor = '#666',
  textColor = '#666',
  iconSize = 16,
  rightContent,
}) => {
  return (
    <View style={styles.detailRow}>
      <View style={styles.leftContent}>
        <Ionicons name={icon as any} size={iconSize} color={iconColor} />
        <Text style={[styles.detailText, { color: textColor }]}>
          {text}
        </Text>
      </View>
      
      {rightContent && (
        <View style={styles.rightContent}>
          {rightContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  rightContent: {
    marginLeft: 8,
  },
});
