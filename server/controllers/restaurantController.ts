import { createRestaurant, createRestaurantProfile, deleteRestaurantProfile, getDetailedRestaurant, getRestaurantProfile, searchRestaurants, updateRestaurantProfile } from "@server/services/restaurantService";
import { createRestaurantUser, deleteRestaurantUser, getRestaurantUser, updateRestaurantUser } from "@server/services/restaurantUserService";
import { Request, Response } from "express";

//-- Get Restaurant Profile --

export const getRestaurantProfileController = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  const restaurantProfile = await getRestaurantProfile(Number(restaurantId));
  if (!restaurantProfile) return res.status(404).json({ message: "Restaurant profile not found" });
  res.json(restaurantProfile);
};

//-- Create Restaurant Profile --

export const createRestaurantController = async (req: Request, res: Response) => {
  const { email, password, name, about, description, cuisine, priceRange, logo } = req.body;
  const restaurantProfile = await createRestaurant({ email, password, name, about, description, cuisine, priceRange, logo });
  res.json(restaurantProfile);
};

//-- Update Restaurant Profile --

export const updateRestaurantProfileController = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  await updateRestaurantProfile(Number(restaurantId), req.body);
  res.json({ message: "Restaurant profile updated successfully" });
};

//-- Delete Restaurant Profile --

export const deleteRestaurantProfileController = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  await deleteRestaurantProfile(Number(restaurantId));
  res.json({ message: "Restaurant profile deleted successfully" });
};

//-- Get Detailed Restaurant --

export const getDetailedRestaurantController = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  const restaurant = await getDetailedRestaurant(Number(restaurantId));
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
  res.json(restaurant);
};

//-- Search Restaurants --

export const searchRestaurantsController = async (req: Request, res: Response) => {
  const restaurants = await searchRestaurants(req.body);
  if (!restaurants) return res.status(404).json({ message: "Restaurants not found" });
  res.json(restaurants);
};
  

  