import apiClient from './api-client';
import { RestaurantBranch, CreateBranchData, BranchSearchResponse, BranchApiResponse, BranchWithDetails } from '../types/branch';

// Define the response type for branch availability
export interface BranchAvailabilityResponse {
  date: string;
  availableSlots: {
    id: number;
    time: string;
    startTime: string;
    endTime: string;
    availableSeats: number;
    availableTables: number;
    isAvailable: boolean;
    overlappingBookingsCount?: number; // Added for debugging overlapping bookings
  }[];
  hasAvailability: boolean;
}

// Get a single branch by ID
export const getBranchById = async (branchId: number) => {
  try {
    console.log(`Fetching branch with ID: ${branchId}`);
    const { data } = await apiClient.get<any>(`/branch/${branchId}`);
    console.log('Branch data received:', data);
    
    // Handle case where API returns an array with a single branch object
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching branch by ID:', error);
    throw error;
  }
};



// Create a new branch (restaurant owners only)
export const createBranch = async (branchData: CreateBranchData) => {
  const { data } = await apiClient.post<RestaurantBranch>(`/branch`, branchData);
  return data;
};

// Update a branch (restaurant owners only)
export const updateBranch = async (branchId: number, branchData: Partial<RestaurantBranch>) => {
  const { data } = await apiClient.put<RestaurantBranch>(`/branch/${branchId}`, branchData);
  return data;
};

// Delete a branch (restaurant owners only)
export const deleteBranch = async (branchId: number) => {
  await apiClient.delete(`/branch/${branchId}`);
};

// Get all branches for a restaurant
export const getBranchesForRestaurant = async (restaurantId: number) => {
  const { data } = await apiClient.get<RestaurantBranch[]>(`/branches/restaurant/${restaurantId}`);
  return data;
};

// Get all branches (admin only)
export const getAllBranches = async () => {
  const { data } = await apiClient.get<BranchApiResponse[]>(`/branches/all`);
  return data;
};

// Get branch availability for a specific date
export const getBranchAvailability = async (branchId: number, date: string): Promise<BranchAvailabilityResponse> => {
  try {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    const { data } = await apiClient.get<BranchAvailabilityResponse>(`/branch/${branchId}/availability/${date}`);
    return data;
  } catch (error) {
    console.error('Error fetching branch availability:', error);
    throw error;
  }
};

// Search branches
export const searchBranches = async (searchParams: any) => {
  const { data } = await apiClient.post<BranchSearchResponse[]>(`/branch/search`, searchParams);
  return data;
};
