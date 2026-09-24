import { Router } from "express";
import {
  createRideRequest,
  getMyRideRequests,
  getMyRideRequest,
  cancelRideRequest
} from "../controllers/ride.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("PASSENGER"),
  getMyRideRequests
);

router.get(
  "/:id",
  authenticate,
  requireRole("PASSENGER"),
  getMyRideRequest
);

router.post(
  "/",
  authenticate,
  requireRole("PASSENGER"),
  createRideRequest
);

router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("PASSENGER"),
  cancelRideRequest
);

export default router;
