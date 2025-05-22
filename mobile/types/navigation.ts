/**
 * Navigation Types
 * 
 * Type definitions for app routes to avoid using 'as any' assertions
 * This centralizes all route paths in one place for better maintainability
 */

// Auth routes
export const AuthRoute = {
  login: '/auth',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
} as const;

// User routes
export const UserRoute = {
  tabs: '/user/(tabs)',
  bookings: '/user/(tabs)/bookings',
  profile: '/user/(tabs)/profile',
  bookingDetails: (id: string) => `/user/booking-details?id=${id}`,
  restaurantDetails: (id: string) => `/user/restaurant-details?id=${id}`,
  editProfile: '/user/edit-profile',
  settings: '/user/settings',
  notifications: '/user/notifications',
} as const;

// Restaurant routes
export const RestaurantRoute = {
  tabs: '/restaurant/(tabs)',
  dashboard: '/restaurant/(tabs)',
  bookings: '/restaurant/(tabs)/bookings',
  branches: '/restaurant/(tabs)/branches',
  profile: '/restaurant/(tabs)/profile',
  reservationDetails: (id: string) => `/restaurant/reservation-details?id=${id}`,
  branchDetails: (id: string) => `/restaurant/branch-details?id=${id}`,
  addBranch: '/restaurant/add-branch',
  editBranch: (id: string) => `/restaurant/edit-branch?id=${id}`,
  editProfile: '/restaurant/edit-profile',
  settings: '/restaurant/settings',
  calendarView: '/restaurant/calendar-view',
  analytics: '/restaurant/analytics',
} as const;

// App routes (for root navigation)
export const AppRoute = {
  root: '/',
  ...AuthRoute,
  ...UserRoute,
  ...RestaurantRoute,
} as const;

// Type for all route paths
export type AppRoutePath = typeof AppRoute[keyof typeof AppRoute];

// Type for auth route paths
export type AuthRoutePath = typeof AuthRoute[keyof typeof AuthRoute];

// Type for user route paths
export type UserRoutePath = typeof UserRoute[keyof typeof UserRoute];

// Type for restaurant route paths
export type RestaurantRoutePath = typeof RestaurantRoute[keyof typeof RestaurantRoute];

// Type for route parameters
export interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}
