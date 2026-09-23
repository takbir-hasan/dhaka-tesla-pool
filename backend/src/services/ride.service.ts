import prisma from "../config/prisma";
import { estimateDistance } from "../utils/distance";
import { calculateFare } from "../utils/fare";

type CreateRideInput = {
  passengerId: string;
  pickupLocation: string;
  destination: string;
  seats: number;
};

export async function createRide(input: CreateRideInput) {
  if (input.seats <= 0) {
    throw new Error("Seats must be greater than zero");
  }

  const distanceKm = estimateDistance(
    input.pickupLocation,
    input.destination
  );

  const estimatedFare = calculateFare(distanceKm);

  const ride = await prisma.rideRequest.create({
    data: {
      passengerId: input.passengerId,
      pickupLocation: input.pickupLocation,
      destination: input.destination,
      seats: input.seats,
      estimatedFare,
      status: "REQUESTED",
    },
  });

  return {
    ride,
    distanceKm,
  };
}