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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  isAvailable: boolean;
  maxSeatsOverride?: number;
  maxTablesOverride?: number;
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
