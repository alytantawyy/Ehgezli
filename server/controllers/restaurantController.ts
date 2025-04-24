import { createRestaurant, getDetailedRestaurant, getRestaurantProfile, getRestaurants, searchRestaurants, updateRestaurant } from "@server/services/restaurantService";
import { Request, Response } from "express";

//--Get All Restaurants --

export const getRestaurantsController = async (req: Request, res: Response) => {
  const restaurants = await getRestaurants();
  res.json(restaurants);
};

//-- Get Restaurant Profile --

export const getRestaurantProfileController = async (req: Request, res: Response) => {

  // Check if user is authenticated
  const authUser = (req as any).user;
  if (!authUser || authUser.type !== "restaurant") return res.status(401).json({ message: "Unauthorized" });

  const restaurantId = authUser.id;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  const restaurantProfile = await getRestaurantProfile(Number(restaurantId));
  if (!restaurantProfile) return res.status(404).json({ message: "Restaurant profile not found" });
  res.json(restaurantProfile);
};

//-- Create Restaurant --

export const createRestaurantController = async (req: Request, res: Response) => {
  try {
    const { email, password, name, about, description, cuisine, priceRange, logo } = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }
    
    // Ensure description has a default value if not provided
    const restaurantData = {
      email, 
      password, 
      name, 
      about: about || "", 
      description: description || "A wonderful dining experience", // Default description
      cuisine: cuisine || "Mixed", 
      priceRange: priceRange || "$$", 
      logo: logo || ""
    };
    
    const restaurant = await createRestaurant(restaurantData);
    res.json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//-- Update Restaurant --

export const updateRestaurantController = async (req: Request, res: Response) => {
  // Check if user is authenticated
  const authUser = (req as any).user;
  if (!authUser || authUser.type !== "restaurant") return res.status(401).json({ message: "Unauthorized" });
  
  const restaurantId = authUser.id;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  await updateRestaurant(Number(restaurantId), req.body);
  res.json({ message: "Restaurant updated successfully" });
};


//-- Get Detailed Restaurant --

export const getDetailedRestaurantController = async (req: Request, res: Response) => {
  // Check if user is authenticated
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