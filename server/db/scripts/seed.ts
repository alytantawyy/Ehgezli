import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, restaurantUsers, restaurantProfiles, restaurantBranches, bookings, userPasswordResetTokens, restaurantPasswordResetTokens, timeSlots, savedBranches, bookingSettings, bookingOverrides } from '../schema';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

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

// Helper function to get just the date portion as a Date object
const getDateOnly = (date: Date): Date => {
  return new Date(date.toISOString().split('T')[0]);
};

// Tampa coordinates for different locations
const tampaLocations = [
  { latitude: 27.9506, longitude: -82.4572 }, // Downtown Tampa
  { latitude: 27.9658, longitude: -82.5307 }, // Westshore
  { latitude: 27.9777, longitude: -82.3334 }, // East Tampa
  { latitude: 28.0192, longitude: -82.4301 }, // USF Area
  { latitude: 27.9478, longitude: -82.4584 }, // Channel District
  { latitude: 27.9654, longitude: -82.4301 }, // Ybor City
  { latitude: 27.9420, longitude: -82.4609 }, // Hyde Park
  { latitude: 28.0550, longitude: -82.4143 }, // Temple Terrace
  { latitude: 27.9160, longitude: -82.4593 }, // Davis Islands
  { latitude: 27.9238, longitude: -82.4637 }, // Harbour Island
  { latitude: 27.9959, longitude: -82.3452 }, // Tampa Palms
  { latitude: 27.9759, longitude: -82.5371 }, // International Plaza
  { latitude: 28.0836, longitude: -82.4500 }, // New Tampa
  { latitude: 27.9058, longitude: -82.5137 }, // South Tampa
  { latitude: 27.9253, longitude: -82.3300 }, // Brandon
];

async function seed() {
  console.log('Seeding database...');

  // Clear existing data in correct order (respecting foreign keys)
  console.log('Clearing existing data...');
  await db.delete(savedBranches);
  await db.delete(bookings);
  await db.delete(timeSlots);
  await db.delete(bookingOverrides);
  await db.delete(bookingSettings);
  await db.delete(userPasswordResetTokens);
  await db.delete(restaurantPasswordResetTokens);
  await db.delete(restaurantBranches);
  await db.delete(restaurantProfiles);
  await db.delete(restaurantUsers);
  await db.delete(users);

  // Create test users (10 users)
  const userPromises: Promise<any>[] = [];
  const testUsers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+201234567890',
      password: 'password123',
      gender: 'male',
      birthday: new Date('1990-01-01'),
      city: 'Alexandria',
      nationality: 'Egyptian',
      favoriteCuisines: ['Italian', 'Japanese'],
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+201234567891',
      password: 'password123',
      gender: 'female',
      birthday: new Date('1992-05-15'),
      city: 'Cairo',
      nationality: 'Egyptian',
      favoriteCuisines: ['Middle Eastern', 'Mediterranean'],
      locationUpdatedAt: new Date(),
      locationPermissionGranted: true
    },
  ];

  for (const user of testUsers) {
    userPromises.push(
      db.insert(users).values({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        password: await hashPassword(user.password),
        gender: user.gender,
        birthday: user.birthday,
        city: user.city,
        nationality: user.nationality,
        favoriteCuisines: user.favoriteCuisines,
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

  // Create test restaurants with user and profiles (8 restaurants)
  const restaurantData = [
    // Original restaurants
    {
      user: {
        email: 'italiano@example.com',
        password: 'password123',
        name: 'Italiano userentic',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Experience userentic Italian cuisine in the heart of Alexandria.',
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
      user: {
        email: 'sakura@example.com',
        password: 'password123',
        name: 'Sakura Japanese',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'Traditional Japanese cuisine with a modern twist.',
        description: 'Sakura offers an userentic Japanese dining experience with sushi, sashimi, and teppanyaki prepared by master chefs.',
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
      user: {
        email: 'lebanese@example.com',
        password: 'password123',
        name: 'Lebanese House',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      profile: {
        about: 'userentic Lebanese cuisine and mezze.',
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
    }
  ];

  const restaurants = await Promise.all(
    restaurantData.map(async (restaurant) => {
      // Create restaurant user
      const [userEntry] = await db.insert(restaurantUsers).values({
        email: restaurant.user.email,
        password: await hashPassword(restaurant.user.password),
        name: restaurant.user.name,
        verified: restaurant.user.verified,
        createdAt: restaurant.user.createdAt,
        updatedAt: restaurant.user.updatedAt
      }).returning();

      // Create restaurant profile
      const [profileEntry] = await db.insert(restaurantProfiles).values({
        restaurantId: userEntry.id,
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
            restaurantId: userEntry.id,
            ...branch
          }).returning()
        )
      );

      return {
        id: userEntry.id,
        user: userEntry,
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
        restaurantName: restaurant.user.name || 'Unknown Restaurant'
      });
    }
  }

  console.log(`Found ${allBranches.length} valid branches for bookings`);
  
  // First create booking settings for each branch
  console.log('Creating booking settings for branches...');
  const bookingSettingsPromises: Promise<any>[] = [];
  
  for (const branch of allBranches) {
    // Create booking settings with random opening/closing times
    const openHour = 10 + Math.floor(Math.random() * 3); // 10 AM to 12 PM
    const closeHour = 20 + Math.floor(Math.random() * 4); // 8 PM to 11 PM
    
    const openTime = `${openHour.toString().padStart(2, '0')}:00`;
    const closeTime = `${closeHour.toString().padStart(2, '0')}:00`;
    
    bookingSettingsPromises.push(
      db.insert(bookingSettings).values({
        branchId: branch.id,
        openTime: openTime,
        closeTime: closeTime,
        interval: 45 + Math.floor(Math.random() * 56), // 45-100 minute slots
        maxSeatsPerSlot: 20 + Math.floor(Math.random() * 20), // 20-40 seats
        maxTablesPerSlot: 5 + Math.floor(Math.random() * 10) // 5-15 tables
      }).returning()
    );
  }
  
  // Wait for all booking settings to be created
  const branchSettingsData = await Promise.all(bookingSettingsPromises);
  console.log('Booking settings created successfully');
  
  // Now create time slots based on booking settings
  console.log('Creating time slots for branches...');
  const timeSlotsByBranch: Record<number, any[]> = {};
  
  const startDate = new Date('2025-07-25'); 
  const endDate = new Date('2025-08-26'); 
  
  // Flatten the settings array
  const allSettings = branchSettingsData.flat();
  
  // Process settings in batches to avoid overwhelming the database
  const BATCH_SIZE = 3; // Process 3 branches at a time
  
  for (let i = 0; i < allSettings.length; i += BATCH_SIZE) {
    const batchSettings = allSettings.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allSettings.length / BATCH_SIZE)} (${batchSettings.length} branches)`);
    
    const batchPromises: Promise<any>[] = [];
    
    for (const setting of batchSettings) {
      const branchId = setting.branchId;
      timeSlotsByBranch[branchId] = [];
      
      // Parse opening and closing times
      const [openHour] = setting.openTime.split(':').map(Number);
      const [closeHour] = setting.closeTime.split(':').map(Number);
      
      // Limit the number of days to create slots for (to reduce database load)
      // For testing, we'll create fewer slots - just enough for the bookings
      const daysToCreate = 10; // Create slots for 10 days instead of full 2 months
      const skipDays = Math.floor(Math.random() * 3); // Randomly skip some days for variety
      
      let dayCount = 0;
      for (let date = new Date(startDate); date <= endDate && dayCount < daysToCreate; date.setDate(date.getDate() + skipDays + 1)) {
        dayCount++;
        
        // Skip creating slots for past dates that are more than a week old (except for a few for testing)
        const isPastDate = date < new Date();
        const isMoreThanWeekOld = new Date().getTime() - date.getTime() > 7 * 24 * 60 * 60 * 1000;
        
        if (isPastDate && isMoreThanWeekOld && Math.random() > 0.2) { // Only create ~20% of old slots
          continue;
        }
        
        // Create slots from opening to closing time
        // Create one slot per hour to reduce database load
        
        for (let hour = openHour; hour < closeHour; hour++) {
          // For each hour, create one slot
          const slotDate = new Date(date);
          const dateOnly = getDateOnly(slotDate); // Get just the date portion
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(hour + 1, 0, 0, 0);
          
          // Since we're creating slots for 2025, we don't need this check
          // if (startTime < new Date() && date.getDate() === new Date().getDate()) {
          //   continue;
          // }
          
          batchPromises.push(
            db.insert(timeSlots).values({
              branchId: branchId,
              date: dateOnly, // Use date with no time component
              startTime: startTime,
              endTime: endTime,
              maxSeats: setting.maxSeatsPerSlot,
              maxTables: setting.maxTablesPerSlot,
              isClosed: false
            }).returning().then(slots => {
              if (slots && slots.length > 0) {
                if (!timeSlotsByBranch[branchId]) {
                  timeSlotsByBranch[branchId] = [];
                }
                timeSlotsByBranch[branchId].push(slots[0]);
              }
              return slots;
            })
          );
        }
      }
    }
    
    // Wait for this batch to complete before moving to the next
    console.log(`Inserting ${batchPromises.length} time slots for batch ${i / BATCH_SIZE + 1}...`);
    await Promise.all(batchPromises);
    console.log(`Completed batch ${i / BATCH_SIZE + 1}`);
  }
  
  console.log('Time slots created successfully');
  
  // Create a variety of bookings
  const bookingPromises: Promise<any>[] = [];

  for (const user of users_data) {
    try {
      // For each user, create different types of bookings
      for (const branch of allBranches) {
        // 1. Past completed bookings (1-2 per user)
        const pastCompletedCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < pastCompletedCount; i++) {
          // Find a time slot for this branch in the past
          const pastTimeSlots = timeSlotsByBranch[branch.id]?.filter(slot => 
            new Date(slot.startTime) < new Date()
          );
          
          if (pastTimeSlots.length > 0) {
            const randomTimeSlot = pastTimeSlots[Math.floor(Math.random() * pastTimeSlots.length)];
            bookingPromises.push(
              db.insert(bookings).values({
                userId: user.id,
                timeSlotId: randomTimeSlot.id,
                branchId: branch.id,
                restaurantId: branch.restaurantId,
                partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                status: 'completed',
                startTime: randomTimeSlot.startTime,
                endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
              })
            );
          }
        }

        // 2. Currently arrived bookings (0-1 per user)
        if (Math.random() > 0.5) {
          // Find a time slot for today
          const todayTimeSlots = timeSlotsByBranch[branch.id]?.filter(slot => {
            const slotDate = new Date(slot.startTime);
            const now = new Date();
            return slotDate.getDate() === now.getDate() &&
                  slotDate.getMonth() === now.getMonth() &&
                  slotDate.getFullYear() === now.getFullYear() &&
                  slotDate.getHours() < now.getHours();
          });
          
          if (todayTimeSlots.length > 0) {
            const randomTimeSlot = todayTimeSlots[Math.floor(Math.random() * todayTimeSlots.length)];
            bookingPromises.push(
              db.insert(bookings).values({
                restaurantId: branch.restaurantId,
                branchId: branch.id,
                timeSlotId: randomTimeSlot.id,
                partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                status: 'arrived'
              })
            );
          }
        }

        // 3. Upcoming confirmed bookings (1-2 per user)
        const upcomingConfirmedCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < upcomingConfirmedCount; i++) {
          // Find a time slot for today but in the future
          const upcomingTodayTimeSlots = timeSlotsByBranch[branch.id]?.filter(slot => {
            const slotDate = new Date(slot.startTime);
            const now = new Date();
            return slotDate.getDate() === now.getDate() &&
                  slotDate.getMonth() === now.getMonth() &&
                  slotDate.getFullYear() === now.getFullYear() &&
                  slotDate.getHours() > now.getHours();
          });
          
          if (upcomingTodayTimeSlots.length > 0) {
            const randomTimeSlot = upcomingTodayTimeSlots[Math.floor(Math.random() * upcomingTodayTimeSlots.length)];
            
            // 50% chance this will be a guest booking (to test that feature)
            const isGuestBooking = Math.random() > 0.5;
            
            if (isGuestBooking) {
              // Create a booking with guest information (restaurant creating for a guest)
              bookingPromises.push(
                db.insert(bookings).values({
                  guestName: `Guest of ${user.firstName}`,
                  guestPhone: `+20${Math.floor(Math.random() * 1000000000)}`,
                  guestEmail: `guest${Math.floor(Math.random() * 1000)}@example.com`,
                  timeSlotId: randomTimeSlot.id,
                  branchId: branch.id,
                  restaurantId: branch.restaurantId,
                  partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                  status: 'confirmed',
                  startTime: randomTimeSlot.startTime,
                  endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
                })
              );
            } else {
              // Regular user booking
              bookingPromises.push(
                db.insert(bookings).values({
                  userId: user.id,
                  timeSlotId: randomTimeSlot.id,
                  branchId: branch.id,
                  restaurantId: branch.restaurantId,
                  partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                  status: 'confirmed',
                  startTime: randomTimeSlot.startTime,
                  endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
                })
              );
            }
          }
        }

        // 4. Future confirmed bookings (1-2 per user)
        const futureConfirmedCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < futureConfirmedCount; i++) {
          // Find a time slot for the future (not today)
          const futureTimeSlots = timeSlotsByBranch[branch.id]?.filter(slot => {
            const slotDate = new Date(slot.startTime);
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            return slotDate >= tomorrow;
          });
          
          if (futureTimeSlots.length > 0) {
            const randomTimeSlot = futureTimeSlots[Math.floor(Math.random() * futureTimeSlots.length)];
            
            // 50% chance this will be a guest booking (to test that feature)
            const isGuestBooking = Math.random() > 0.5;
            
            if (isGuestBooking) {
              // Create a booking with guest information (restaurant creating for a guest)
              bookingPromises.push(
                db.insert(bookings).values({
                  guestName: `Future Guest ${Math.floor(Math.random() * 100)}`,
                  guestPhone: `+20${Math.floor(Math.random() * 1000000000)}`,
                  guestEmail: `futureguest${Math.floor(Math.random() * 1000)}@example.com`,
                  timeSlotId: randomTimeSlot.id,
                  branchId: branch.id,
                  restaurantId: branch.restaurantId,
                  partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                  status: 'confirmed',
                  startTime: randomTimeSlot.startTime,
                  endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
                })
              );
            } else {
              // Regular user booking
              bookingPromises.push(
                db.insert(bookings).values({
                  userId: user.id,
                  timeSlotId: randomTimeSlot.id,
                  branchId: branch.id,
                  restaurantId: branch.restaurantId,
                  partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                  status: 'confirmed',
                  startTime: randomTimeSlot.startTime,
                  endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
                })
              );
            }
          }
        }

        // 5. Cancelled bookings (0-2 per user)
        const cancelledCount = Math.floor(Math.random() * 3); // 0-2
        for (let i = 0; i < cancelledCount; i++) {
          // Find any time slot (past or future)
          const anyTimeSlots = timeSlotsByBranch[branch.id]?.filter(slot => 
            true
          );
          
          if (anyTimeSlots.length > 0) {
            const randomTimeSlot = anyTimeSlots[Math.floor(Math.random() * anyTimeSlots.length)];
            
            // 50% chance this will be a guest booking (to test that feature)
            const isGuestBooking = Math.random() > 0.5;
            
            if (isGuestBooking) {
              // Create a booking with guest information (restaurant creating for a guest)
              bookingPromises.push(
                db.insert(bookings).values({
                  guestName: `Cancelled Guest ${Math.floor(Math.random() * 100)}`,
                  guestPhone: `+20${Math.floor(Math.random() * 1000000000)}`,
                  guestEmail: `cancelledguest${Math.floor(Math.random() * 1000)}@example.com`,
                  timeSlotId: randomTimeSlot.id,
                  branchId: branch.id,
                  restaurantId: branch.restaurantId,
                  partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                  status: 'cancelled',
                  startTime: randomTimeSlot.startTime,
                  endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
                })
              );
            } else {
              // Regular user booking
              bookingPromises.push(
                db.insert(bookings).values({
                  userId: user.id,
                  timeSlotId: randomTimeSlot.id,
                  branchId: branch.id,
                  restaurantId: branch.restaurantId,
                  partySize: Math.floor(Math.random() * 6) + 2, // 2-8 people
                  status: 'cancelled',
                  startTime: randomTimeSlot.startTime,
                  endTime: new Date(new Date(randomTimeSlot.startTime).getTime() + 90 * 60000) // Fixed 90-minute duration
                })
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error creating bookings for user ${user.id}:`, error);
    }
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
            db.insert(savedBranches).values({
              userId: user.id,
              branchId: branchInfo.id
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
