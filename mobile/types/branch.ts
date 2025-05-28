// Core branch data
export interface RestaurantBranch {
  id: number;
  restaurantId: number;
  restaurantName?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
  closingHours?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  bookingSettings?: BookingSettings;
}

export interface BookingSettings {
  id: number;
  branchId: number;
  interval: number;
  maxSeatsPerSlot: number;
  maxTablesPerSlot: number;
  openTime: string;
  closeTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingSettingsData {
  openTime: string;
  closeTime: string;
  interval: number;
  maxSeatsPerSlot: number;
  maxTablesPerSlot: number;
}

export interface BookingOverride {
  id: number;
  branchId: number;
  date: string;
  startTime: string;
  endTime: string;
  overrideType: string;
  newMaxSeats?: number;
  newMaxTables?: number;
  note?: string;
}

export interface CreateBookingOverrideData {
  date: string;
  startTime: string;
  endTime: string;
  overrideType: string;
  newMaxSeats?: number;
  newMaxTables?: number;
  note?: string;
}

// Branch creation data
export interface CreateBranchData {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
  closingHours?: string;
  bookingSettings: CreateBookingSettingsData;
}

// Branch with details from our new API endpoint
export interface BranchWithDetails {
  branchId: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  restaurantName: string;
  about: string;
  description: string;
  cuisine: string;
  priceRange: string;
  logo: string;
  distance?: number;
}

// Branch search response format
export interface BranchSearchResponse {
  restaurant_profiles: {
    id: number;
    restaurantId: number;
    about: string;
    description: string;
    cuisine: string;
    priceRange: string;
    logo: string;
    isProfileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  restaurant_users: {
    id: number;
    email: string;
    name: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  restaurant_branches: {
    id: number;
    restaurantId: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

// Branch with calculated distance
export interface BranchWithDistance extends RestaurantBranch {
  distance: number | null;
  restaurantName: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
}

// For the home screen list
export interface BranchListItem {
  branchId: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  restaurantId: number;
  restaurantName: string;
  cuisine: string;
  priceRange: string;
  logo: string;
  distance?: number | null;
  availability?: number; // Higher number means more availability
  timeSlots?: TimeSlot[]; // Array of time slots for availability calculation
}

// Time slot for branch list items
export interface TimeSlot {
  time: string;
  isFull: boolean;
}

// Branch filter options
export interface BranchFilter {
  city?: string;
  cuisine?: string;
  priceRange?: string;
  searchQuery?: string;
  name?: string;
  date?: string;
  time?: string;
  partySize?: number;
  userLatitude?: number;
  userLongitude?: number;
}

// Availability slot
export interface AvailableSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  remainingSeats: number;
  remainingTables?: number;
}

// Branch with availability information
export interface BranchWithAvailability extends RestaurantBranch {
  availableSlots?: AvailableSlot[];
  slots?: { time: string }[];
  closingTime?: string;
  distance?: number;
}

// API response type for getAllBranches
export interface BranchApiResponse {
  branchId: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  restaurantId: number;
  restaurantName: string;
  cuisine: string;
  priceRange: string;
  logo: string;
}

// Booking settings creation data
export interface CreateBookingSettingsData {
  openTime: string;
  closeTime: string;
  interval: number;
  maxSeatsPerSlot: number;
  maxTablesPerSlot: number;
}

// Booking override creation data
export interface CreateBookingOverrideData {
  date: string;
  startTime: string;
  endTime: string;
  overrideType: string;
  newMaxSeats?: number;
  newMaxTables?: number;
  note?: string;
}