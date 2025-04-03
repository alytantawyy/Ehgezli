import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { EhgezliButton } from './EhgezliButton';

interface FilterDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  cityFilter: string;
  setCityFilter: (city: string) => void;
  cuisineFilter: string;
  setCuisineFilter: (cuisine: string) => void;
  priceFilter: string;
  setPriceFilter: (price: string) => void;
  onApplyFilters: () => void;
}

// Constants from your web app memories
const CUISINES = [
  "American",
  "Egyptian",
  "Italian",
  "Japanese",
  "Chinese",
  "Indian",
  "Mexican",
  "French",
  "Thai",
  "Mediterranean",
  "Lebanese",
];

const CITIES = ["Cairo", "Alexandria"];
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export function FilterDrawer({
  isVisible,
  onClose,
  cityFilter,
  setCityFilter,
  cuisineFilter,
  setCuisineFilter,
  priceFilter,
  setPriceFilter,
  onApplyFilters
}: FilterDrawerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!isVisible) return null;

  const handleReset = () => {
    setCityFilter('all');
    setCuisineFilter('all');
    setPriceFilter('all');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* City Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>City</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                cityFilter === 'all' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setCityFilter('all')}
            >
              <Text 
                style={[
                  styles.optionText, 
                  cityFilter === 'all' && styles.selectedOptionText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.optionButton,
                  cityFilter === city && { backgroundColor: colors.primary }
                ]}
                onPress={() => setCityFilter(city)}
              >
                <Text 
                  style={[
                    styles.optionText, 
                    cityFilter === city && styles.selectedOptionText
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cuisine Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuisine</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                cuisineFilter === 'all' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setCuisineFilter('all')}
            >
              <Text 
                style={[
                  styles.optionText, 
                  cuisineFilter === 'all' && styles.selectedOptionText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {CUISINES.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.optionButton,
                  cuisineFilter === cuisine && { backgroundColor: colors.primary }
                ]}
                onPress={() => setCuisineFilter(cuisine)}
              >
                <Text 
                  style={[
                    styles.optionText, 
                    cuisineFilter === cuisine && styles.selectedOptionText
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Range</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                priceFilter === 'all' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setPriceFilter('all')}
            >
              <Text 
                style={[
                  styles.optionText, 
                  priceFilter === 'all' && styles.selectedOptionText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {PRICE_RANGES.map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.optionButton,
                  priceFilter === price && { backgroundColor: colors.primary }
                ]}
                onPress={() => setPriceFilter(price)}
              >
                <Text 
                  style={[
                    styles.optionText, 
                    priceFilter === price && styles.selectedOptionText
                  ]}
                >
                  {price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <EhgezliButton
          title="Reset"
          variant="outline"
          onPress={handleReset}
          style={styles.footerButton}
        />
        <EhgezliButton
          title="Apply Filters"
          variant="ehgezli"
          onPress={() => {
            onApplyFilters();
            onClose();
          }}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
