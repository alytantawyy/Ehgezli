
import { Request, Response } from "express";
import { changeBookingStatus, createBooking, createBookingOverride, createBookingSettings, deleteBooking, deleteBookingOverride, generateTimeSlots, getBookingById, getBookingByIdAndUserId, getBookingOverride, getBookingOverridesForBranch, getBookingSettings, getBookingsForBranch, getBookingsForBranchOnDate, getUserBookings, updateBooking, updateBookingOverride, updateBookingSettings } from "@server/services/bookingService";

//--- Create Booking ---

export const createBookingController = async (req: Request, res: Response) => {
  const booking = req.body;
  
  const newBooking = await createBooking(booking);
  res.json(newBooking);
};



export const getBookingsForBranchController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  const bookings = await getBookingsForBranch(Number(branchId));
  res.json(bookings);
};

//--- Get Bookings for Branch on Date ---

export const getBookingsForBranchOnDateController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const date = new Date(req.params.date);
  if (!branchId || !date) return res.status(400).json({ message: "Branch ID and Date are required" });
  
  const bookings = await getBookingsForBranchOnDate(Number(branchId), date);
  res.json(bookings);
};
  
//--- Get Booking by ID ---

export const getBookingByIdController = async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });
  
  const booking = await getBookingById(Number(bookingId));
  res.json(booking);
};
  
//--- Get Booking by ID and User ID ---

export const getBookingByIdAndUserIdController = async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const userId = req.params.userId;
  if (!bookingId || !userId) return res.status(400).json({ message: "Booking ID and User ID are required" });
  
  const booking = await getBookingByIdAndUserId(Number(bookingId), Number(userId));
  res.json(booking);
};
  
//--- Get User Bookings ---

export const getUserBookingsController = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: "User ID is required" });
  
  const bookings = await getUserBookings(Number(userId));
  res.json(bookings);
};

//--- Get Booking Settings ---

export const getBookingSettingsController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  const settings = await getBookingSettings(Number(branchId));
  res.json(settings);
};
  
//--- Create Booking Settings ---

export const createBookingSettingsController = async (req: Request, res: Response) => {

  const settings = req.body;
  
  const newSettings = await createBookingSettings(settings);
  res.json(newSettings);
};

//--- Update Booking Settings ---

export const updateBookingSettingsController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const data = req.body;
  
  const updatedSettings = await updateBookingSettings(Number(branchId), data);
  res.json(updatedSettings);
};  
  
//--- Update Booking ---

export const updateBookingController = async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const data = req.body;
  
  const updatedBooking = await updateBooking(Number(bookingId), data);
  res.json(updatedBooking);
};

//--- Delete Booking ---

export const deleteBookingController = async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });
  
  await deleteBooking(Number(bookingId));
  res.json({ message: "Booking deleted successfully" });
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
  const override = req.body;
  
  const newOverride = await createBookingOverride(override);
  res.json(newOverride);
};

//--- Get Booking Override ---

export const getBookingOverrideController = async (req: Request, res: Response) => {
  const overrideId = req.params.overrideId;
  if (!overrideId) return res.status(400).json({ message: "Override ID is required" });
  
  const override = await getBookingOverride(Number(overrideId));
  res.json(override);
};

//--- Get Booking Overrides for Branch ---

export const getBookingOverridesForBranchController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  const overrides = await getBookingOverridesForBranch(Number(branchId));
  res.json(overrides);
};
  
//--- Delete Booking Override ---

export const deleteBookingOverrideController = async (req: Request, res: Response) => {
  const overrideId = req.params.overrideId;
  if (!overrideId) return res.status(400).json({ message: "Override ID is required" });
  
  await deleteBookingOverride(Number(overrideId));
  res.json({ message: "Booking override deleted successfully" });
};

//--- Update Booking Override ---

export const updateBookingOverrideController = async (req: Request, res: Response) => {
  const overrideId = req.params.overrideId;
  const data = req.body;
  
  const updatedOverride = await updateBookingOverride(Number(overrideId), data);
  res.json(updatedOverride);
};

//--- Change Booking Status ---

export const changeBookingStatusController = async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const status = req.body.status;
  
  const updatedBooking = await changeBookingStatus(Number(bookingId), status);
  res.json(updatedBooking);
};
  
  


  