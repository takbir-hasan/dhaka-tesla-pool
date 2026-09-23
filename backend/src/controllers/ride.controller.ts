import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createRide } from "../services/ride.service";

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