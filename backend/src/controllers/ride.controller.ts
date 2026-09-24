import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createRide,
  getMyRides,
  getMyRideById,
  cancelRide,
} from "../services/ride.service";

export async function createRideRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { pickupLocation, destination, seats } = req.body;

    if (
      typeof pickupLocation !== "string" ||
      typeof destination !== "string" ||
      typeof seats !== "number"
    ) {
      return res.status(400).json({
        message: "pickupLocation, destination and seats are required",
      });
    }

    const result = await createRide({
      passengerId: req.user!.userId,
      pickupLocation,
      destination,
      seats,
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getMyRideRequests(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const rides = await getMyRides(req.user!.userId);

    return res.status(200).json({
      rides,
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getMyRideRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const ride = await getMyRideById(
      String(req.params.id),
      req.user!.userId
    );

    return res.status(200).json({
      ride,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Ride not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function cancelRideRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const ride = await cancelRide(
      String(req.params.id),
      req.user!.userId
    );

    return res.status(200).json({
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Ride not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.startsWith("Ride cannot be cancelled")) {
        return res.status(400).json({
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
