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
  locationPermissionGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
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