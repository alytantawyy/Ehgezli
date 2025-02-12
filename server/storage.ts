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
  searchRestaurants(query: string): Promise<Restaurant[]>;
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

    // Initialize branches from mock restaurants
    mockRestaurants.forEach(restaurant => {
      restaurant.locations.forEach(location => {
        const branch: RestaurantBranch = {
          id: this.currentBranchId++,
          restaurantId: restaurant.id,
          address: location.address,
          tablesCount: location.tablesCount,
          seatsCount: location.tablesCount * 4, // Assuming 4 seats per table
          openingTime: location.openingTime,
          closingTime: location.closingTime,
        };
        this.branches.set(branch.id, branch);
      });
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
    // Get all registered restaurants
    const registeredRestaurants = Array.from(this.restaurantAuth.values()).map(auth => {
      const profile = Array.from(this.restaurantProfiles.values())
        .find(p => p.restaurantId === auth.id);

      if (!profile) return null;

      const restaurantBranches = Array.from(this.branches.values())
        .filter(b => b.restaurantId === auth.id);

      return {
        id: auth.id,
        name: auth.name,
        description: profile.about,
        about: profile.about,
        authId: auth.id,
        logo: profile.logo || "", // Use the logo from the profile
        cuisine: profile.cuisine,
        locations: restaurantBranches.map(branch => ({
          address: branch.address,
          tablesCount: branch.tablesCount,
          openingTime: branch.openingTime,
          closingTime: branch.closingTime,
        }))
      };
    }).filter(Boolean) as Restaurant[];

    // Combine with mock restaurants
    return [...mockRestaurants as any, ...registeredRestaurants];
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return mockRestaurants.find(r => r.id === id) as any;
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
    const { branches, logo, ...profileData } = profile;

    // Store the profile
    this.restaurantProfiles.set(profileData.restaurantId, {
      ...profileData,
      logo: logo || "", // Include logo in the profile
      id: profileData.restaurantId,
      isProfileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create branches
    branches.forEach((branch) => {
      const branchId = this.currentBranchId++;
      const branchData: RestaurantBranch = {
        id: branchId,
        restaurantId: profileData.restaurantId,
        address: branch.address,
        tablesCount: branch.tablesCount,
        seatsCount: branch.seatsCount,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
      };
      this.branches.set(branchId, branchData);
    });
  }

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const restaurants = await this.getRestaurants();

    return restaurants.filter(restaurant => {
      const matchesName = restaurant.name.toLowerCase().includes(normalizedQuery);
      const matchesCuisine = restaurant.cuisine.toLowerCase().includes(normalizedQuery);
      const matchesLocation = restaurant.locations.some(
        location => location.address.toLowerCase().includes(normalizedQuery)
      );

      return matchesName || matchesCuisine || matchesLocation;
    });
  }
}

export const storage = new MemStorage();