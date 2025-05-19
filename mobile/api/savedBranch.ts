import apiClient from './api-client';
import { RestaurantBranch } from '../types/restaurant';

// Get all saved branches for the current user
export const getSavedBranches = async (): Promise<RestaurantBranch[]> => {
  const { data } = await apiClient.get<RestaurantBranch[]>('/saved-branch');
  return data;
};

// Get IDs of saved branches for the current user
export const getSavedBranchIds = async (): Promise<number[]> => {
  const { data } = await apiClient.get<number[]>('/saved-branch/ids');
  return data;
};

// Save a branch to favorites
export const saveBranch = async (branchId: number): Promise<void> => {
  await apiClient.post(`/saved-branch/${branchId}`);
};

// Remove a branch from favorites
export const removeSavedBranch = async (branchId: number): Promise<void> => {
  await apiClient.delete(`/saved-branch/${branchId}`);
};
