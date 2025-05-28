import { create } from 'zustand';
import * as Location from 'expo-location';
import { 
  RestaurantBranch, 
  BranchWithDetails, 
  BranchListItem,
  BranchFilter,
  BranchSearchResponse,
  BranchApiResponse
} from '../types/branch';
import {
  getAllBranches,
  getBranchById,
  searchBranches
} from '../api/branch';
import { updateLocationPermission, getLocationPermissionStatus } from '../api/user';

// Helper function to calculate distance between coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number | null => {
  if (!lat1 || !lon1 || !lat2 || !lon2 || 
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) || 
      lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 || 
      lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) return null;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Transform branch search response to branch list items
const transformBranchData = (data: BranchSearchResponse[]): BranchListItem[] => {
  return data.map(item => ({
    branchId: item.restaurant_branches.id,
    address: item.restaurant_branches.address,
    city: item.restaurant_branches.city,
    latitude: item.restaurant_branches.latitude,
    longitude: item.restaurant_branches.longitude,
    restaurantId: item.restaurant_users.id,
    restaurantName: item.restaurant_users.name,
    cuisine: item.restaurant_profiles.cuisine,
    priceRange: item.restaurant_profiles.priceRange,
    logo: item.restaurant_profiles.logo,
    distance: null // Will be calculated later if user location is available
  }));
};

interface BranchState {
  // Data
  branches: BranchListItem[];
  filteredBranches: BranchListItem[];
  selectedBranch: BranchWithDetails | null;
  userLocation: { latitude: number; longitude: number } | null | undefined;
  hasRequestedLocationPermission: boolean;
  // Status
  loading: boolean;
  error: string | null;
  // Filters
  filter: BranchFilter;
  _lastSearchKey: string | null;
  _lastSearchTime: number | null;
  // Actions
  fetchBranches: () => Promise<void>;
  fetchBranchById: (id: number) => Promise<void>;
  searchBranchesByFilter: (filter: Partial<BranchFilter>) => Promise<void>;
  updateFilter: (filter: Partial<BranchFilter>) => void;
  resetFilters: () => void;
  getUserLocation: () => Promise<void>;
  checkLocationPermission: () => Promise<boolean>;
  calculateDistances: () => void;
  sortByDistance: () => void;
  clearError: () => void;
  setUserLocationNull: () => void;
  setHasRequestedLocationPermission: (value: boolean) => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  // Data
  branches: [],
  filteredBranches: [],
  selectedBranch: null,
  userLocation: undefined,
  hasRequestedLocationPermission: false,
  // Status
  loading: false,
  error: null,
  // Filters
  filter: {
    city: undefined,
    cuisine: undefined,
    priceRange: undefined,
    searchQuery: undefined,
    date: undefined,
    time: undefined,
    partySize: undefined,
    userLatitude: undefined,
    userLongitude: undefined
  },
  _lastSearchKey: null,
  _lastSearchTime: null,
  // Fetch all branches
  fetchBranches: async () => {
    try {
      set({ loading: true, error: null });
      const data = await getAllBranches();
      
      // Transform data to match BranchListItem format
      const branchItems: BranchListItem[] = data.map((branch: BranchApiResponse) => ({
        branchId: branch.branchId,
        address: branch.address || '',
        city: branch.city || '',
        latitude: branch.latitude || 0,
        longitude: branch.longitude || 0,
        restaurantId: branch.restaurantId,
        restaurantName: branch.restaurantName || '',
        cuisine: branch.cuisine || '',
        priceRange: branch.priceRange || '',
        logo: branch.logo || '',
        distance: null
      }));
      
      set({     
        branches: branchItems, 
        filteredBranches: branchItems,
        loading: false 
      });
      
      // Calculate distances if user location is available
      const { userLocation } = get();
      if (userLocation) {
        get().calculateDistances();
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch branches. Please try again.', 
        loading: false 
      });
    }
  },
  
  // Fetch a specific branch by ID
  fetchBranchById: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const data = await getBranchById(id);
      if (data) {
        set({ 
          selectedBranch: data,
          loading: false 
        });
      } else {
        set({ 
          error: 'Branch not found', 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch branch details. Please try again.', 
        loading: false 
      });
    }
  },
  
  // Search branches with filters
  searchBranchesByFilter: async (newFilter: Partial<BranchFilter>) => {
    try {
      // Get current state before any updates
      const currentState = get();
      
      // Check if we're already loading - if so, don't start another search
      if (currentState.loading) {
        return;
      }
      
      // Update filter first
      get().updateFilter(newFilter);
      const updatedFilter = get().filter;
      
      // Check if this is the same as the last search to prevent duplicate calls
      const lastSearchKey = JSON.stringify(updatedFilter);
      
      // Skip if this is exactly the same search as before
      if (lastSearchKey === currentState._lastSearchKey) {
        return;
      }
      
      // Prevent rapid consecutive searches with debouncing
      const now = Date.now();
      if (currentState._lastSearchTime && now - currentState._lastSearchTime < 1000) {
        return;
      }
      
      // Set loading state and update tracking variables BEFORE the async operation
      // This is crucial to prevent race conditions
      set({ 
        _lastSearchKey: lastSearchKey, 
        _lastSearchTime: now,
        loading: true, 
        error: null 
      });
      
      // Add user location to filter if available
      const { userLocation } = get();
      if (userLocation) {
        updatedFilter.userLatitude = userLocation.latitude;
        updatedFilter.userLongitude = userLocation.longitude;
      }
      
      // Perform the actual API call
      const data = await searchBranches(updatedFilter);
      const branchItems = transformBranchData(data);
      
      // Calculate distances if user location is available
      if (userLocation) {
        branchItems.forEach(branch => {
          branch.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            branch.latitude,
            branch.longitude
          );
        });
      }
      
      // Make sure we're still the most recent search before updating state
      // This prevents race conditions where a newer search completes before an older one
      if (get()._lastSearchKey === lastSearchKey) {
        set({ 
          filteredBranches: branchItems,
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: 'Failed to search branches. Please try again.', 
        loading: false 
      });
    }
  },
  
  // Update filter
  updateFilter: (newFilter: Partial<BranchFilter>) => {
    set(state => ({
      filter: { ...state.filter, ...newFilter }
    }));
  },
  
  // Reset filters
  resetFilters: () => {
    set({
      filter: {
        city: undefined,
        cuisine: undefined,
        priceRange: undefined,
        searchQuery: undefined,
        date: undefined,
        time: undefined,
        partySize: undefined,
        userLatitude: undefined,
        userLongitude: undefined
      }
    });
  },
  
  // Get user location
  getUserLocation: async () => {
    try {
      // Check if we already tried and failed to get location permission
      const { userLocation: currentLocation } = get();
      if (currentLocation === null) {
        // We've already tried and set userLocation to null, don't try again
        console.log('Location permissions were previously denied, not requesting again');
        return;
      }
      
      console.log('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      console.log(`Location permission status: ${status}`);
      
      if (status !== 'granted') {
        // Set userLocation to null to indicate we've tried and failed
        console.log('Location permissions denied by user');
        set({ userLocation: null });
        return;
      }
      
      // Even if permissions are "granted", we need to be careful about simulator environments
      console.log('Location permissions granted, getting current position');
      
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        // Check if these are the default simulator coordinates (San Francisco)
        const isSanFranciscoDefault = 
          Math.abs(location.coords.latitude - 37.785834) < 0.0001 && 
          Math.abs(location.coords.longitude - (-122.406417)) < 0.0001;
          
        // We'll use the coordinates even if they're the default ones
        // Just log a warning in development mode
        if (isSanFranciscoDefault && __DEV__) {
          console.log('Using default simulator location coordinates for development.');
        }
        
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        console.log(`User location obtained: ${locationData.latitude}, ${locationData.longitude}`);
        set({ 
          userLocation: locationData,
          hasRequestedLocationPermission: true // Ensure this is set when we get location
        });
        
        // Update permission status in database (without sending coordinates)
        try {
          await updateLocationPermission(true);
        } catch (error) {
          console.log('Error updating location permission in database:', error);
        }
        
        // Calculate distances for branches
        get().calculateDistances();
      } catch (locationError) {
        console.log('Error getting specific location:', locationError);
        set({ userLocation: null });
      }
    } catch (error) {
      console.log('Error getting location:', error);
      // Set userLocation to null to indicate we've tried and failed
      set({ userLocation: null });
    }
  },
  
  // Check if location permission was previously granted
  checkLocationPermission: async () => {
    try {
      // Check if permission was already granted in a previous session
      const permissionGranted = await getLocationPermissionStatus();
      
      if (permissionGranted) {
        console.log("Permission was already granted in a previous session");
        set({ hasRequestedLocationPermission: true });
        
        // Get the user's location directly without showing dialog
        get().getUserLocation();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking location permission:", error);
      return false;
    }
  },
  
  // Calculate distances for all branches
  calculateDistances: () => {
    const { branches, userLocation } = get();
    
    // Only calculate distances if we have valid user location
    // This prevents using default coordinates when permissions aren't granted
    if (!userLocation || userLocation === null) {
      console.log('No valid user location available, skipping distance calculation');
      return;
    }
    
    // Additional validation to ensure we have valid coordinates
    if (!userLocation.latitude || !userLocation.longitude || 
        isNaN(userLocation.latitude) || isNaN(userLocation.longitude) || 
        userLocation.latitude < -90 || userLocation.latitude > 90 || 
        userLocation.longitude < -180 || userLocation.longitude > 180) {
      console.log('Invalid user location coordinates, skipping distance calculation');
      return;
    }
    
    const branchesWithDistance = branches.map(branch => ({
      ...branch,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        branch.latitude,
        branch.longitude
      )
    }));
    
    set({ 
      branches: branchesWithDistance,
      filteredBranches: get().filteredBranches.map(branch => ({
        ...branch,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          branch.latitude,
          branch.longitude
        )
      }))
    });
  },
  
  // Sort branches by distance
  sortByDistance: () => {
    set(state => ({
      filteredBranches: [...state.filteredBranches].sort((a, b) => {
        // Handle undefined or null cases
        if ((a.distance === undefined || a.distance === null) && 
            (b.distance === undefined || b.distance === null)) return 0;
        if (a.distance === undefined || a.distance === null) return 1;
        if (b.distance === undefined || b.distance === null) return -1;
        return a.distance - b.distance;
      })
    }));
  },
  
  // Clear error
  clearError: () => set({ error: null }),
  
  // Set userLocation to null explicitly (used when permission is denied)
  setUserLocationNull: () => {
    console.log('Setting userLocation to null explicitly');
    set({ userLocation: null });
  },
  
  // Set hasRequestedLocationPermission flag
  setHasRequestedLocationPermission: (value: boolean) => {
    console.log(`Setting hasRequestedLocationPermission to ${value}`);
    set({ hasRequestedLocationPermission: value });
  },
}));
