import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createVehicle,
  getMyVehicle,
  updateVehicle,
  setVehicleOnline,
  createPool,
  getMyPools,
  getMyPoolById,
  getRequestedRides,
  addRideToPool,
  updateRideStatus,
  completePool,
  cancelPool,
} from "../services/driver.service";

export async function createDriverVehicle(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { name, capacity } = req.body;

    if (
      typeof name !== "string" ||
      typeof capacity !== "number"
    ) {
      return res.status(400).json({
        message: "name and capacity are required",
      });
    }

    const vehicle = await createVehicle({
      driverId: req.user!.userId,
      name,
      capacity,
    });

    return res.status(201).json({
      vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to create vehicle",
    });
  }
}

export async function getDriverVehicle(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const vehicle = await getMyVehicle(req.user!.userId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      vehicle,
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function updateDriverVehicle(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { name, capacity } = req.body;

    if (
      typeof name !== "string" ||
      typeof capacity !== "number"
    ) {
      return res.status(400).json({
        message: "name and capacity are required",
      });
    }

    const vehicle = await updateVehicle(
      req.user!.userId,
      name,
      capacity
    );

    return res.status(200).json({
      vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to update vehicle",
    });
  }
}

export async function updateDriverVehicleStatus(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        message: "isOnline must be a boolean",
      });
    }

    const vehicle = await setVehicleOnline(
      req.user!.userId,
      isOnline
    );

    return res.status(200).json({
      vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to update vehicle status",
    });
  }
}

export async function createDriverPool(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { vehicleId, totalSeats } = req.body;

    if (
      typeof vehicleId !== "string" ||
      typeof totalSeats !== "number"
    ) {
      return res.status(400).json({
        message: "vehicleId and totalSeats are required",
      });
    }

    const pool = await createPool({
      driverId: req.user!.userId,
      vehicleId,
      totalSeats,
    });

    return res.status(201).json({
      pool,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to create pool",
    });
  }
}

export async function getDriverPools(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const pools = await getMyPools(req.user!.userId);

    return res.status(200).json({
      pools,
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getDriverPool(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const pool = await getMyPoolById(
      req.params.id,
      req.user!.userId
    );

    return res.status(200).json({
      pool,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Pool not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getDriverRequestedRides(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const rides = await getRequestedRides();

    return res.status(200).json({
      rides,
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function matchRideToPool(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { rideRequestId } = req.body;

    if (typeof rideRequestId !== "string") {
      return res.status(400).json({
        message: "rideRequestId is required",
      });
    }

    const member = await addRideToPool(
      req.params.id,
      rideRequestId,
      req.user!.userId
    );

    return res.status(201).json({
      message: "Ride matched to pool successfully",
      member,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to match ride",
    });
  }
}

export async function updateDriverRideStatus(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "DRIVER_ARRIVED",
      "STARTED",
      "COMPLETED",
    ];

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid ride status",
      });
    }

    const ride = await updateRideStatus(
      req.params.id,
      req.user!.userId,
      status as "DRIVER_ARRIVED" | "STARTED" | "COMPLETED"
    );

    return res.status(200).json({
      ride,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to update ride status",
    });
  }
}

export async function completeDriverPool(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const pool = await completePool(
      req.params.id,
      req.user!.userId
    );

    return res.status(200).json({
      message: "Pool completed successfully",
      pool,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to complete pool",
    });
  }
}

export async function cancelDriverPool(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const pool = await cancelPool(
      req.params.id,
      req.user!.userId
    );

    return res.status(200).json({
      message: "Pool cancelled successfully",
      pool,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to cancel pool",
    });
  }
}
