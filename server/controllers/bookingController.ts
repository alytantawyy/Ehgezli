import { Request, Response } from "express";
import { changeBookingStatus, createBooking, createBookingOverride, createBookingSettings, deleteBooking, deleteBookingOverride, generateTimeSlots, getBookingById, getBookingByIdAndUserId, getBookingOverride, getBookingOverridesForBranch, getBookingSettings, getBookingsForBranch, getBookingsForBranchOnDate, getUserBookings, updateBooking, updateBookingOverride, updateBookingSettings } from "@server/services/bookingService";
import { getRestaurantBranchById } from "@server/services/branchService";

//--- Create Booking ---

export const createBookingController = async (req: Request, res: Response) => {
  const booking = req.body;
  const user = (req as any).user;
  
  // Determine if this is a restaurant user or regular user based on the type
  const isRestaurantUser = user?.type === 'restaurant';
  const userId = isRestaurantUser ? null : user?.id;
  const restaurantUserId = isRestaurantUser ? user?.id : null;

  if (!userId && !restaurantUserId) {
    return res.status(400).json({ message: "Either User ID or Restaurant ID is required" });
  }

  const bookingData: any = { ...booking };
  
  // Check if this is a guest booking (has guest information)
  const isGuestBooking = booking.guestName || booking.guestPhone || booking.guestEmail;
  
  // Only restaurant users can create guest bookings
  if (isGuestBooking && !isRestaurantUser) {
    return res.status(403).json({ 
      message: "Only restaurant users can create bookings for guests" 
    });
  }
  
  // Handle user ID assignment
  if (userId) bookingData.userId = userId;
  
  // Always attach restaurant user ID if available
  if (restaurantUserId) bookingData.restaurantUserId = restaurantUserId;
  
  // Validate guest information if this is a guest booking by a restaurant
  if (isRestaurantUser && isGuestBooking && (!bookingData.guestName || !bookingData.guestPhone)) {
    return res.status(400).json({ 
      message: "Guest name and phone are required when booking as a guest" 
    });
  }

  // Always set status to confirmed by default
  bookingData.status = "confirmed";

  const newBooking: any = await createBooking(bookingData);
  res.json(newBooking);
};

//--- Get Bookings for Branch ---

export const getBookingsForBranchController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  const bookings = await getBookingsForBranch(Number(branchId));
  res.json(bookings);
};

//--- Get Bookings for Branch on Date ---

export const getBookingsForBranchOnDateController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const branchId = req.params.branchId;
  const date = new Date(req.params.date);
  if (!branchId || !date) return res.status(400).json({ message: "Branch ID and Date are required" });
  
  const bookings = await getBookingsForBranchOnDate(Number(branchId), date);
  res.json(bookings);
};
  
//--- Get Booking by ID ---

export const getBookingByIdController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  
  const bookingId = req.params.id; 
  if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });
  
  const booking = await getBookingById(Number(bookingId));
  
  // If no booking found
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  
  // For regular users, only allow access to their own bookings
  if (user.type === 'user' && booking.userId !== user.id) {
    return res.status(403).json({ message: "You can only view your own bookings" });
  }
  
  // For restaurant users, only allow access to bookings in their own restaurant
  if (user.type === 'restaurant' && booking.restaurantId !== user.id) {
    return res.status(403).json({ message: "You can only view bookings from your own restaurant" });
  }
  
  // Remove restaurantId from response as it was only used for authorization
  const { restaurantId, ...bookingData } = booking;
  res.json(bookingData);
};
  
//--- Get Booking by ID and User ID ---

export const getBookingByIdAndUserIdController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const bookingId = req.params.bookingId;
  const userId = req.params.userId;
  if (!bookingId || !userId) return res.status(400).json({ message: "Booking ID and User ID are required" });
  
  const booking = await getBookingByIdAndUserId(Number(bookingId), Number(userId));
  res.json(booking);
};
  
//--- Get User Bookings ---

export const getUserBookingsController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  
  const bookings = await getUserBookings(user.id);
  res.json(bookings);
};

//--- Get Booking Settings ---

export const getBookingSettingsController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const restaurantId = user?.id;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized - Only restaurant users can access booking settings" });
  }
  
  const branchId = parseInt(req.params.branchId);
  if (!branchId || isNaN(branchId)) {
    return res.status(400).json({ message: "Valid branch ID is required" });
  }
  
  try {
    // Check if the branch belongs to this restaurant
    const branch = await getRestaurantBranchById(branchId, restaurantId);
    
    if (!branch) {
      return res.status(403).json({ 
        message: "Unauthorized - You can only access booking settings for your own branches" 
      });
    }
    
    const settings = await getBookingSettings(branchId);
    
    if (!settings) {
      return res.status(404).json({ message: "Booking settings not found for this branch" });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error retrieving booking settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve booking settings';
    res.status(500).json({ message: errorMessage });
  }
};
  

//--- Update Booking Settings ---

export const updateBookingSettingsController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const restaurantId = user?.id;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized - Only restaurant users can update booking settings" });
  }
  
  const branchId = parseInt(req.params.branchId);
  if (!branchId || isNaN(branchId)) {
    return res.status(400).json({ message: "Valid branch ID is required" });
  }
  
  try {
    // Check if the branch belongs to this restaurant
    const branch = await getRestaurantBranchById(branchId, restaurantId);
    
    if (!branch) {
      return res.status(403).json({ 
        message: "Unauthorized - You can only update booking settings for your own branches" 
      });
    }
    
    // Handle date fields if present in the data
    const { interval, maxSeatsPerSlot, maxTablesPerSlot, openTime, closeTime } = req.body;
    const updatedData: any = {};
    
    // Only include fields that are provided
    if (interval !== undefined) updatedData.interval = interval;
    if (maxSeatsPerSlot !== undefined) updatedData.maxSeatsPerSlot = maxSeatsPerSlot;
    if (maxTablesPerSlot !== undefined) updatedData.maxTablesPerSlot = maxTablesPerSlot;
    if (openTime !== undefined) updatedData.openTime = openTime;
    if (closeTime !== undefined) updatedData.closeTime = closeTime;
    
    const updatedSettings = await updateBookingSettings(branchId, updatedData);
    
    if (!updatedSettings) {
      return res.status(404).json({ message: "Booking settings not found" });
    }
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating booking settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update booking settings';
    res.status(500).json({ message: errorMessage });
  }
};
  
//--- Update Booking ---

export const updateBookingController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const bookingId = req.params.id;
  if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });

  // Get the booking with restaurant info to check authorization
  const booking = await getBookingById(Number(bookingId));
  
  // If no booking found
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  
  // For regular users, only allow access to their own bookings
  if (user.type === 'user' && booking.userId !== user.id) {
    return res.status(403).json({ message: "You can only update your own bookings" });
  }
  
  // For restaurant users, only allow access to bookings in their own restaurant
  if (user.type === 'restaurant' && booking.restaurantId !== user.id) {
    return res.status(403).json({ message: "You can only update bookings from your own restaurant" });
  }
  
  const data = req.body;
  const updatedBooking = await updateBooking(Number(bookingId), data);
  res.json(updatedBooking);
};

//--- Delete Booking (Deprecated) ---

export const deleteBookingController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const bookingId = parseInt(req.params.id);
  if (!bookingId || isNaN(bookingId)) {
    return res.status(400).json({ message: "Valid booking ID is required" });
  }

  try {
    // Get the booking with restaurant info to check authorization
    const booking = await getBookingById(bookingId);
    
    // If no booking found
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // For regular users, only allow access to their own bookings
    if (user.type === 'user' && booking.userId !== user.id) {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }
    
    // For restaurant users, only allow access to bookings in their own restaurant
    if (user.type === 'restaurant' && booking.restaurantId !== user.id) {
      return res.status(403).json({ message: "You can only cancel bookings from your own restaurant" });
    }
    
    // Instead of deleting, change status to cancelled
    const updatedBooking = await changeBookingStatus(bookingId, 'cancelled');
    
    res.json({ 
      ...updatedBooking,
      message: "Booking cancelled successfully" 
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking';
    res.status(500).json({ message: errorMessage });
  }
};

//--- Generate Time Slots ---

export const generateTimeSlotsController = async (req: Request, res: Response) => {
  const openTime = req.body.openTime;
  const closeTime = req.body.closeTime;
  const intervalMinutes = req.body.intervalMinutes;
  
  const slots = generateTimeSlots(openTime, closeTime, intervalMinutes);
  res.json(slots);
};

//--- Create Booking Override ---

export const createBookingOverrideController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const restaurantId = user?.id;
  const isRestaurantUser = user?.type === 'restaurant';
  const branchId = parseInt(req.params.branchId);
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized - Only restaurant users can create overrides" });
  }
  
  if (!branchId || isNaN(branchId)) {
    return res.status(400).json({ message: "Valid branch ID is required" });
  }
  
  try {
    // Check if the branch belongs to this restaurant
    const branch = await getRestaurantBranchById(branchId, restaurantId);
    
    if (!branch) {
      return res.status(403).json({ 
        message: "Unauthorized - You can only create overrides for branches that belong to your restaurant" 
      });
    }
    
    // Parse dates from the request body
    const { date, startTime, endTime, ...restOfBody } = req.body;
    
    // Validate required date fields
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ 
        message: "date, startTime, and endTime are required fields" 
      });
    }
    
    // Convert string dates to Date objects
    const parsedDate = new Date(date);
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    
    // Validate date parsing
    if (isNaN(parsedDate.getTime()) || isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ 
        message: "Invalid date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)" 
      });
    }
    
    // Add branchId to the override data from request body
    const override = {
      ...restOfBody,
      branchId,
      date: parsedDate,
      startTime: parsedStartTime,
      endTime: parsedEndTime
    };
    
    const newOverride = await createBookingOverride(override);
    res.json(newOverride);
  } catch (error) {
    console.error('Error creating booking override:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking override';
    res.status(500).json({ message: errorMessage });
  }
};

//--- Get Booking Override ---

export const getBookingOverrideController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const restaurantId = user?.id;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized - Only restaurant users can access booking overrides" });
  }
  
  const overrideId = req.params.id;
  if (!overrideId) return res.status(400).json({ message: "Override ID is required" });
  
  try {
    // Get the override
    const override = await getBookingOverride(Number(overrideId));
    
    if (!override) {
      return res.status(404).json({ message: "Booking override not found" });
    }
    
    // Check if the branch belongs to this restaurant
    const branch = await getRestaurantBranchById(override.branchId, restaurantId);
    
    if (!branch) {
      return res.status(403).json({ 
        message: "Unauthorized - You can only access booking overrides for your own branches" 
      });
    }
    
    res.json(override);
  } catch (error) {
    console.error('Error retrieving booking override:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve booking override';
    res.status(500).json({ message: errorMessage });
  }
};

//--- Get Booking Overrides for Branch ---

export const getBookingOverridesForBranchController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  const overrides = await getBookingOverridesForBranch(Number(branchId));
  res.json(overrides);
};
  
//--- Delete Booking Override ---

export const deleteBookingOverrideController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const restaurantId = user?.id;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized - Only restaurant users can delete booking overrides" });
  }
  
  const overrideId = parseInt(req.params.id);
  if (!overrideId || isNaN(overrideId)) {
    return res.status(400).json({ message: "Valid override ID is required" });
  }
  
  try {
    // Get the existing override to check ownership
    const existingOverride = await getBookingOverride(overrideId);
    
    if (!existingOverride) {
      return res.status(404).json({ message: "Booking override not found" });
    }
    
    // Check if the branch belongs to this restaurant
    const branch = await getRestaurantBranchById(existingOverride.branchId, restaurantId);
    
    if (!branch) {
      return res.status(403).json({ 
        message: "Unauthorized - You can only delete booking overrides for your own branches" 
      });
    }
    
    await deleteBookingOverride(overrideId);
    res.json({ message: "Booking override deleted successfully" });
  } catch (error) {
    console.error('Error deleting booking override:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete booking override';
    res.status(500).json({ message: errorMessage });
  }
};

//--- Update Booking Override ---

export const updateBookingOverrideController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const restaurantId = user?.id;
  const isRestaurantUser = user?.type === 'restaurant';
  
  if (!isRestaurantUser) {
    return res.status(401).json({ message: "Unauthorized - Only restaurant users can update booking overrides" });
  }
  
  const overrideId = parseInt(req.params.id);
  if (!overrideId || isNaN(overrideId)) {
    return res.status(400).json({ message: "Valid override ID is required" });
  }
  
  try {
    // Get the existing override to check ownership
    const existingOverride = await getBookingOverride(overrideId);
    
    if (!existingOverride) {
      return res.status(404).json({ message: "Booking override not found" });
    }
    
    // Check if the branch belongs to this restaurant
    const branch = await getRestaurantBranchById(existingOverride.branchId, restaurantId);
    
    if (!branch) {
      return res.status(403).json({ 
        message: "Unauthorized - You can only update booking overrides for your own branches" 
      });
    }
    
    // Parse dates from the request body if provided
    const { date, startTime, endTime, ...restOfBody } = req.body;
    const updatedData: any = { ...restOfBody };
    
    // Handle date field if provided
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ 
          message: "Invalid date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)" 
        });
      }
      updatedData.date = parsedDate;
    }
    
    // Handle startTime field if provided
    if (startTime) {
      const parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ 
          message: "Invalid startTime format. Please use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)" 
        });
      }
      updatedData.startTime = parsedStartTime;
    }
    
    // Handle endTime field if provided
    if (endTime) {
      const parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({ 
          message: "Invalid endTime format. Please use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)" 
        });
      }
      updatedData.endTime = parsedEndTime;
    }
    
    const updatedOverride = await updateBookingOverride(overrideId, updatedData);
    res.json(updatedOverride);
  } catch (error) {
    console.error('Error updating booking override:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update booking override';
    res.status(500).json({ message: errorMessage });
  }
};

//--- Change Booking Status ---

export const changeBookingStatusController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  
  const bookingId = parseInt(req.params.bookingId);
  if (!bookingId || isNaN(bookingId)) {
    return res.status(400).json({ message: "Valid booking ID is required" });
  }
  
  const status = req.body.status;
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }
  
  // Valid statuses
  const validStatuses = ["pending", "confirmed", "arrived", "cancelled", "completed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  try {
    // Get the booking to check authorization
    const booking = await getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // For regular users
    if (user.type === 'user') {
      // Users can only modify their own bookings
      if (booking.userId !== user.id) {
        return res.status(403).json({ message: "You can only modify your own bookings" });
      }
      
      // Users can only cancel bookings, not change to other statuses
      if (status !== 'cancelled') {
        return res.status(403).json({ message: "Users can only cancel bookings" });
      }
    } 
    // For restaurant users
    else if (user.type === 'restaurant') {
      // Restaurants can only modify bookings for their own restaurant
      if (booking.restaurantId !== user.id) {
        return res.status(403).json({ message: "You can only modify bookings for your own restaurant" });
      }
      
      // Restaurants can set any valid status
    }
    else {
      return res.status(401).json({ message: "Unknown user type" });
    }
    
    // All authorization checks passed, update the booking status
    const updatedBooking = await changeBookingStatus(bookingId, status);
    
    if (!updatedBooking) {
      return res.status(500).json({ message: "Failed to update booking status" });
    }
    
    res.json({
      ...updatedBooking,
      message: `Booking status updated to ${status}`
    });
  } catch (error) {
    console.error('Error changing booking status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to change booking status';
    res.status(500).json({ message: errorMessage });
  }
};