import { useEffect, useCallback, useRef } from 'react';
import { useBranchStore } from '../store/branch-store';
import { BranchFilter } from '../types/branch';

export const useBranches = () => {
  // Get state and actions from the branch store
  const {
    branches,
    filteredBranches,
    selectedBranch,
    loading,
    error,
    filter,
    userLocation,
    fetchBranches,
    fetchBranchById,
    searchBranchesByFilter,
    updateFilter,
    resetFilters,
    getUserLocation,
    calculateDistances,
    calculateAvailability,
    updateBranchTimeSlots,
    sortBranches,
    sortByDistance,
    clearError
  } = useBranchStore();

  // Track if we've already initialized
  const initialized = useRef(false);

  // Fetch branches and get location only once on component mount
  useEffect(() => {
    // Skip if we've already initialized
    if (initialized.current) return;
    
    const init = async () => {
      // Mark as initialized immediately to prevent multiple calls
      initialized.current = true;
      
      // Only fetch branches if we don't have any and we're not already loading
      if (branches.length === 0 && !loading) {
        console.log('Fetching branches for the first time');
        await fetchBranches();
      }
      
      // Only try to get location if it's undefined
      if (userLocation === undefined) {
        console.log('Getting user location');
        await getUserLocation();
      }
      
      // Sort branches using our multi-criteria sorting function
      // This will sort by: 1) availability, 2) distance, 3) saved status, 4) cuisine
      console.log('Sorting branches by availability, distance, saved status, and cuisine');
      sortBranches();
    };
    
    init();
    
  // We need to include sortBranches in dependencies, but we don't want this 
  // effect to re-run when it changes, so we're intentionally leaving it out
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sort branches whenever location or saved branches change
  useEffect(() => {
    // Skip the initial render
    if (!initialized.current) return;
    
    // Only sort if we have branches to sort
    if (branches.length > 0) {
      console.log('Re-sorting branches due to location or saved branches change');
      sortBranches();
    }
  }, [userLocation, sortBranches, branches.length]);

  // Search branches with a text query
  const searchBranches = useCallback((query: string) => {
    updateFilter({ searchQuery: query });
    searchBranchesByFilter({ searchQuery: query });
  }, [updateFilter, searchBranchesByFilter]);

  // Filter branches by city
  const filterByCity = useCallback((city: string | null) => {
    updateFilter({ city: city || undefined });
    searchBranchesByFilter({ city: city || undefined });
  }, [updateFilter, searchBranchesByFilter]);

  // Filter branches by cuisine
  const filterByCuisine = useCallback((cuisine: string | null) => {
    updateFilter({ cuisine: cuisine || undefined });
    searchBranchesByFilter({ cuisine: cuisine || undefined });
  }, [updateFilter, searchBranchesByFilter]);

  // Filter branches by price range
  const filterByPriceRange = useCallback((priceRange: string | null) => {
    updateFilter({ priceRange: priceRange || undefined });
    searchBranchesByFilter({ priceRange: priceRange || undefined });
  }, [updateFilter, searchBranchesByFilter]);

  // Filter branches by availability (date, time, party size)
  const filterByAvailability = useCallback((date?: string, time?: string, partySize?: number) => {
    updateFilter({ date, time, partySize });
    searchBranchesByFilter({ date, time, partySize });
  }, [updateFilter, searchBranchesByFilter]);

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    resetFilters();
    searchBranchesByFilter({});
  }, [resetFilters, searchBranchesByFilter]);

  // Get unique cities from branches
  const getUniqueCities = useCallback(() => {
    const cities = branches.map(branch => branch.city).filter(Boolean);
    return [...new Set(cities)];
  }, [branches]);

  // Get unique cuisines from branches
  const getUniqueCuisines = useCallback(() => {
    const cuisines = branches.map(branch => branch.cuisine).filter(Boolean);
    return [...new Set(cuisines)];
  }, [branches]);

  // Get unique price ranges from branches
  const getUniquePriceRanges = useCallback(() => {
    const priceRanges = branches.map(branch => branch.priceRange).filter(Boolean);
    return [...new Set(priceRanges)];
  }, [branches]);

  return {
    // Data
    branches,
    filteredBranches,
    selectedBranch,
    loading,
    error,
    userLocation,
    
    // Actions
    fetchBranches,
    fetchBranchById,
    searchBranches,
    filterByCity,
    filterByCuisine,
    filterByPriceRange,
    filterByAvailability,
    resetAllFilters,
    sortByDistance,
    sortBranches,
    calculateAvailability,
    updateBranchTimeSlots,
    getUniqueCities,
    getUniqueCuisines,
    getUniquePriceRanges,
    clearError
  };
};
