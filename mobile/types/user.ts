export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  favoriteCuisines: string[];
  birthday: string;
  nationality: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  locationUpdatedAt: string;
  locationPermissionGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
  lastLatitude: number | null;
  lastLongitude: number | null;
  locationUpdatedAt: string;
  locationPermissionGranted: boolean;
}

// For updating user profile
export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  gender?: string;
  favoriteCuisines?: string[];
  birthday?: string;
  nationality?: string;
}