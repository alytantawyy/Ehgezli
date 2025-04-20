import { Express } from "express";
import * as bookingController from "@server/controllers/bookingController";

export function registerBookingRoutes(app: Express) {
  app.post("/api/booking", bookingController.createBookingController);
  app.get("/api/booking/:branchId", bookingController.getBookingsForBranchController)
  app.get("/api/booking", bookingController.getUserBookingsController);
  app.get("/api/booking/:id", bookingController.getBookingByIdController);
  app.put("/api/booking/:id", bookingController.updateBookingController);
  app.delete("/api/booking/:id", bookingController.deleteBookingController);
  app.post("/api/booking/generate-time-slots", bookingController.generateTimeSlotsController);
  app.post("/api/booking/create-override", bookingController.createBookingOverrideController);
  app.get("/api/booking/override/:id", bookingController.getBookingOverrideController);
  app.get("/api/booking/overrides/:branchId", bookingController.getBookingOverridesForBranchController);
  app.put("/api/booking/override/:id", bookingController.updateBookingOverrideController);
  app.delete("/api/booking/override/:id", bookingController.deleteBookingOverrideController);
  app.post("/api/booking/settings", bookingController.createBookingSettingsController);
  app.get("/api/booking/settings/:branchId", bookingController.getBookingSettingsController);
  app.put("/api/booking/settings/:branchId", bookingController.updateBookingSettingsController);
  app.post("/api/booking/change-status", bookingController.changeBookingStatusController);
}
