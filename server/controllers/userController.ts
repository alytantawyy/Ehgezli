import { getUser, updateUserProfile, deleteUser, getUserLocation, updateUserLocation, createUser } from "@server/services/userService";
import { Request, Response } from "express";

// userController.ts

//--- Get User Profile ---

export const getUserProfileController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as number;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
      
        const user = await getUser(userId);
        res.json(user);
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

export const updateUserProfileController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as number;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { firstName, lastName, city, gender, favoriteCuisines } = req.body;
      
        const user = await updateUserProfile(userId, { firstName, lastName, city, gender, favoriteCuisines });
        res.json(user);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

//--- Delete User ---

  export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as number;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
      
        await deleteUser(userId);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };


//--- Get User Location ---

  export const getUserLocationController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as number;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
        const location = await getUserLocation(userId);
        if (!location) return res.status(404).json({ message: "Location not found" });
        res.json(location);
    } catch (error) {
        console.error('Error getting user location:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

  //--- Update User Location ---

  export const updateUserLocationController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as number;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
    const { lastLatitude, lastLongitude, locationUpdatedAt, locationPermissionGranted } = req.body;
  
    const location = await getUserLocation(userId);
    if (!location) return res.status(404).json({ message: "Location not found" });
  
    const updatedLocation = await updateUserLocation(userId, { lastLatitude, lastLongitude, locationUpdatedAt, locationPermissionGranted });
    res.json(updatedLocation);
    } catch (error) {
        console.error('Error updating user location:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

  //--Create User--

  export const createUserController = async (req: Request, res: Response) => {
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
          lastLatitude,
          lastLongitude,
          locationPermissionGranted
        } = req.body;
      
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
          locationUpdatedAt: new Date()
        };

        // Handle birthday if provided
        if (req.body.birthday) {
          userData.birthday = new Date(req.body.birthday);
        }

        // Create the user
        const user = await createUser(userData);
        res.json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  

  


  
  
  
  