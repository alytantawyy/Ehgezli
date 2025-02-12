import { 
  InsertUser, User, Restaurant, Booking, RestaurantBranch,
  mockRestaurants, RestaurantAuth, InsertRestaurantAuth,
  restaurantProfiles, restaurantBranches, type InsertRestaurantProfile
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
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookings: Map<number, Booking>;
  private branches: Map<number, RestaurantBranch>;
  private restaurantAuth: Map<number, RestaurantAuth>;
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
          capacity: location.capacity,
          tablesCount: location.tablesCount,
          openingTime: location.openingTime,
          closingTime: location.closingTime,
          reservationDuration: location.reservationDuration
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
    return mockRestaurants as any;
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

  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void> {
    // Create the restaurant profile
    const { branches, ...profileData } = profile;

    // In memory implementation - just store it without actual database operations
    // In a real database implementation, this would create records in both tables

    // Create branches
    branches.forEach((branch) => {
      const branchData = {
        ...branch,
        restaurantId: profileData.restaurantId,
      };
      // Store branch data
    });
  }
}

export const storage = new MemStorage();