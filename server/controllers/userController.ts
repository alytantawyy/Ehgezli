import { generateToken } from "@server/services/authService";
import { getUser, updateUserProfile, deleteUser, getUserLocation, updateUserLocation } from "@server/services/userService";
import { Request, Response } from "express";

// userController.ts

//--- Get User Profile ---

export const getUserProfileController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
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
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { email, firstName, lastName, city, nationality, favoriteCuisines } = req.body;
      
        const user = await updateUserProfile(userId, { email, firstName, lastName, city, nationality, favoriteCuisines });
        res.json(user);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

//--- Delete User ---

  export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
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
        const userId = (req as any).user?.id;
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

  // Update user location permission status only (not storing coordinates for privacy)
  export const updateUserLocationController = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { locationPermissionGranted } = req.body;
      
      // Always use the current date for locationUpdatedAt
      const locationUpdatedAt = new Date();
    
      // Only update the permission status, not the actual coordinates
      const updatedLocation = await updateUserLocation(userId, { 
        locationPermissionGranted: locationPermissionGranted ?? false // Default to false if not provided
      });
      
      res.json(updatedLocation);
    } catch (error) {
        console.error('Error updating user location permission:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

  //--- Get Location Permission Status ---

  export const getLocationPermissionController = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const locationInfo = await getUserLocation(userId);
      
      res.json({ 
        locationPermissionGranted: locationInfo?.locationPermissionGranted || false 
      });
    } catch (error) {
        console.error('Error getting location permission status:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };

  //--- Update Location Permission Status ---

  export const updateLocationPermissionController = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { locationPermissionGranted } = req.body;
      
      // Only update the permission status
      const updatedLocation = await updateUserLocation(userId, { 
        locationPermissionGranted: locationPermissionGranted ?? false // Default to false if not provided
      });
      
      res.json({ success: true, locationPermissionGranted: updatedLocation.locationPermissionGranted });
    } catch (error) {
        console.error('Error updating location permission:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };