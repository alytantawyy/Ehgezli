/**
 * Geocoding Utilities
 * 
 * Functions for converting addresses to geographic coordinates (latitude/longitude)
 * and vice versa using third-party geocoding services.
 */

/**
 * Geocode an address to get latitude and longitude
 * 
 * Uses the OpenStreetMap Nominatim API (no API key required for low usage)
 * For production use with higher volume, consider using Google Maps Geocoding API
 * with proper API key and billing set up
 * 
 * @param address Full address string including city
 * @param city City name to improve accuracy
 * @returns Promise with latitude and longitude or null if geocoding fails
 */
export const geocodeAddress = async (
  address: string,
  city: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    console.log('🔍 Geocoding request for:', { address, city });
    
    // Combine address and city for better results
    const searchQuery = `${address}, ${city} Governorate, Egypt`;
    console.log('🔍 Search query:', searchQuery);
    
    // URL encode the search query
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Using OpenStreetMap Nominatim API (free, no API key required for low usage)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;
    console.log('🔍 Request URL:', url);
    
    const response = await fetch(
      url,
      {
        headers: {
          // Adding a user agent is required by Nominatim's usage policy
          'User-Agent': 'Ehgezli-Restaurant-App/1.0',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8', // Add Arabic as fallback
        },
      }
    );

    console.log('🔍 Response status:', response.status);

    if (!response.ok) {
      console.error('❌ Geocoding API error:', response.status, response.statusText);
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Raw API response:', JSON.stringify(data));

    // Check if we got any results
    if (data && data.length > 0) {
      const result = data[0];
      console.log('✅ Found location:', result);
      
      // Validate the coordinates
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      console.log('📍 Parsed coordinates:', { lat, lon });
      
      // Check for invalid coordinates (0,0 is in the Gulf of Guinea, unlikely to be a valid result)
      if (isNaN(lat) || isNaN(lon)) {
        console.error('❌ Invalid coordinates (NaN)');
        return null;
      }
      
      if (Math.abs(lat) < 0.0001 && Math.abs(lon) < 0.0001) {
        console.error('❌ Suspicious coordinates near (0,0)');
        return null;
      }
      
      // Egypt's approximate bounding box
      const isInEgypt = lat >= 22.0 && lat <= 31.5 && lon >= 25.0 && lon <= 36.0;
      if (!isInEgypt) {
        console.warn('⚠️ Coordinates outside Egypt:', { lat, lon });
        // Still return the coordinates, but log the warning
      }
      
      return {
        latitude: lat,
        longitude: lon,
      };
    }
    
    // No results found
    console.warn('❌ No geocoding results found for address:', searchQuery);
    return null;
  } catch (error) {
    console.error('❌ Error geocoding address:', error);
    return null;
  }
};

/**
 * Alternative implementation using Google Maps Geocoding API
 * Uncomment and use this if you have a Google Maps API key and need more reliable geocoding
 */
/*
export const geocodeAddressWithGoogle = async (
  address: string,
  city: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const searchQuery = `${address}, ${city}, Egypt`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Replace YOUR_API_KEY with your actual Google Maps API key
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=YOUR_API_KEY`
    );

    if (!response.ok) {
      throw new Error(`Google geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    
    console.warn('No Google geocoding results found for address:', searchQuery);
    return null;
  } catch (error) {
    console.error('Error with Google geocoding:', error);
    return null;
  }
};
*/
