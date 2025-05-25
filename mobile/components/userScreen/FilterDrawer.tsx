// Importing React and other required components, libraries, and styles from React Native and Expo.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For using icon components (in this case, a close icon)
import Colors from '@/constants/Colors'; // Custom color constants based on your app's theme
import { EhgezliButton } from '@/components/common/EhgezliButton'; // Custom button component used in the footer

// Define the component's props interface using TypeScript.
// This describes what properties the FilterDrawer expects.
export interface FilterDrawerProps {
  isVisible: boolean;                // Determines if the FilterDrawer should be displayed
  onClose: () => void;               // Function to call when the drawer is closed
  onApplyFilters: () => void;        // Function to apply filters and update the display
  onResetFilters: () => void;        // Function to reset all filters
  cities: string[];                  // List of available cities
  cuisines: string[];                // List of available cuisines
  priceRanges: string[];             // List of available price ranges
  onSelectCity: (city: string | null) => void;       // Function to update the selected city
  onSelectCuisine: (cuisine: string | null) => void; // Function to update the selected cuisine
  onSelectPriceRange: (price: string | null) => void; // Function to update the selected price range
  onSortByDistance?: () => void;     // Optional function to sort results by distance
  
  // Optional legacy props for backward compatibility
  selectedDate?: Date;               
  onDateChange?: (event: any, selectedDate?: Date) => void; 
  selectedTime?: Date;               
  onTimeChange?: (event: any, selectedTime?: Date) => void; 
  partySize?: number;                
  onPartySizeChange?: (size: number) => void; 
  cityFilter?: string;               
  setCityFilter?: (city: string) => void;      
  cuisineFilter?: string;            
  setCuisineFilter?: (cuisine: string) => void; 
  priceFilter?: string;              
  setPriceFilter?: (price: string) => void;     
  distanceFilter?: string;           
  setDistanceFilter?: (distance: string) => void; 
}

// Get screen dimensions for responsive sizing
const { height } = Dimensions.get('window');

// FilterDrawer component definition.
// Renders a drawer that includes filters for City, Cuisine, and Price Range.
export function FilterDrawer({
  isVisible,
  onClose,
  onApplyFilters,
  onResetFilters,
  cities = [],
  cuisines = [],
  priceRanges = [],
  onSelectCity,
  onSelectCuisine,
  onSelectPriceRange,
  onSortByDistance,
  // Legacy props
  cityFilter,
  setCityFilter,
  cuisineFilter,
  setCuisineFilter,
  priceFilter,
  setPriceFilter,
  distanceFilter,
  setDistanceFilter
}: FilterDrawerProps) {
  // Use Colors directly
  const colors = Colors;
  
  // Local state for selected filters
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  // If the drawer is not visible, don't render anything.
  if (!isVisible) return null;

  // Handle city selection
  const handleCitySelect = (city: string) => {
    const newValue = selectedCity === city ? null : city;
    setSelectedCity(newValue);
    onSelectCity(newValue);
  };

  // Handle cuisine selection
  const handleCuisineSelect = (cuisine: string) => {
    const newValue = selectedCuisine === cuisine ? null : cuisine;
    setSelectedCuisine(newValue);
    onSelectCuisine(newValue);
  };

  // Handle price range selection
  const handlePriceSelect = (price: string) => {
    const newValue = selectedPrice === price ? null : price;
    setSelectedPrice(newValue);
    onSelectPriceRange(newValue);
  };

  // Legacy reset function for backward compatibility
  const handleLegacyReset = () => {
    if (setCityFilter) setCityFilter('all');
    if (setCuisineFilter) setCuisineFilter('all');
    if (setPriceFilter) setPriceFilter('all');
    if (setDistanceFilter) setDistanceFilter('all');
    
    // Apply the reset filters immediately
    if (onApplyFilters) onApplyFilters();
  };

  return (
    // Main container view for the FilterDrawer with a semi-transparent background overlay
    <View style={styles.modalOverlay}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Header section containing the title and close button */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
          
          {/* Close button wrapped in TouchableOpacity */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Scrollable content area containing filter sections */}
        <ScrollView style={styles.content}>
          {/* City Filter Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>City</Text>
            <View style={styles.optionsContainer}>
              {/* All Cities option */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedCity === null && styles.selectedOption,
                ]}
                onPress={() => handleCitySelect(null as any)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedCity === null && styles.selectedOptionText,
                  ]}
                >
                  All Cities
                </Text>
              </TouchableOpacity>

              {/* Render city options using the cities array */}
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.optionButton,
                    selectedCity === city && styles.selectedOption,
                  ]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCity === city && styles.selectedOptionText,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cuisine Filter Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuisine</Text>
            <View style={styles.optionsContainer}>
              {/* All Cuisines option */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedCuisine === null && styles.selectedOption,
                ]}
                onPress={() => handleCuisineSelect(null as any)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedCuisine === null && styles.selectedOptionText,
                  ]}
                >
                  All Cuisines
                </Text>
              </TouchableOpacity>

              {/* Render cuisine options using the cuisines array */}
              {cuisines.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.optionButton,
                    selectedCuisine === cuisine && styles.selectedOption,
                  ]}
                  onPress={() => handleCuisineSelect(cuisine)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCuisine === cuisine && styles.selectedOptionText,
                    ]}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range Filter Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Range</Text>
            <View style={styles.optionsContainer}>
              {/* All Price Ranges option */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedPrice === null && styles.selectedOption,
                ]}
                onPress={() => handlePriceSelect(null as any)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedPrice === null && styles.selectedOptionText,
                  ]}
                >
                  All Prices
                </Text>
              </TouchableOpacity>

              {/* Render price range options using the priceRanges array */}
              {priceRanges.map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[
                    styles.optionButton,
                    selectedPrice === price && styles.selectedOption,
                  ]}
                  onPress={() => handlePriceSelect(price)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPrice === price && styles.selectedOptionText,
                    ]}
                  >
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort by Distance option */}
          {onSortByDistance && (
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={onSortByDistance}
            >
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.sortButtonText}>Sort by Distance</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Footer containing reset and apply buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {/* Reset button: resets all filters to default when pressed */}
          <EhgezliButton
            title="Reset"
            variant="outline"
            onPress={onResetFilters || handleLegacyReset}
            style={styles.footerButton}
          />
          {/* Apply Filters button: applies the selected filters and closes the drawer */}
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
    </View>
  );
}

// StyleSheet definitions for component styling.
const styles = StyleSheet.create({
  // Container for the entire FilterDrawer component.
  container: {
    height: height * 0.7, // Limit height to 70% of screen height
    marginTop: 'auto', // Push to bottom of screen
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'flex-end', // Align to bottom of screen
  },
  // Header section styling
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  // Content area styling
  content: {
    flex: 1,
    padding: 16,
  },
  // Section styling (City, Cuisine, Price Range)
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  // Container for filter options
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Compensate for option button margin
  },
  // Individual option button styling
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  // Selected option styling
  selectedOption: {
    backgroundColor: '#5A67F2',
  },
  // Option text styling
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  // Selected option text styling
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Sort by distance button styling
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  sortButtonText: {
    marginLeft: 8,
    color: '#5A67F2',
    fontWeight: '500',
  },
  // Footer section styling
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  // Footer button styling
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
