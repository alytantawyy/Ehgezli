/**
 * Geocoding Utilities
 * 
 * Functions for converting addresses to geographic coordinates (latitude/longitude)
 * and vice versa using third-party geocoding services.
 */

// Note: In a production app, you would need to add your API key to the .env file
// and import it using the dotenv package
// const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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
    // Combine address and city for better results
    const searchQuery = `${address}, ${city} Governorate, Egypt`;
    
    // URL encode the search query
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Using OpenStreetMap Nominatim API (free, no API key required for low usage)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
      {
        headers: {
          // Adding a user agent is required by Nominatim's usage policy
          'User-Agent': 'Ehgezli-Restaurant-App',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Check if we got any results
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    }
    
    // No results found
    console.warn('No geocoding results found for address:', searchQuery);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
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
