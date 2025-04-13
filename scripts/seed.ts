import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, restaurantAuth, restaurantProfiles, restaurantBranches, bookings, passwordResetTokens, restaurantPasswordResetTokens, savedRestaurants } from '../shared/schema';
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

// Helper function to generate a random date within a range
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to pick random items from an array
function pickRandom<T>(arr: T[], count: number): T[] {
  const result: T[] = [];
  const copy = [...arr];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy[index]);
    copy.splice(index, 1);
  }
  return result;
}

// Tampa coordinates for different locations
const tampaLocations = [
  { latitude: '27.9506', longitude: '-82.4572' }, // Downtown Tampa
  { latitude: '27.9658', longitude: '-82.5307' }, // Westshore
  { latitude: '27.9777', longitude: '-82.3334' }, // East Tampa
  { latitude: '28.0192', longitude: '-82.4301' }, // USF Area
  { latitude: '27.9478', longitude: '-82.4584' }, // Channel District
  { latitude: '27.9654', longitude: '-82.4301' }, // Ybor City
  { latitude: '27.9420', longitude: '-82.4609' }, // Hyde Park
  { latitude: '28.0550', longitude: '-82.4143' }, // Temple Terrace
  { latitude: '27.9160', longitude: '-82.4593' }, // Davis Islands
  { latitude: '27.9238', longitude: '-82.4637' }, // Harbour Island
  { latitude: '27.9959', longitude: '-82.3452' }, // Tampa Palms
  { latitude: '27.9759', longitude: '-82.5371' }, // International Plaza
  { latitude: '28.0836', longitude: '-82.4500' }, // New Tampa
  { latitude: '27.9058', longitude: '-82.5137' }, // South Tampa
  { latitude: '27.9253', longitude: '-82.3300' }, // Brandon
];

async function seed() {
  console.log('Seeding database...');

  // Clear existing data in correct order (respecting foreign keys)
  console.log('Clearing existing data...');
  await db.delete(savedRestaurants);
  await db.delete(passwordResetTokens);
  await db.delete(restaurantPasswordResetTokens);
  await db.delete(bookings);
  await db.delete(restaurantBranches);
  await db.delete(restaurantProfiles);
  await db.delete(restaurantAuth);
  await db.delete(users);

  // Create test users (10 users)
  const userPromises: Promise<any>[] = [];
  const testUsers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      gender: 'male',
      birthday: new Date('1990-01-01'),
      city: 'Alexandria',
      favoriteCuisines: ['Italian', 'Japanese'],
      lastLatitude: tampaLocations[0].latitude,
      lastLongitude: tampaLocations[0].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'password123',
      gender: 'female',
      birthday: new Date('1992-05-15'),
      city: 'Cairo',
      favoriteCuisines: ['Middle Eastern', 'Mediterranean'],
      lastLatitude: tampaLocations[1].latitude,
      lastLongitude: tampaLocations[1].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Ahmed',
      lastName: 'Hassan',
      email: 'ahmed@example.com',
      password: 'password123',
      gender: 'male',
      birthday: new Date('1988-10-20'),
      city: 'Alexandria',
      favoriteCuisines: ['Egyptian', 'Middle Eastern', 'Mediterranean'],
      lastLatitude: tampaLocations[2].latitude,
      lastLongitude: tampaLocations[2].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Fatima',
      lastName: 'Ali',
      email: 'fatima@example.com',
      password: 'password123',
      gender: 'female',
      birthday: new Date('1995-03-08'),
      city: 'Cairo',
      favoriteCuisines: ['Indian', 'Chinese'],
      lastLatitude: tampaLocations[3].latitude,
      lastLongitude: tampaLocations[3].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Mohamed',
      lastName: 'Ibrahim',
      email: 'mohamed@example.com',
      password: 'password123',
      gender: 'male',
      birthday: new Date('1985-12-15'),
      city: 'Alexandria',
      favoriteCuisines: ['French', 'Italian'],
      lastLatitude: tampaLocations[4].latitude,
      lastLongitude: tampaLocations[4].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Layla',
      lastName: 'Mahmoud',
      email: 'layla@example.com',
      password: 'password123',
      gender: 'female',
      birthday: new Date('1993-07-22'),
      city: 'Cairo',
      favoriteCuisines: ['Japanese', 'Thai'],
      lastLatitude: tampaLocations[5].latitude,
      lastLongitude: tampaLocations[5].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Omar',
      lastName: 'Farouk',
      email: 'omar@example.com',
      password: 'password123',
      gender: 'male',
      birthday: new Date('1991-09-05'),
      city: 'Alexandria',
      favoriteCuisines: ['Mexican', 'American'],
      lastLatitude: tampaLocations[6].latitude,
      lastLongitude: tampaLocations[6].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Nour',
      lastName: 'Ahmed',
      email: 'nour@example.com',
      password: 'password123',
      gender: 'female',
      birthday: new Date('1994-02-18'),
      city: 'Cairo',
      favoriteCuisines: ['Lebanese', 'Greek'],
      lastLatitude: tampaLocations[7].latitude,
      lastLongitude: tampaLocations[7].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Youssef',
      lastName: 'Samir',
      email: 'youssef@example.com',
      password: 'password123',
      gender: 'male',
      birthday: new Date('1989-11-30'),
      city: 'Alexandria',
      favoriteCuisines: ['Chinese', 'Indian'],
      lastLatitude: tampaLocations[8].latitude,
      lastLongitude: tampaLocations[8].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Amira',
      lastName: 'Khalil',
      email: 'amira@example.com',
      password: 'password123',
      gender: 'female',
      birthday: new Date('1996-04-12'),
      city: 'Cairo',
      favoriteCuisines: ['Italian', 'French'],
      lastLatitude: tampaLocations[9].latitude,
      lastLongitude: tampaLocations[9].longitude,
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    }
  ];

  for (const user of testUsers) {
    userPromises.push(
      db.insert(users).values({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: await hashPassword(user.password),
        gender: user.gender,
        birthday: user.birthday,
        city: user.city,
        favoriteCuisines: user.favoriteCuisines,
        lastLatitude: user.lastLatitude,
        lastLongitude: user.lastLongitude,
        locationUpdatedAt: user.locationUpdatedAt,
        locationPermissionGranted: user.locationPermissionGranted,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );
  }

  await Promise.all(userPromises);

  // Fetch all users from the database after insertion
  let users_data: any[] = [];
  try {
    const fetchedUsers = await db.select().from(users);
    users_data = fetchedUsers;
    console.log(`Retrieved ${users_data.length} users from database`);
    if (users_data.length > 0) {
      console.log('First user structure:', JSON.stringify(users_data[0], null, 2));
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }

  // Create test restaurants with auth and profiles (8 restaurants)
  const restaurantData = [
    // Original restaurants
    {
      auth: {
        email: 'italiano@example.com',
        password: 'password123',
        name: 'Italiano Authentic',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Experience authentic Italian cuisine in the heart of Alexandria.',
        description: 'Our chefs bring the flavors of Italy to your table with fresh ingredients and traditional recipes.',
        cuisine: 'Italian',
        priceRange: '$$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '123 Mediterranean Ave',
          city: 'Alexandria',
          tablesCount: 15,
          seatsCount: 60,
          openingTime: '12:00',
          closingTime: '23:00',
          latitude: tampaLocations[0].latitude,
          longitude: tampaLocations[0].longitude
        },
        {
          address: '456 Nile View St',
          city: 'Cairo',
          tablesCount: 20,
          seatsCount: 80,
          openingTime: '12:00',
          closingTime: '00:00',
          latitude: tampaLocations[1].latitude,
          longitude: tampaLocations[1].longitude
        }
      ]
    },
    {
      auth: {
        email: 'sakura@example.com',
        password: 'password123',
        name: 'Sakura Japanese',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Traditional Japanese cuisine with a modern twist.',
        description: 'Sakura offers an authentic Japanese dining experience with sushi, sashimi, and teppanyaki prepared by master chefs.',
        cuisine: 'Japanese',
        priceRange: '$$$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '789 Coastal Road',
          city: 'Alexandria',
          tablesCount: 12,
          seatsCount: 48,
          openingTime: '13:00',
          closingTime: '23:00',
          latitude: tampaLocations[2].latitude,
          longitude: tampaLocations[2].longitude
        }
      ]
    },
    {
      auth: {
        email: 'lebanese@example.com',
        password: 'password123',
        name: 'Lebanese House',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Authentic Lebanese cuisine and mezze.',
        description: 'Lebanese House serves traditional mezze, grilled meats, and freshly baked bread in a warm, welcoming atmosphere.',
        cuisine: 'Middle Eastern',
        priceRange: '$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '321 Downtown Square',
          city: 'Cairo',
          tablesCount: 25,
          seatsCount: 100,
          openingTime: '11:00',
          closingTime: '01:00',
          latitude: tampaLocations[3].latitude,
          longitude: tampaLocations[3].longitude
        },
        {
          address: '654 Seafront Road',
          city: 'Alexandria',
          tablesCount: 18,
          seatsCount: 72,
          openingTime: '12:00',
          closingTime: '00:00',
          latitude: tampaLocations[4].latitude,
          longitude: tampaLocations[4].longitude
        }
      ]
    },
    // Additional restaurants
    {
      auth: {
        email: 'spice@example.com',
        password: 'password123',
        name: 'Spice of India',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Authentic Indian flavors and spices.',
        description: 'Experience the rich and diverse flavors of India with our carefully crafted dishes using traditional spices and cooking methods.',
        cuisine: 'Indian',
        priceRange: '$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '45 Tahrir Square',
          city: 'Tampa',
          tablesCount: 22,
          seatsCount: 88,
          openingTime: '12:00',
          closingTime: '23:30',
          latitude: tampaLocations[5].latitude,
          longitude: tampaLocations[5].longitude
        }
      ]
    },
    {
      auth: {
        email: 'dragon@example.com',
        password: 'password123',
        name: 'Golden Dragon',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Authentic Chinese cuisine in an elegant setting.',
        description: 'Golden Dragon offers a wide range of traditional Chinese dishes from different regions of China, prepared by expert chefs.',
        cuisine: 'Chinese',
        priceRange: '$$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '78 Brickell Avenue',
          city: 'Miami',
          tablesCount: 20,
          seatsCount: 80,
          openingTime: '11:30',
          closingTime: '23:00',
          latitude: tampaLocations[6].latitude,
          longitude: tampaLocations[6].longitude
        },
        {
          address: '123 Downtown Tampa',
          city: 'Tampa',
          tablesCount: 25,
          seatsCount: 100,
          openingTime: '12:00',
          closingTime: '00:00',
          latitude: tampaLocations[7].latitude,
          longitude: tampaLocations[7].longitude
        }
      ]
    },
    {
      auth: {
        email: 'nile@example.com',
        password: 'password123',
        name: 'Nile View',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Traditional Egyptian cuisine with a spectacular view of the Nile.',
        description: 'Enjoy authentic Egyptian dishes while taking in breathtaking views of the Nile River. Our menu features classic recipes passed down through generations.',
        cuisine: 'Egyptian',
        priceRange: '$$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '56 Nile Corniche',
          city: 'Cairo',
          tablesCount: 30,
          seatsCount: 120,
          openingTime: '10:00',
          closingTime: '01:00',
          latitude: tampaLocations[8].latitude,
          longitude: tampaLocations[8].longitude
        },
        {
          address: '89 Alexandria Corniche',
          city: 'Alexandria',
          tablesCount: 25,
          seatsCount: 100,
          openingTime: '10:00',
          closingTime: '00:00',
          latitude: tampaLocations[9].latitude,
          longitude: tampaLocations[9].longitude
        }
      ]
    },
    {
      auth: {
        email: 'seafood@example.com',
        password: 'password123',
        name: 'Red Sea Treasures',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Fresh seafood caught daily from the Red Sea.',
        description: 'We serve the freshest seafood from the Red Sea, prepared using traditional recipes that highlight the natural flavors of our catch.',
        cuisine: 'Mediterranean',
        priceRange: '$$$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '34 Beach Road',
          city: 'Alexandria',
          tablesCount: 18,
          seatsCount: 72,
          openingTime: '12:00',
          closingTime: '23:00',
          latitude: tampaLocations[10].latitude,
          longitude: tampaLocations[10].longitude
        },
        {
          address: '67 Nile Bay',
          city: 'Cairo',
          tablesCount: 22,
          seatsCount: 88,
          openingTime: '12:00',
          closingTime: '00:00',
          latitude: tampaLocations[11].latitude,
          longitude: tampaLocations[11].longitude
        }
      ]
    },
    {
      auth: {
        email: 'bistro@example.com',
        password: 'password123',
        name: 'Parisian Bistro',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'A taste of Paris in the heart of Cairo.',
        description: 'Our bistro brings authentic French cuisine to Cairo, with a menu featuring classic dishes prepared with a modern twist by our French-trained chefs.',
        cuisine: 'French',
        priceRange: '$$$',
        logo: 'https://t4.ftcdn.net/jpg/02/75/70/03/360_F_275700347_09reCCwb7JBxTKiYQXsyri4riMKaHbj8.jpg',
        isProfileComplete: true
      },
      branches: [
        {
          address: '12 Zamalek Street',
          city: 'Cairo',
          tablesCount: 15,
          seatsCount: 60,
          openingTime: '11:00',
          closingTime: '23:00',
          latitude: tampaLocations[12].latitude,
          longitude: tampaLocations[12].longitude
        }
      ]
    }
  ];

  const restaurants = await Promise.all(
    restaurantData.map(async (restaurant) => {
      // Create restaurant auth
      const [authEntry] = await db.insert(restaurantAuth).values({
        email: restaurant.auth.email,
        password: await hashPassword(restaurant.auth.password),
        name: restaurant.auth.name,
        verified: restaurant.auth.verified,
        createdAt: restaurant.auth.createdAt,
        updatedAt: restaurant.auth.updatedAt
      }).returning();

      // Create restaurant profile
      const [profileEntry] = await db.insert(restaurantProfiles).values({
        restaurantId: authEntry.id,
        about: restaurant.profile.about,
        description: restaurant.profile.description,
        cuisine: restaurant.profile.cuisine,
        priceRange: restaurant.profile.priceRange,
        logo: restaurant.profile.logo,
        isProfileComplete: restaurant.profile.isProfileComplete
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
        id: authEntry.id,
        auth: authEntry,
        profile: profileEntry,
        branches: branchEntries.map(b => b[0])
      };
    })
  );

  console.log(`Created ${restaurants.length} test restaurants with ${restaurants.reduce((acc, r) => acc + r.branches.length, 0)} branches`);
  
  // Debug restaurant and branch structure
  console.log('First restaurant structure:', JSON.stringify(restaurants[0], null, 2));
  if (restaurants[0] && restaurants[0].branches && restaurants[0].branches.length > 0) {
    console.log('First branch structure:', JSON.stringify(restaurants[0].branches[0], null, 2));
  }

  // Create test bookings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  const lastMonth = new Date(now);
  lastMonth.setMonth(now.getMonth() - 1);

  // Helper to create a booking time
  const createBookingTime = (baseDate: Date, hours: number, minutes = 0) => {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Create a variety of bookings
  const bookingPromises: Promise<any>[] = [];

  // Create a flat array of all branches for easier random selection
  const allBranches: Array<{id: number, restaurantId: number, restaurantName: string}> = [];
  
  // Safely extract branch data
  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    if (!restaurant || !restaurant.id || !restaurant.branches) continue;
    
    console.log(`Processing restaurant ${i} with id ${restaurant.id} and ${restaurant.branches.length} branches`);
    
    for (let j = 0; j < restaurant.branches.length; j++) {
      const branch = restaurant.branches[j];
      if (!branch || !branch.id) continue;
      
      allBranches.push({
        id: branch.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.auth.name || 'Unknown Restaurant'
      });
    }
  }

  console.log(`Found ${allBranches.length} valid branches for bookings`);
  
  if (allBranches.length > 0) {
    // For each user, create different types of bookings
    for (const user of users_data) {
      try {
        // 1. Past completed bookings (1-2 per user)
        const completedCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < completedCount; i++) {
          const branchIndex = Math.floor(Math.random() * allBranches.length);
          const randomBranch = allBranches[branchIndex];
          
          const bookingDate = randomDate(lastMonth, lastWeek);
          const arrivedDate = new Date(bookingDate);
          arrivedDate.setMinutes(arrivedDate.getMinutes() + 10);
          
          bookingPromises.push(
            db.insert(bookings).values({
              date: bookingDate,
              userId: user.id,
              branchId: randomBranch.id,
              partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
              confirmed: true,
              arrived: true,
              completed: true,
              arrivedAt: arrivedDate
            })
          );
        }

        // 2. Currently seated bookings (0-1 per user)
        if (Math.random() > 0.7) { // 30% chance
          const branchIndex = Math.floor(Math.random() * allBranches.length);
          const randomBranch = allBranches[branchIndex];
          
          const bookingDate = createBookingTime(now, now.getHours() - 1);
          
          bookingPromises.push(
            db.insert(bookings).values({
              date: bookingDate,
              userId: user.id,
              branchId: randomBranch.id,
              partySize: Math.floor(Math.random() * 4) + 2, // 2-6 people
              confirmed: true,
              arrived: true,
              completed: false,
              arrivedAt: now
            })
          );
        }

        // 3. Upcoming confirmed bookings (1-2 per user)
        const upcomingCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < upcomingCount; i++) {
          const branchIndex = Math.floor(Math.random() * allBranches.length);
          const randomBranch = allBranches[branchIndex];
          
          const hours = now.getHours() + Math.floor(Math.random() * 5) + 1; // 1-6 hours from now
          const bookingDate = i === 0 ? 
            createBookingTime(now, hours) : 
            createBookingTime(tomorrow, 12 + Math.floor(Math.random() * 8));
          
          bookingPromises.push(
            db.insert(bookings).values({
              date: bookingDate,
              userId: user.id,
              branchId: randomBranch.id,
              partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
              confirmed: true,
              arrived: false,
              completed: false
            })
          );
        }

        // 4. Future confirmed bookings (1-2 per user)
        const futureCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < futureCount; i++) {
          const branchIndex = Math.floor(Math.random() * allBranches.length);
          const randomBranch = allBranches[branchIndex];
          
          const futureDate = randomDate(tomorrow, nextMonth);
          const hour = 12 + Math.floor(Math.random() * 10); // Between 12 PM and 10 PM
          
          bookingPromises.push(
            db.insert(bookings).values({
              date: createBookingTime(futureDate, hour),
              userId: user.id,
              branchId: randomBranch.id,
              partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
              confirmed: true,
              arrived: false,
              completed: false
            })
          );
        }

        // 5. Cancelled bookings (0-2 per user)
        const cancelledCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < cancelledCount; i++) {
          const branchIndex = Math.floor(Math.random() * allBranches.length);
          const randomBranch = allBranches[branchIndex];
          
          const isFuture = Math.random() > 0.5;
          const bookingDate = isFuture ? 
            randomDate(tomorrow, nextWeek) : 
            randomDate(lastWeek, now);
          const hour = 12 + Math.floor(Math.random() * 10); // Between 12 PM and 10 PM
          
          bookingPromises.push(
            db.insert(bookings).values({
              date: createBookingTime(bookingDate, hour),
              userId: user.id,
              branchId: randomBranch.id,
              partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
              confirmed: false, // Unconfirmed = cancelled
              arrived: false,
              completed: false
            })
          );
        }
      } catch (error) {
        console.error(`Error creating bookings for user ${user.id}:`, error);
      }
    }
  } else {
    console.log('No valid branches found, skipping booking creation');
  }

  await Promise.all(bookingPromises);
  console.log(`Created ${bookingPromises.length} test bookings`);

  // Create saved restaurants for users
  const savedRestaurantPromises: Promise<any>[] = [];

  // Create a flat array of valid restaurants with their branches
  const validRestaurants: Array<{id: number, branches: Array<{id: number, index: number}>}> = [];
  
  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    if (!restaurant || !restaurant.id || !restaurant.branches) continue;
    
    const validBranches: Array<{id: number, index: number}> = [];
    for (let j = 0; j < restaurant.branches.length; j++) {
      const branch = restaurant.branches[j];
      if (branch && branch.id) {
        validBranches.push({ id: branch.id, index: j });
      }
    }
    
    if (validBranches.length > 0) {
      validRestaurants.push({
        id: restaurant.id,
        branches: validBranches
      });
    }
  }
  
  console.log(`Found ${validRestaurants.length} valid restaurants for saving`);
  
  if (validRestaurants.length > 0 && users_data && users_data.length > 0) {
    console.log('First user id:', users_data[0]?.id);
    
    // Each user saves 1-3 random restaurants
    for (const user of users_data) {
      if (!user || !user.id) {
        console.log('Skipping invalid user:', user);
        continue;
      }
      
      try {
        const numToSave = Math.floor(Math.random() * 3) + 1; // 1-3 restaurants
        const maxToSave = Math.min(numToSave, validRestaurants.length);
        console.log(`User ${user.id} will save ${maxToSave} restaurants`);
        
        // Get random indices for restaurants to save
        const restaurantIndices: number[] = [];
        for (let i = 0; i < maxToSave; i++) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * validRestaurants.length);
          } while (restaurantIndices.includes(randomIndex));
          restaurantIndices.push(randomIndex);
        }
        
        // Create saved restaurants
        for (const index of restaurantIndices) {
          const restaurant = validRestaurants[index];
          if (!restaurant || !restaurant.branches || restaurant.branches.length === 0) {
            console.log('Skipping invalid restaurant at index:', index);
            continue;
          }
          
          const randomBranchIndex = Math.floor(Math.random() * restaurant.branches.length);
          const branchInfo = restaurant.branches[randomBranchIndex];
          
          if (!branchInfo) {
            console.log('Skipping invalid branch at index:', randomBranchIndex);
            continue;
          }
          
          savedRestaurantPromises.push(
            db.insert(savedRestaurants).values({
              userId: user.id,
              restaurantId: restaurant.id,
              branchIndex: branchInfo.index
            })
          );
        }
      } catch (error) {
        console.error(`Error creating saved restaurants for user ${user?.id}:`, error);
      }
    }
  } else {
    console.log('No valid restaurants or users found, skipping saved restaurants creation');
  }

  await Promise.all(savedRestaurantPromises);
  console.log(`Created ${savedRestaurantPromises.length} saved restaurant entries`);

  console.log('Database seeded successfully!');
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
