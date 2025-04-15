import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Define types for our data models
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  gender?: string;
  favoriteCuisines?: string[];
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  imageUrl: string;
  branches: Branch[];
  profile?: RestaurantProfile;
}

export interface RestaurantProfile {
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
  rating?: number;
  isProfileComplete?: boolean;
}

export interface Branch {
  id: number;
  location: string;
  address: string;
  slots: string[];
  city?: string;
  latitude?: string;
  longitude?: string;
  distance?: number;
  availableSlots?: Array<{ time: string; seats: number }>;
}

export interface Booking {
  id: number;
  userId: number;
  restaurantId: number;
  restaurantName: string;
  branchId: number;
  date: string; // ISO string
  time: string; // Format: "HH:MM"
  partySize: number;
  confirmed: boolean;
  arrived: boolean;
  arrived_at?: string; // ISO string
  completed: boolean;
  cancelled?: boolean;
  createdAt: string; // ISO string
  branchCity?: string;
  branchAddress?: string;
}

// Define type for saved restaurant item
export interface SavedRestaurantItem {
  id: number;
  branchIndex: number;
  restaurantId: number;
  userId: number;
  createdAt: string;
  restaurant: Restaurant;
}

// Base API URL with Expo Constants for dynamic IP detection
const getApiBaseUrl = () => {
  // First check if there's an environment variable set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Use Expo Constants to get the dev server URL
  if (Constants.expoConfig?.hostUri) {
    // hostUri format is typically "192.168.x.x:8081"
    const hostParts = Constants.expoConfig.hostUri.split(':');
    if (hostParts.length > 0) {
      // Use the same IP but with port 4000 for the API server
      return `http://${hostParts[0]}:4000`;
    }
  }

  // Fallback to localhost (will work for development on same machine)
  return 'http://localhost:4000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('Using API base URL:', API_BASE_URL);

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth functions
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
    console.log('Login response:', response.data);
    
    // Save the auth token
    if (response.data.token) {
      await SecureStore.setItemAsync('authToken', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    // Handle different types of errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          // Authentication error - expected during login failures
          console.log('Login failed: Invalid credentials');
          throw {
            type: 'auth_error',
            message: 'Invalid email or password',
            originalError: error
          };
        } else if (error.response.status === 429) {
          // Rate limiting
          console.log('Login failed: Too many attempts');
          throw {
            type: 'rate_limit',
            message: 'Too many login attempts. Please try again later.',
            originalError: error
          };
        } else {
          // Other server errors
          console.error('Server error during login:', error.response.status, error.response.data);
          throw {
            type: 'server_error',
            message: 'Server error. Please try again later.',
            originalError: error
          };
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error during login:', error.message);
        throw {
            type: 'network_error',
            message: 'Network error. Please check your internet connection.',
            originalError: error
        };
      } else {
        // Something happened in setting up the request
        console.error('Error setting up login request:', error.message);
        throw {
            type: 'request_setup_error',
            message: 'Application error. Please try again.',
            originalError: error
        };
      }
    } else {
      // Not an Axios error
      console.error('Unexpected login error:', error);
      throw {
        type: 'unknown_error',
        message: 'An unexpected error occurred. Please try again.',
        originalError: error
      };
    }
  }
};

export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
  birthday: string;
  city: string;
  cuisines: string[];
}) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/register`, userData);
    console.log('Registration response:', response.data);
    
    // Save the auth token
    if (response.data.token) {
      await SecureStore.setItemAsync('authToken', response.data.token);
      
      // After registration and token storage, update the user profile with cuisines
      try {
        // Use the token to update the user profile
        await updateUserProfile({
          firstName: userData.firstName,
          lastName: userData.lastName,
          city: userData.city,
          gender: userData.gender,
          favoriteCuisines: userData.cuisines
        });
        
        // Now get the updated user data
        const updatedUser = await getCurrentUser();
        return { ...response.data, user: updatedUser };
      } catch (profileError) {
        console.error('Error updating profile after registration:', profileError);
        // Continue with the original response even if profile update fails
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const token = await getAuthToken();
    if (token) {
      // Call the logout endpoint if your API has one
      await axios.post(`${API_BASE_URL}/api/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    
    // Remove the token from storage
    await SecureStore.deleteItemAsync('authToken');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Still delete the token even if the API call fails
    await SecureStore.deleteItemAsync('authToken');
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    
    const response = await axios.get(`${API_BASE_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Current user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Restaurant functions
export const getRestaurants = async (params?: Record<string, any>): Promise<Restaurant[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/restaurants`, { params });
    console.log('Restaurants response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get restaurants error:', error);
    throw error;
  }
};

export const getRestaurantById = async (id: number): Promise<Restaurant | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/restaurants/${id}`);
    console.log(`Restaurant ${id} response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Get restaurant ${id} error:`, error);
    throw error;
  }
};

// Bookings functions
export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await api.get('/api/bookings');
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: number): Promise<Booking> => {
  try {
    const response = await api.put(`/api/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling booking ${bookingId}:`, error);
    throw error;
  }
};

export const updateBooking = async (bookingId: number, bookingData: {
  date?: string;
  time?: string;
  partySize?: number;
}): Promise<Booking> => {
  try {
    const response = await api.put(`/api/bookings/${bookingId}`, bookingData);
    return response.data;
  } catch (error) {
    console.error(`Error updating booking ${bookingId}:`, error);
    throw error;
  }
};

export const createBooking = async (bookingData: {
  restaurantId: number;
  branchId: number;
  date: string;
  time: string;
  partySize: number;
}): Promise<Booking> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    // Convert date and time to a single Date object for the server
    // The server expects a single date field with both date and time
    const { date, time, ...otherData } = bookingData;
    
    // Log the data being sent
    console.log('Sending booking data:', { ...otherData, date, time });
    
    // Parse the time from 12-hour format to 24-hour format if needed
    let timeValue = time;
    if (time.includes('AM') || time.includes('PM')) {
      const [timePart, ampm] = time.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      
      let hour24 = hours;
      if (ampm === 'PM' && hours < 12) hour24 += 12;
      if (ampm === 'AM' && hours === 12) hour24 = 0;
      
      timeValue = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Create a combined date-time string
    const dateTime = new Date(`${date}T${timeValue}`);
    
    // Format the data for the server
    const serverData = {
      ...otherData,
      date: dateTime.toISOString(),
    };
    
    console.log('Formatted booking data for server:', serverData);

    const response = await axios.post(`${API_BASE_URL}/api/bookings`, serverData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Create booking response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Create booking error:', error);
    
    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || 'An error occurred';
      
      if (status === 409) {
        throw new Error('Not enough seats available for this time slot. Please select a different time or reduce your party size.');
      } else if (status === 400) {
        throw new Error(errorMessage);
      } else if (status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        throw new Error(`Booking failed: ${errorMessage}`);
      }
    }
    
    throw error;
  }
};

export const updateUserProfile = async (profileData: {
  firstName: string;
  lastName: string;
  city: string;
  gender: string;
  favoriteCuisines: string[];
}): Promise<User> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    console.log('Sending profile update data:', JSON.stringify(profileData, null, 2));

    const response = await axios.put(`${API_BASE_URL}/api/user/profile`, profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Update profile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Saved restaurant branch functions
export const getSavedRestaurants = async (): Promise<SavedRestaurantItem[]> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(`${API_BASE_URL}/api/saved-branches`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Saved restaurant branches response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get saved restaurant branches error:', error);
    throw error;
  }
};

export const saveRestaurant = async (restaurantId: number, branchIndex: number): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    await axios.post(`${API_BASE_URL}/api/saved-branches`, 
      { restaurantId, branchIndex },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (error) {
    console.error('Save restaurant branch error:', error);
    throw error;
  }
};

export const unsaveRestaurant = async (restaurantId: number, branchIndex: number): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    await axios.delete(`${API_BASE_URL}/api/saved-branches/${restaurantId}/${branchIndex}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error('Unsave restaurant branch error:', error);
    throw error;
  }
};

export const isRestaurantSaved = async (restaurantId: number, branchIndex: number): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.get(`${API_BASE_URL}/api/saved-branches/${restaurantId}/${branchIndex}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.saved;
  } catch (error) {
    console.error('Check if restaurant branch is saved error:', error);
    return false;
  }
};

/**
 * Fetches restaurants with availability for a specific date, time, and party size
 * This uses the server's findRestaurantsWithAvailability endpoint which properly populates slot arrays
 */
export const getRestaurantsWithAvailability = async (params?: {
  date?: string;
  time?: string;
  partySize?: number;
  city?: string;
  cuisine?: string;
  priceRange?: string;
  search?: string;
  showSavedOnly?: boolean;
}): Promise<Restaurant[]> => {
  try {
    console.log('Fetching restaurants with availability:', params);
    const response = await api.get('/api/restaurants/availability', { params });
    
    // Ensure each restaurant has its profile data and slots properly structured
    const restaurants = response.data.map((restaurant: any) => {
      // Make sure profile exists and has all required fields
      if (!restaurant.profile) {
        console.warn(`Restaurant ${restaurant.id} (${restaurant.name}) is missing profile data`);
      }
      
      // Process restaurant data
      const processedRestaurant = {
        ...restaurant,
        // Ensure cuisine is available at the top level
        cuisine: restaurant.profile?.cuisine || restaurant.cuisine || 'Various Cuisine',
        // If profile exists, ensure cuisine is set
        profile: restaurant.profile ? {
          ...restaurant.profile,
          // If cuisine is missing in profile but exists at the restaurant level, use that
          cuisine: restaurant.profile.cuisine || restaurant.cuisine || 'Various Cuisine'
        } : undefined
      };
      
      // Ensure branches have proper slots arrays
      if (processedRestaurant.branches && processedRestaurant.branches.length > 0) {
        processedRestaurant.branches = processedRestaurant.branches.map((branch: any) => {
          // Create a default slots array if none exists
          if (!branch.slots) {
            branch.slots = [];
          }
          
          // If branch doesn't have slots but has availableSlots, use those
          if (branch.slots.length === 0 && branch.availableSlots && branch.availableSlots.length > 0) {
            console.log(`Restaurant ${processedRestaurant.id} (${processedRestaurant.name}): Adding slots from availableSlots`);
            branch.slots = branch.availableSlots.map((slot: any) => slot.time || slot);
          }
          
          return branch;
        });
      }
      
      return processedRestaurant;
    });
    
    console.log('Processed restaurants:', restaurants.map((r: any) => ({
      id: r.id,
      name: r.name,
      hasCuisine: !!r.profile?.cuisine,
      cuisine: r.profile?.cuisine,
      branchCount: r.branches?.length || 0,
      hasBranchesWithSlots: r.branches?.some((b: any) => b.slots && b.slots.length > 0)
    })));
    
    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants with availability:', error);
    throw error;
  }
};

// Location-related functions
/**
 * Update the user's current location
 */
export const updateUserLocation = async (latitude: string, longitude: string): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    await api.post('/api/users/location', {
      latitude,
      longitude
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Location updated successfully');
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

/**
 * Get nearby restaurants based on coordinates
 */
export const getNearbyRestaurants = async (params?: {
  latitude?: string;
  longitude?: string;
  radius?: number;
  limit?: number;
}): Promise<Restaurant[]> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params?.latitude) queryParams.append('latitude', params.latitude);
    if (params?.longitude) queryParams.append('longitude', params.longitude);
    if (params?.radius) queryParams.append('radius', params.radius.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = `/api/restaurants/nearby${queryString ? `?${queryString}` : ''}`;
    
    console.log('Calling nearby restaurants API:', url);
    
    const token = await getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await api.get(url, { headers });
    
    // Log the raw response to debug
    console.log('Nearby restaurants API response:', {
      success: response.data.success,
      count: response.data.count,
      hasRestaurants: Array.isArray(response.data.restaurants),
      restaurantsCount: response.data.restaurants?.length || 0
    });
    
    // Log the first restaurant to debug distance data
    if (response.data.restaurants && response.data.restaurants.length > 0) {
      const firstRestaurant = response.data.restaurants[0];
      console.log('First nearby restaurant:', {
        id: firstRestaurant.id,
        name: firstRestaurant.name,
        branchesCount: firstRestaurant.branches?.length || 0,
        firstBranch: firstRestaurant.branches && firstRestaurant.branches.length > 0 ? {
          id: firstRestaurant.branches[0].id,
          distance: firstRestaurant.branches[0].distance,
          hasDistance: firstRestaurant.branches[0].distance !== undefined,
          distanceType: typeof firstRestaurant.branches[0].distance
        } : 'No branches'
      });
    }
    
    // Process the response to ensure distance is properly handled
    const restaurants = response.data.restaurants || [];
    return restaurants.map((restaurant: Restaurant) => ({
      ...restaurant,
      branches: (restaurant.branches || []).map((branch: Branch) => ({
        ...branch,
        // Ensure distance is a number
        distance: typeof branch.distance === 'number' ? branch.distance : 
                 typeof branch.distance === 'string' ? parseFloat(branch.distance) : undefined
      }))
    }));
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    throw error;
  }
};

/**
 * Get restaurant location details
 */
export const getRestaurantLocation = async (restaurantId: number, params?: {
  branchId?: number;
  userLatitude?: string;
  userLongitude?: string;
}): Promise<{ id: number; name: string; branches: Branch[] }> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params?.branchId) queryParams.append('branchId', params.branchId.toString());
    if (params?.userLatitude) queryParams.append('userLatitude', params.userLatitude);
    if (params?.userLongitude) queryParams.append('userLongitude', params.userLongitude);
    
    const queryString = queryParams.toString();
    const url = `/api/restaurants/${restaurantId}/location${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.restaurant;
  } catch (error) {
    console.error(`Error fetching restaurant ${restaurantId} location:`, error);
    throw error;
  }
};

// Password reset functions
export const requestPasswordReset = async (email: string): Promise<{ message: string; previewUrl?: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to request password reset');
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reset-password`, { token, password });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to reset password');
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
};

// Helper function to get auth token
export const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('authToken');
};

// Helper function to clear auth token
export const clearAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('authToken');
};