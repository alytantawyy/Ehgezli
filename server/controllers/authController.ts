import { createPasswordResetToken, createRestaurantPasswordResetToken, generateToken, hashPassword, markPasswordResetTokenAsUsed, markRestaurantPasswordResetTokenAsUsed, updateRestaurantPassword, updateUserPassword, validatePasswordResetToken, validateRestaurantPasswordResetToken, verifyRestaurantLogin, verifyUserLogin } from "@server/services/authService";
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

//--- Verify User Login ---

export const verifyUserLoginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  
    const user = await verifyUserLogin(email, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateToken(user, 'user');
    res.json({ user, token });
  };

//--- Verify Restaurant Login ---

export const verifyRestaurantLoginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  
  const restaurant = await verifyRestaurantLogin(email, password);
  if (!restaurant) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = generateToken(restaurant, 'restaurant');
  res.json({ restaurant, token });
};
