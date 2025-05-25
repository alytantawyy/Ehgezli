import apiClient from './api-client';
import { RestaurantBranch, CreateBranchData, BranchSearchResponse, BranchApiResponse, BranchWithDetails } from '../types/branch';

// Get a single branch by ID
export const getBranchById = async (branchId: number) => {
  const { data } = await apiClient.get<BranchWithDetails>(`/branch/${branchId}`);
  return data;
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
export const getBranchAvailability = async (branchId: number, date: string) => {
  const { data } = await apiClient.get(`/branch/${branchId}/availability/${date}`);
  return data;
};

// Search branches
export const searchBranches = async (searchParams: any) => {
  const { data } = await apiClient.post<BranchSearchResponse[]>(`/branch/search`, searchParams);
  return data;
};
