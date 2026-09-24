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

export async function getMyRides(passengerId: string) {
  return prisma.rideRequest.findMany({
    where: {
      passengerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMyRideById(
  rideId: string,
  passengerId: string
) {
  const ride = await prisma.rideRequest.findFirst({
    where: {
      id: rideId,
      passengerId,
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  return ride;
}

export async function cancelRide(
  rideId: string,
  passengerId: string
) {
  const ride = await prisma.rideRequest.findFirst({
    where: {
      id: rideId,
      passengerId,
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  const cancellableStatuses = ["REQUESTED", "MATCHED"];

  if (!cancellableStatuses.includes(ride.status)) {
    throw new Error(
      `Ride cannot be cancelled from ${ride.status} status`
    );
  }

  const updatedRide = await prisma.rideRequest.update({
    where: {
      id: ride.id,
    },
    data: {
      status: "CANCELLED",
    },
  });

  await prisma.rideStatusHistory.create({
    data: {
      rideRequestId: ride.id,
      fromStatus: ride.status,
      toStatus: "CANCELLED",
    },
  });

  return updatedRide;
}
