import prisma from "../config/prisma";
import {
  calculateEstimatedFare,
} from "../utils/fare";

type CreateRideInput = {
  passengerId: string;
  pickupLocation: string;
  destination: string;
  seats: number;
};

export async function createRide(
  input: CreateRideInput
) {
  if (
    !Number.isInteger(input.seats) ||
    input.seats <= 0
  ) {
    throw new Error(
      "Seats must be a positive integer"
    );
  }

  const estimatedFare =
    calculateEstimatedFare(
      input.pickupLocation,
      input.destination,
      input.seats
    );

  return prisma.rideRequest.create({
    data: {
      passengerId: input.passengerId,
      pickupLocation: input.pickupLocation,
      destination: input.destination,
      seats: input.seats,
      estimatedFare,
      status: "REQUESTED",
    },
  });
}

export function estimateRideFare(
  pickupLocation: string,
  destination: string,
  seats: number
) {
  return calculateEstimatedFare(
    pickupLocation,
    destination,
    seats
  );
}

export async function getMyRides(
  passengerId: string
) {
  return prisma.rideRequest.findMany({
    where: {
      passengerId,
    },
    include: {
      poolMember: {
        include: {
          pool: {
            include: {
              vehicle: true,
              driver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRideById(
  rideId: string,
  passengerId: string
) {
  const ride = await prisma.rideRequest.findFirst({
    where: {
      id: rideId,
      passengerId,
    },
    include: {
      poolMember: {
        include: {
          pool: {
            include: {
              vehicle: true,
              driver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      statusHistory: {
        orderBy: {
          createdAt: "asc",
        },
      },
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

  if (
    ride.status === "COMPLETED"
  ) {
    throw new Error(
      "Completed ride cannot be cancelled"
    );
  }

  if (
    ride.status === "CANCELLED"
  ) {
    throw new Error(
      "Ride is already cancelled"
    );
  }

  if (
    ride.status === "MATCHED"
  ) {
    throw new Error(
      "Matched ride cannot be cancelled"
    );
  }

  if (
    ride.status === "STARTED"
  ) {
    throw new Error(
      "Started ride cannot be cancelled"
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const updatedRide =
        await tx.rideRequest.update({
          where: {
            id: ride.id,
          },
          data: {
            status: "CANCELLED",
          },
        });

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          fromStatus: ride.status,
          toStatus: "CANCELLED",
        },
      });

      /*
       * If the ride had already been matched,
       * release its occupied seats from the pool.
       */
      const member =
        await tx.poolMember.findUnique({
          where: {
            rideRequestId: ride.id,
          },
        });

      if (member) {
        const pool =
          await tx.pool.findUnique({
            where: {
              id: member.poolId,
            },
          });

        if (pool) {
          await tx.pool.update({
            where: {
              id: pool.id,
            },
            data: {
              occupiedSeats: {
                decrement: member.seats,
              },
              status:
                pool.status === "IN_PROGRESS"
                  ? "OPEN"
                  : pool.status,
            },
          });
        }

        await tx.poolMember.delete({
          where: {
            id: member.id,
          },
        });
      }

      return updatedRide;
    }
  );
}
