import { createRestaurantUser, deleteRestaurantUser, getRestaurantUser, updateRestaurantUser } from "@server/services/restaurantUserService";
import { Request, Response } from "express";

//--- Get Restaurant User ---

export const getRestaurantUserController = async (req: Request, res: Response) => {
  const restaurantUserId = req.user?.id as number;
  if (!restaurantUserId) return res.status(401).json({ message: "Unauthorized" });
  
  const restaurantUser = await getRestaurantUser(restaurantUserId);
  res.json(restaurantUser);
};

//--- Create Restaurant User ---

export const createRestaurantUserController = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const restaurantUser = await createRestaurantUser({ email, password, name });
  res.json(restaurantUser);
};

//--- Update Restaurant User ---

export const updateRestaurantUserController = async (req: Request, res: Response) => {
  const restaurantUserId = req.user?.id as number;
  if (!restaurantUserId) return res.status(401).json({ message: "Unauthorized" });
  
  const { email, password, name } = req.body;
  const restaurantUser = await updateRestaurantUser(restaurantUserId, { email, password, name });
  res.json(restaurantUser);
};

//--- Delete Restaurant User ---

export const deleteRestaurantUserController = async (req: Request, res: Response) => {
  const restaurantUserId = req.user?.id as number;
  if (!restaurantUserId) return res.status(401).json({ message: "Unauthorized" });
  
  await deleteRestaurantUser(restaurantUserId);
  res.json({ message: "Restaurant user deleted successfully" });
};
  