import { 
  InsertUser, User, Restaurant, Booking, RestaurantBranch,
  mockRestaurants, RestaurantAuth, InsertRestaurantAuth,
  restaurantProfiles, restaurantBranches, type InsertRestaurantProfile, RestaurantProfile
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]>;
  createBooking(booking: Omit<Booking, "id" | "confirmed">): Promise<Booking>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined>;
  getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined>;
  createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth>;
  createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void>;
  getRestaurantProfile(restaurantId: number): Promise<RestaurantProfile | undefined>;
  sessionStore: session.Store;
  searchRestaurants(query: string, city?: string): Promise<Restaurant[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookings: Map<number, Booking>;
  private branches: Map<number, RestaurantBranch>;
  private restaurantAuth: Map<number, RestaurantAuth>;
  private restaurantProfiles: Map<number, RestaurantProfile>;
  private currentUserId: number;
  private currentBookingId: number;
  private currentBranchId: number;
  private currentRestaurantAuthId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    this.branches = new Map();
    this.restaurantAuth = new Map();
    this.restaurantProfiles = new Map();
    this.currentUserId = 1;
    this.currentBookingId = 1;
    this.currentBranchId = 1;
    this.currentRestaurantAuthId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    const registeredRestaurants = Array.from(this.restaurantAuth.values())
      .map(auth => {
        const profile = Array.from(this.restaurantProfiles.values())
          .find(p => p.restaurantId === auth.id);

        if (!profile) return null;

        const restaurantBranches = Array.from(this.branches.values())
          .filter(b => b.restaurantId === auth.id);

        // Only return if restaurant has a complete profile and at least one branch
        if (!restaurantBranches.length) return null;

        return {
          id: auth.id,
          authId: auth.id,
          name: auth.name,
          description: profile.about.slice(0, 100) + (profile.about.length > 100 ? '...' : ''),
          about: profile.about,
          logo: profile.logo || "",
          cuisine: profile.cuisine,
          locations: restaurantBranches.map(branch => ({
            address: branch.address,
            capacity: branch.seatsCount,
            tablesCount: branch.tablesCount,
            openingTime: branch.openingTime,
            closingTime: branch.closingTime,
            reservationDuration: 60
          }))
        };
      })
      .filter(Boolean) as Restaurant[];

    return registeredRestaurants;
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const restaurants = await this.getRestaurants();
    return restaurants.find(r => r.id === id);
  }

  async getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]> {
    return Array.from(this.branches.values()).filter(
      branch => branch.restaurantId === restaurantId
    );
  }

  async createBooking(booking: Omit<Booking, "id" | "confirmed">): Promise<Booking> {
    const id = this.currentBookingId++;
    const newBooking = { ...booking, id, confirmed: false };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined> {
    return this.restaurantAuth.get(id);
  }

  async getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined> {
    return Array.from(this.restaurantAuth.values()).find(
      (auth) => auth.email === email
    );
  }

  async createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth> {
    const id = this.currentRestaurantAuthId++;
    const restaurantAuth = {
      ...auth,
      id,
      verified: false,
      createdAt: new Date()
    };
    this.restaurantAuth.set(id, restaurantAuth);
    return restaurantAuth;
  }

  async getRestaurantProfile(restaurantId: number): Promise<RestaurantProfile | undefined> {
    return this.restaurantProfiles.get(restaurantId);
  }

  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void> {
    const { branches, ...profileData } = profile;

    // Store the profile
    this.restaurantProfiles.set(profileData.restaurantId, {
      ...profileData,
      id: profileData.restaurantId,
      isProfileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create branches for each city/location
    branches.forEach((branch) => {
      const branchId = this.currentBranchId++;
      const branchData: RestaurantBranch = {
        id: branchId,
        restaurantId: profileData.restaurantId,
        address: `${branch.address}, ${branch.city}`, // Include city in address
        tablesCount: branch.tablesCount,
        seatsCount: branch.seatsCount,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
      };
      this.branches.set(branchId, branchData);
    });
  }

  async searchRestaurants(query: string, city?: string): Promise<Restaurant[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const restaurants = await this.getRestaurants();
    const uniqueRestaurants = new Map<number, Restaurant>();

    restaurants.forEach(restaurant => {
      if (uniqueRestaurants.has(restaurant.id)) return;

      // If city filter is active, check if any branch is in the specified city
      if (city) {
        const hasLocationInCity = restaurant.locations?.some(location => {
          const locationAddress = (location as { address: string }).address.toLowerCase();
          // Check if the branch address contains the city name
          return locationAddress.includes(`, ${city.toLowerCase()}`);
        });

        if (!hasLocationInCity) return;
      }

      // If no search query, add restaurant (it passed city filter)
      if (!normalizedQuery) {
        uniqueRestaurants.set(restaurant.id, restaurant);
        return;
      }

      // Apply text search filters
      const matchesName = restaurant.name.toLowerCase().includes(normalizedQuery);
      const matchesCuisine = restaurant.cuisine.toLowerCase().includes(normalizedQuery);
      const matchesLocation = restaurant.locations?.some(location => {
        const address = (location as { address: string }).address.toLowerCase();
        return address.includes(normalizedQuery);
      });

      if (matchesName || matchesCuisine || matchesLocation) {
        uniqueRestaurants.set(restaurant.id, restaurant);
      }
    });

    return Array.from(uniqueRestaurants.values());
  }
}

export const storage = new MemStorage();