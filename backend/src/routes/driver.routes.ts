import { Router } from "express";
import {
  createDriverVehicle,
  getDriverVehicle,
  updateDriverVehicle,
  updateDriverVehicleStatus,
  createDriverPool,
  getDriverPools,
  getDriverPool,
  getDriverRequestedRides,
  matchRideToPool,
  automaticallyMatchRide,
  updateDriverRideStatus,
  completeDriverPool,
  cancelDriverPool,
} from "../controllers/driver.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(
  authenticate,
  requireRole("DRIVER")
);

router.post(
  "/vehicle",
  createDriverVehicle
);

router.get(
  "/vehicle",
  getDriverVehicle
);

router.patch(
  "/vehicle",
  updateDriverVehicle
);

router.patch(
  "/vehicle/status",
  updateDriverVehicleStatus
);

router.get(
  "/rides/requests",
  getDriverRequestedRides
);

router.post(
  "/rides/:id/auto-match",
  automaticallyMatchRide
);

router.patch(
  "/rides/:id/status",
  updateDriverRideStatus
);

router.post(
  "/pools",
  createDriverPool
);

router.get(
  "/pools",
  getDriverPools
);

router.get(
  "/pools/:id",
  getDriverPool
);

router.post(
  "/pools/:id/members",
  matchRideToPool
);

router.patch(
  "/pools/:id/complete",
  completeDriverPool
);

router.patch(
  "/pools/:id/cancel",
  cancelDriverPool
);

export default router;
