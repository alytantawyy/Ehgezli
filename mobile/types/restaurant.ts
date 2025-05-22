export interface Restaurant {
  id: number;
  name: string;
  email: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  branches?: RestaurantBranch[];
}

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
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantFilter {
  city?: string;
  cuisine?: string;
  priceRange?: string;
  searchQuery?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  time?: string;
  partySize?: number;
}

export interface BranchWithAvailability extends RestaurantBranch {
  availableSlots?: AvailableSlot[];
  slots?: { time: string }[];
  closingTime?: string;
  distance?: number;
}

export interface RestaurantWithAvailability extends Restaurant {
  branches: BranchWithAvailability[];
}

export interface AvailableSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  remainingSeats: number;
  remainingTables?: number;
}

export interface DetailedRestaurantResponse {
  profile: {
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
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  branches: {
    id: number;
    restaurantId: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  }[];
}

export interface RestaurantSearchResponse {
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

export interface CreateBookingSettingsData {
  openTime: string;
  closeTime: string;
  interval: number;
  maxSeatsPerSlot: number;
  maxTablesPerSlot: number;
}

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

export interface CreateBookingOverrideData {
  date: string;
  startTime: string;
  endTime: string;
  overrideType: string;
  newMaxSeats?: number;
  newMaxTables?: number;
  note?: string;
}
