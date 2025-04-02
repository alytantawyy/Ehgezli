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

async function seed() {
  console.log('🌱 Seeding database...');

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
  // Clear sessions
  await db.execute(sql`DELETE FROM session`);
  console.log('✅ Cleared existing data');

  // Available cuisines - matching the list from home-page.tsx
  const cuisines = [
    'American',
    'Egyptian',
    'Italian',
    'Japanese',
    'Chinese',
    'Indian',
    'Mexican',
    'French',
    'Thai',
    'Mediterranean',
    'Middle Eastern'
  ];

  // Available cities - only Cairo and Alexandria
  const cities = ['Cairo', 'Alexandria'];

  // Create test users (10 users)
  const userEntries = await Promise.all([
    // Original users
    db.insert(users).values({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1990-01-01'),
      city: 'Alexandria',
      favoriteCuisines: ['Italian', 'Japanese'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1992-05-15'),
      city: 'Cairo',
      favoriteCuisines: ['Mexican', 'Indian'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Ahmed',
      lastName: 'Hassan',
      email: 'ahmed@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1988-03-20'),
      city: 'Alexandria',
      favoriteCuisines: ['Egyptian', 'Lebanese'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Sara',
      lastName: 'Mohamed',
      email: 'sara@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1995-11-10'),
      city: 'Cairo',
      favoriteCuisines: ['Chinese', 'Thai'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    // Additional users
    db.insert(users).values({
      firstName: 'Mohamed',
      lastName: 'Ibrahim',
      email: 'mohamed@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1985-07-22'),
      city: 'Cairo',
      favoriteCuisines: ['Egyptian', 'Mediterranean', 'Greek'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Fatima',
      lastName: 'Ali',
      email: 'fatima@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1993-09-05'),
      city: 'Alexandria',
      favoriteCuisines: ['Seafood', 'Italian', 'French'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Omar',
      lastName: 'Mahmoud',
      email: 'omar@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1991-12-15'),
      city: 'Cairo',
      favoriteCuisines: ['Mediterranean', 'Seafood', 'Turkish'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Layla',
      lastName: 'Kamal',
      email: 'layla@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1989-04-30'),
      city: 'Alexandria',
      favoriteCuisines: ['Egyptian', 'Middle Eastern', 'Indian'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Khaled',
      lastName: 'Samir',
      email: 'khaled@example.com',
      password: await hashPassword('password123'),
      gender: 'male',
      birthday: new Date('1987-08-12'),
      city: 'Cairo',
      favoriteCuisines: ['Nubian', 'Egyptian', 'African'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning(),
    db.insert(users).values({
      firstName: 'Nour',
      lastName: 'Hamed',
      email: 'nour@example.com',
      password: await hashPassword('password123'),
      gender: 'female',
      birthday: new Date('1994-02-28'),
      city: 'Alexandria',
      favoriteCuisines: ['Lebanese', 'Syrian', 'Turkish'],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
  ]);

  const users_data = userEntries.map(entry => entry[0]);
  console.log(`✅ Created ${users_data.length} test users`);

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
          closingTime: '23:00'
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
          city: 'Cairo',
          tablesCount: 22,
          seatsCount: 88,
          openingTime: '12:00',
          closingTime: '23:30'
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
          address: '78 Corniche Road',
          city: 'Alexandria',
          tablesCount: 20,
          seatsCount: 80,
          openingTime: '11:30',
          closingTime: '23:00'
        },
        {
          address: '123 Downtown Road',
          city: 'Cairo',
          tablesCount: 25,
          seatsCount: 100,
          openingTime: '12:00',
          closingTime: '00:00'
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
          closingTime: '01:00'
        },
        {
          address: '89 Alexandria Corniche',
          city: 'Alexandria',
          tablesCount: 25,
          seatsCount: 100,
          openingTime: '10:00',
          closingTime: '00:00'
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
          closingTime: '23:00'
        },
        {
          address: '67 Nile Bay',
          city: 'Cairo',
          tablesCount: 22,
          seatsCount: 88,
          openingTime: '12:00',
          closingTime: '00:00'
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
          closingTime: '23:00'
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

  console.log(`✅ Created ${restaurants.length} test restaurants with ${restaurants.reduce((acc, r) => acc + r.branches.length, 0)} branches`);

  // Create test bookings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);

  // Helper to create a booking time
  const createBookingTime = (baseDate: Date, hours: number, minutes = 0) => {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Create a variety of bookings
  const bookingPromises: Promise<any>[] = [];

  // Past completed bookings (15)
  for (let i = 0; i < 15; i++) {
    const randomUser = users_data[Math.floor(Math.random() * users_data.length)];
    const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const randomBranch = randomRestaurant.branches[Math.floor(Math.random() * randomRestaurant.branches.length)];
    const bookingDate = randomDate(lastWeek, now);
    const arrivedDate = new Date(bookingDate);
    arrivedDate.setMinutes(arrivedDate.getMinutes() + 10);
    
    bookingPromises.push(
      db.insert(bookings).values({
        date: bookingDate,
        userId: randomUser.id,
        branchId: randomBranch.id,
        partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
        confirmed: true,
        arrived: true,
        completed: true,
        arrivedAt: arrivedDate
      })
    );
  }

  // Currently seated bookings (5)
  for (let i = 0; i < 5; i++) {
    const randomUser = users_data[Math.floor(Math.random() * users_data.length)];
    const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const randomBranch = randomRestaurant.branches[Math.floor(Math.random() * randomRestaurant.branches.length)];
    const bookingDate = createBookingTime(now, now.getHours() - 1);
    
    bookingPromises.push(
      db.insert(bookings).values({
        date: bookingDate,
        userId: randomUser.id,
        branchId: randomBranch.id,
        partySize: Math.floor(Math.random() * 4) + 2, // 2-6 people
        confirmed: true,
        arrived: true,
        completed: false,
        arrivedAt: now
      })
    );
  }

  // Upcoming bookings for today (10)
  for (let i = 0; i < 10; i++) {
    const randomUser = users_data[Math.floor(Math.random() * users_data.length)];
    const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const randomBranch = randomRestaurant.branches[Math.floor(Math.random() * randomRestaurant.branches.length)];
    const hours = now.getHours() + Math.floor(Math.random() * 5) + 1; // 1-6 hours from now
    
    bookingPromises.push(
      db.insert(bookings).values({
        date: createBookingTime(now, hours),
        userId: randomUser.id,
        branchId: randomBranch.id,
        partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
        confirmed: true,
        arrived: false,
        completed: false
      })
    );
  }

  // Future bookings (20)
  for (let i = 0; i < 20; i++) {
    const randomUser = users_data[Math.floor(Math.random() * users_data.length)];
    const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const randomBranch = randomRestaurant.branches[Math.floor(Math.random() * randomRestaurant.branches.length)];
    const futureDate = new Date(tomorrow.getTime() + Math.random() * (nextWeek.getTime() - tomorrow.getTime()));
    const hours = 12 + Math.floor(Math.random() * 10); // Between 12 PM and 10 PM
    
    bookingPromises.push(
      db.insert(bookings).values({
        date: createBookingTime(futureDate, hours),
        userId: randomUser.id,
        branchId: randomBranch.id,
        partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
        confirmed: true,
        arrived: false,
        completed: false
      })
    );
  }

  await Promise.all(bookingPromises);
  console.log(`✅ Created ${bookingPromises.length} test bookings`);

  // Create saved restaurants for users
  const savedRestaurantPromises: Promise<any>[] = [];

  // Each user saves 2-5 random restaurants
  for (const user of users_data) {
    const numToSave = Math.floor(Math.random() * 4) + 2; // 2-5 restaurants
    const restaurantsToSave = pickRandom(restaurants, numToSave);
    
    for (const restaurant of restaurantsToSave) {
      const randomBranchIndex = Math.floor(Math.random() * restaurant.branches.length);
      
      savedRestaurantPromises.push(
        db.insert(savedRestaurants).values({
          userId: user.id,
          restaurantId: restaurant.id,
          branchIndex: randomBranchIndex
        })
      );
    }
  }

  await Promise.all(savedRestaurantPromises);
  console.log(`✅ Created ${savedRestaurantPromises.length} saved restaurant entries`);

  console.log('✅ Database seeded successfully!');
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
