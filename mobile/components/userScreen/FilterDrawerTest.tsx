import React, { useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { FilterDrawer } from './FilterDrawer';
import { CITY_OPTIONS, CUISINE_OPTIONS, PRICE_RANGE_OPTIONS } from '@/constants/FilterOptions';

export function FilterDrawerTest() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  return (
    <View style={styles.container}>
      <Button 
        title="Open Filter Drawer" 
        onPress={() => setIsVisible(true)} 
      />
      
      <Text style={styles.text}>Selected City: {selectedCity || 'None'}</Text>
      <Text style={styles.text}>Selected Cuisine: {selectedCuisine || 'None'}</Text>
      <Text style={styles.text}>Selected Price: {selectedPrice || 'None'}</Text>
      
      <FilterDrawer
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        onApplyFilters={() => console.log('Filters applied')}
        onResetFilters={() => {
          setSelectedCity('');
          setSelectedCuisine('');
          setSelectedPrice('');
        }}
        cities={CITY_OPTIONS}
        cuisines={CUISINE_OPTIONS}
        priceRanges={PRICE_RANGE_OPTIONS}
        onSelectCity={(city) => setSelectedCity(city || '')}
        onSelectCuisine={(cuisine) => setSelectedCuisine(cuisine || '')}
        onSelectPriceRange={(price) => setSelectedPrice(price || '')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});
