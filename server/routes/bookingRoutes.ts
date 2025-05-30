import { Express } from "express";
import * as bookingController from "@server/controllers/bookingController";
import { authenticate } from "@server/middleware/authMiddleware";

export function registerBookingRoutes(app: Express) {
  app.post("/api/booking", authenticate, bookingController.createBookingController);
  app.get("/api/booking/branch/:branchId", authenticate, bookingController.getBookingsForBranchController)
  app.get("/api/booking/branch/:branchId/date/:date", authenticate, bookingController.getBookingsForBranchOnDateController);
  app.get("/api/booking", authenticate, bookingController.getUserBookingsController);
  app.get("/api/booking/:id", authenticate, bookingController.getBookingByIdController);
  app.put("/api/booking/:id", authenticate, bookingController.updateBookingController);
  app.delete("/api/booking/:id", authenticate, bookingController.deleteBookingController);
  app.post("/api/booking/branch/:branchId/override", authenticate, bookingController.createBookingOverrideController);
  app.get("/api/booking/override/:id", authenticate, bookingController.getBookingOverrideController);
  app.get("/api/booking/overrides/:branchId", authenticate, bookingController.getBookingOverridesForBranchController);
  app.put("/api/booking/override/:id", authenticate, bookingController.updateBookingOverrideController);
  app.delete("/api/booking/override/:id", authenticate, bookingController.deleteBookingOverrideController);
  app.get("/api/booking/settings/:branchId", authenticate, bookingController.getBookingSettingsController);
  app.put("/api/booking/settings/:branchId", authenticate, bookingController.updateBookingSettingsController);
  app.put("/api/booking/change-status/:bookingId", authenticate, bookingController.changeBookingStatusController);
}
