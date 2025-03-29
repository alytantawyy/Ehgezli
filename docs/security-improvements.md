# Security Improvements for Public Restaurant Endpoints

## Current Issues

1. **Data Oversharing in Public Endpoints**
   - Public restaurant endpoints are returning full restaurant records including sensitive information
   - No separation between public-facing and internal data models
   - Potentially exposing emails, authentication details, and internal IDs

2. **Redundant Public Routes**
   - Some routes like `/restaurants` are listed multiple times in the public paths array
   - Unclear distinction between browsing and administrative endpoints

## Proposed Solutions

### 1. Create Data Transfer Objects (DTOs)

```typescript
// In shared/schema.ts
export interface PublicRestaurantDTO {
  id: number;
  name: string;
  cuisine: string;
  priceRange: string;
  about: string;
  logo: string;
  branches: PublicBranchDTO[];
}

export interface PublicBranchDTO {
  id: number;
  city: string;
  address: string;
  openingTime: string;
  closingTime: string;
}
```

### 2. Implement Data Sanitization

```typescript
// In storage.ts
export async function getPublicRestaurants(filters?: RestaurantFilters): Promise<PublicRestaurantDTO[]> {
  const restaurants = await getRestaurants(filters);
  
  return restaurants.map(restaurant => ({
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.profile?.cuisine,
    priceRange: restaurant.profile?.priceRange,
    about: restaurant.profile?.about,
    logo: restaurant.profile?.logo,
    branches: restaurant.branches.map(branch => ({
      id: branch.id,
      city: branch.city,
      address: branch.address,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime
    }))
  }));
}
```

### 3. Update Route Handlers

```typescript
// In routes.ts
app.get("/api/restaurants", async (req: Request, res: Response) => {
  try {
    // ... existing filter logic ...
    
    const restaurants = await storage.getPublicRestaurants({
      search: search as string,
      city: city === "all" ? undefined : city as string,
      cuisine: cuisine === "all" ? undefined : cuisine as string,
      priceRange: priceRange === "all" ? undefined : priceRange as string
    });

    res.json(restaurants);
  } catch (error) {
    console.error("Error getting restaurants:", error);
    res.status(500).json({ message: "Error retrieving restaurants" });
  }
});
```

### 4. Clean Up Public Paths List

```typescript
// In routes.ts
const publicPaths = [
  '/register',
  '/login',
  '/restaurant/login',
  '/forgot-password',
  '/reset-password',
  '/restaurant/forgot-password',
  '/restaurant/reset-password',
  '/public/restaurants',           // New public-only endpoints
  '/public/restaurant',
  '/public/restaurant/availability'
];
```

### 5. Create New Public-Only Routes

```typescript
// In routes.ts
app.get("/api/public/restaurants", async (req: Request, res: Response) => {
  // Same implementation as current /api/restaurants but using getPublicRestaurants
});

app.get("/api/public/restaurant/:id", async (req: Request, res: Response) => {
  // Same implementation as current /api/restaurant/:id but using getPublicRestaurant
});
```

## Implementation Plan

1. **Phase 1: Create DTOs and Sanitization Functions**
   - Add PublicRestaurantDTO and PublicBranchDTO to schema.ts
   - Implement getPublicRestaurants and getPublicRestaurant in storage.ts
   - Add unit tests for data sanitization

2. **Phase 2: Create New Public Routes**
   - Add /api/public/* routes that use the sanitized data functions
   - Update frontend to use these new routes for unauthenticated views
   - Test thoroughly to ensure all necessary data is still available

3. **Phase 3: Secure Original Routes**
   - Remove original restaurant routes from publicPaths
   - Update authentication middleware to protect original routes
   - Ensure authenticated users still have access to full data

4. **Phase 4: Deprecate and Remove**
   - Add deprecation notices to original public routes
   - After sufficient transition time, remove public access entirely

## Security Benefits

- **Principle of Least Privilege:** Users only see the data they need
- **Reduced Attack Surface:** Sensitive data is no longer publicly exposed
- **Clear Separation of Concerns:** Public vs. authenticated data is explicitly modeled
- **Improved Maintainability:** DTOs make it clear what data is intended for public consumption

## User Experience Considerations

- Public browsing functionality is preserved
- No additional friction for new users
- SEO benefits of public listings maintained
- Clearer separation between public and authenticated experiences
