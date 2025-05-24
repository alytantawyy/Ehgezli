import { createPasswordResetToken, createRestaurantPasswordResetToken, generateToken, hashPassword, markPasswordResetTokenAsUsed, markRestaurantPasswordResetTokenAsUsed, registerUser, registerRestaurantUser, updateRestaurantPassword, updateUserPassword, validatePasswordResetToken, validateRestaurantPasswordResetToken, loginUser, loginRestaurant } from "@server/services/authService";
import { createRestaurantProfile } from "@server/services/restaurantService";
import { Request, Response } from "express";

//--- Create Password Reset Token ---

export const createPasswordResetTokenController = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: "User ID is required" });
  
  const token = await createPasswordResetToken(Number(userId));
  res.json({ token });
};

//--- Validate Password Reset Token ---

export const validatePasswordResetTokenController = async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ message: "Token is required" });
  
  const userId = await validatePasswordResetToken(token);
  res.json({ userId });
};

//--- Mark Password Reset Token as Used ---

export const markPasswordResetTokenAsUsedController = async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ message: "Token is required" });
  
  await markPasswordResetTokenAsUsed(token);
  res.json({ message: "Password reset token marked as used" });
};

//--- Update User Password ---

export const updateUserPasswordController = async (req: Request, res: Response) => {
    // Get userId from the authenticated user
    const userId = (req as any).user?.id;
    const hashedPassword = await hashPassword(req.body.password);
  
    if (!userId || !hashedPassword) return res.status(400).json({ message: "User ID and password are required" });
    
    await updateUserPassword(Number(userId), hashedPassword);
    res.json({ message: "Password updated successfully" });
};

//--- Create Restaurant Password Reset Token ---

export const createRestaurantPasswordResetTokenController = async (req: Request, res: Response) => {
  const restaurantId = req.body.restaurantId;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  const token = await createRestaurantPasswordResetToken(Number(restaurantId));
  res.json({ token });
};

//--- Validate Restaurant Password Reset Token ---

export const validateRestaurantPasswordResetTokenController = async (req: Request, res: Response) => {
  const token = req.body.token;
  if (!token) return res.status(400).json({ message: "Token is required" });
  
  const restaurantId = await validateRestaurantPasswordResetToken(token);
  res.json({ restaurantId });
};
    
//--- Mark Restaurant Password Reset Token as Used ---

export const markRestaurantPasswordResetTokenAsUsedController = async (req: Request, res: Response) => {
  const token = req.body.token;
  if (!token) return res.status(400).json({ message: "Token is required" });
  
  await markRestaurantPasswordResetTokenAsUsed(token);
  res.json({ message: "Restaurant password reset token marked as used" });
};

//--- Update Restaurant Password ---

export const updateRestaurantPasswordController = async (req: Request, res: Response) => {
  // Get restaurantId from the authenticated user object
  // Check if the authenticated entity is a restaurant
  const authUser = (req as any).user;
  
  if (!authUser || authUser.type !== 'restaurant') {
    return res.status(403).json({ message: "Not authorized as a restaurant" });
  }
  
  const restaurantId = authUser.id;
  const hashedPassword = await hashPassword(req.body.password);
  
  if (!restaurantId || !hashedPassword) return res.status(400).json({ message: "Restaurant ID and password are required" });
  
  await updateRestaurantPassword(Number(restaurantId), hashedPassword);
  res.json({ message: "Password updated successfully" });
};

//--- User Login ---

export const loginUserController = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  
    const user = await loginUser(email, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateToken(user, 'user');
    res.json({ user, token });
  };

//--- Restaurant Login ---

export const loginRestaurantController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  
  const restaurant = await loginRestaurant(email, password);
  if (!restaurant) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = generateToken(restaurant, 'restaurant');
  res.json({ restaurant, token });
};

//--- Register User ---

export const registerUserController = async (req: Request, res: Response) => {
  try {
      // Extract all fields from the request body
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        city, 
        gender, 
        favoriteCuisines,
        nationality,  
        locationPermissionGranted,
        phone,
        birthday
      } = req.body;
    
      console.log('Received registration data:', {
        email,
        firstName,
        lastName,
        city,
        gender,
        favoriteCuisines,
        nationality,
        phone,
        birthday
      });
    
      // Validate required fields
      if (!email || !password || !firstName || !lastName || !birthday || !phone) {
        console.error('Missing required fields');
        return res.status(400).json({ message: "Missing required fields" });
      }
    
      // Create user data object with all fields
      const userData: any = {
        email, 
        password, 
        firstName, 
        lastName, 
        city, 
        gender, 
        favoriteCuisines,
        nationality: nationality || "", 
        locationPermissionGranted: locationPermissionGranted || false,
        locationUpdatedAt: new Date(),
        phone
      };

      // Handle birthday if provided
      try {
        userData.birthday = new Date(birthday);
        console.log('Parsed birthday:', userData.birthday);
        if (isNaN(userData.birthday.getTime())) {
          console.error('Invalid date format for birthday:', birthday);
          return res.status(400).json({ message: "Invalid date format for birthday" });
        }
      } catch (error) {
        console.error('Error parsing birthday:', error);
        return res.status(400).json({ message: "Invalid date format for birthday" });
      }

      // Create the user
      console.log('Creating user with data:', userData);
      const user = await registerUser(userData);
      console.log('User created successfully:', user);
      
      // Generate a JWT token for the new user
      const token = generateToken(user, 'user');
      
      // Return both user and token
      res.json({ user, token });
  } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        message: "There is an error", 
      });
  }
};


//--- Create Restaurant User ---

export const registerRestaurantUserController = async (req: Request, res: Response) => {
  const { email, password, name, logo, cuisine, priceRange, about, description } = req.body;
  const restaurantUser = await registerRestaurantUser({ email, password, name });
  const restaurantProfile = await createRestaurantProfile({
    about,
    description,
    cuisine,
    priceRange,
    logo,
    restaurantId: restaurantUser.id,
  });
  const token = generateToken(restaurantUser, 'restaurant');
  res.json({ restaurantUser, restaurantProfile, token });
};
