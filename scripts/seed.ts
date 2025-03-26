import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, restaurantAuth, restaurantProfiles, restaurantBranches, bookings, passwordResetTokens, restaurantPasswordResetTokens } from '../shared/schema';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env file');
}

const sql_client = neon(process.env.DATABASE_URL);
const db = drizzle(sql_client);

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data in correct order (respecting foreign keys)
  console.log('Clearing existing data...');
  await db.delete(passwordResetTokens);
  await db.delete(restaurantPasswordResetTokens);
  await db.delete(bookings);
  await db.delete(restaurantBranches);
  await db.delete(restaurantProfiles);
  await db.delete(restaurantAuth);
  await db.delete(users);
  // Clear sessions
  await db.execute(sql`DELETE FROM session`);
  console.log('✅ Cleared existing data');

  // Create test users
  const [user1, user2, user3, user4] = await Promise.all([
    db.insert(users).values({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1990-01-01'),
      city: 'Alexandria',
      favoriteCuisines: ['Italian', 'Japanese']
    }).returning(),
    db.insert(users).values({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1992-05-15'),
      city: 'Cairo',
      favoriteCuisines: ['Mexican', 'Indian']
    }).returning(),
    db.insert(users).values({
      firstName: 'Ahmed',
      lastName: 'Hassan',
      email: 'ahmed@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1988-03-20'),
      city: 'Alexandria',
      favoriteCuisines: ['Egyptian', 'Lebanese']
    }).returning(),
    db.insert(users).values({
      firstName: 'Sara',
      lastName: 'Mohamed',
      email: 'sara@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1995-11-10'),
      city: 'Cairo',
      favoriteCuisines: ['Chinese', 'Thai']
    }).returning()
  ]);

  console.log('✅ Created test users');

  // Create test restaurants with auth and profiles
  const restaurants = await Promise.all(
    [
      {
        auth: {
          email: 'italiano@example.com',
          password: 'password123',
          name: 'Italiano Authentic'
        },
        profile: {
          about: 'Experience authentic Italian cuisine in the heart of Alexandria.',
          cuisine: 'Italian',
          priceRange: '$$$',
          logo: 'https://example.com/italiano-logo.png'
        },
        branches: [
          {
            address: '123 Mediterranean Ave',
            city: 'Alexandria',
            tablesCount: 15,
            seatsCount: 60,
            openingTime: '12:00',
            closingTime: '23:00'
          },
          {
            address: '456 Nile View St',
            city: 'Cairo',
            tablesCount: 20,
            seatsCount: 80,
            openingTime: '12:00',
            closingTime: '00:00'
          }
        ]
      },
      {
        auth: {
          email: 'sakura@example.com',
          password: 'password123',
          name: 'Sakura Japanese'
        },
        profile: {
          about: 'Traditional Japanese cuisine with a modern twist.',
          cuisine: 'Japanese',
          priceRange: '$$$$',
          logo: 'https://example.com/sakura-logo.png'
        },
        branches: [
          {
            address: '789 Coastal Road',
            city: 'Alexandria',
            tablesCount: 12,
            seatsCount: 48,
            openingTime: '13:00',
            closingTime: '23:00'
          }
        ]
      },
      {
        auth: {
          email: 'lebanese@example.com',
          password: 'password123',
          name: 'Lebanese House'
        },
        profile: {
          about: 'Authentic Lebanese cuisine and mezze.',
          cuisine: 'Lebanese',
          priceRange: '$$',
          logo: 'https://example.com/lebanese-logo.png'
        },
        branches: [
          {
            address: '321 Downtown Square',
            city: 'Cairo',
            tablesCount: 25,
            seatsCount: 100,
            openingTime: '11:00',
            closingTime: '01:00'
          },
          {
            address: '654 Seafront Road',
            city: 'Alexandria',
            tablesCount: 18,
            seatsCount: 72,
            openingTime: '11:00',
            closingTime: '00:00'
          }
        ]
      }
    ].map(async (restaurant) => {
      // Create restaurant auth
      const [authEntry] = await db.insert(restaurantAuth).values({
        email: restaurant.auth.email,
        password: await hashPassword(restaurant.auth.password),
        name: restaurant.auth.name,
        verified: true
      }).returning();

      // Create restaurant profile
      const [profileEntry] = await db.insert(restaurantProfiles).values({
        restaurantId: authEntry.id,
        about: restaurant.profile.about,
        description: restaurant.profile.about, 
        cuisine: restaurant.profile.cuisine,
        priceRange: restaurant.profile.priceRange,
        logo: restaurant.profile.logo,
        isProfileComplete: true
      }).returning();

      // Create restaurant branches
      const branchEntries = await Promise.all(
        restaurant.branches.map(branch =>
          db.insert(restaurantBranches).values({
            restaurantId: authEntry.id,
            ...branch
          }).returning()
        )
      );

      return {
        auth: authEntry,
        profile: profileEntry,
        branches: branchEntries.map(b => b[0])
      };
    })
  );

  console.log('✅ Created test restaurants with branches');

  // Create test bookings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  // Helper to create a booking time
  const createBookingTime = (baseDate: Date, hours: number, minutes = 0) => {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  await Promise.all([
    // Past bookings
    db.insert(bookings).values({
      date: createBookingTime(now, now.getHours() - 3),
      userId: user1[0].id,
      branchId: restaurants[0].branches[0].id,
      partySize: 4,
      confirmed: true,
      arrived: true,
      completed: true,
      arrivedAt: createBookingTime(now, now.getHours() - 2)
    }),
    db.insert(bookings).values({
      date: createBookingTime(now, now.getHours() - 2),
      userId: user2[0].id,
      branchId: restaurants[1].branches[0].id,
      partySize: 2,
      confirmed: true,
      arrived: true,
      completed: true,
      arrivedAt: createBookingTime(now, now.getHours() - 1)
    }),

    // Currently seated bookings
    db.insert(bookings).values({
      date: createBookingTime(now, now.getHours() - 1),
      userId: user3[0].id,
      branchId: restaurants[0].branches[1].id,
      partySize: 6,
      confirmed: true,
      arrived: true,
      completed: false,
      arrivedAt: now
    }),
    db.insert(bookings).values({
      date: createBookingTime(now, now.getHours() - 1),
      userId: user4[0].id,
      branchId: restaurants[2].branches[0].id,
      partySize: 3,
      confirmed: true,
      arrived: true,
      completed: false,
      arrivedAt: now
    }),

    // Upcoming bookings for today
    db.insert(bookings).values({
      date: createBookingTime(now, now.getHours() + 2),
      userId: user1[0].id,
      branchId: restaurants[2].branches[1].id,
      partySize: 4,
      confirmed: true,
      arrived: false,
      completed: false
    }),
    db.insert(bookings).values({
      date: createBookingTime(now, now.getHours() + 3),
      userId: user2[0].id,
      branchId: restaurants[1].branches[0].id,
      partySize: 2,
      confirmed: true,
      arrived: false,
      completed: false
    }),

    // Future bookings
    db.insert(bookings).values({
      date: createBookingTime(tomorrow, 19),
      userId: user3[0].id,
      branchId: restaurants[0].branches[0].id,
      partySize: 8,
      confirmed: true,
      arrived: false,
      completed: false
    }),
    db.insert(bookings).values({
      date: createBookingTime(tomorrow, 20),
      userId: user4[0].id,
      branchId: restaurants[2].branches[0].id,
      partySize: 5,
      confirmed: true,
      arrived: false,
      completed: false
    }),
    db.insert(bookings).values({
      date: createBookingTime(nextWeek, 19, 30),
      userId: user1[0].id,
      branchId: restaurants[1].branches[0].id,
      partySize: 4,
      confirmed: false,
      arrived: false,
      completed: false
    }),
    db.insert(bookings).values({
      date: createBookingTime(nextWeek, 20, 30),
      userId: user2[0].id,
      branchId: restaurants[0].branches[1].id,
      partySize: 6,
      confirmed: false,
      arrived: false,
      completed: false
    })
  ]);

  console.log('✅ Created test bookings');
  console.log('✨ Seeding complete!');
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
