import prisma from "../config/prisma";

type CreateVehicleInput = {
  driverId: string;
  name: string;
  capacity: number;
};

type CreatePoolInput = {
  driverId: string;
  vehicleId: string;
  totalSeats: number;
};

export async function createVehicle(input: CreateVehicleInput) {
  if (input.capacity <= 0) {
    throw new Error("Vehicle capacity must be greater than zero");
  }

  const existingVehicle = await prisma.vehicle.findUnique({
    where: {
      driverId: input.driverId,
    },
  });

  if (existingVehicle) {
    throw new Error("Driver already has a vehicle");
  }

  return prisma.vehicle.create({
    data: {
      driverId: input.driverId,
      name: input.name,
      capacity: input.capacity,
    },
  });
}

export async function getMyVehicle(driverId: string) {
  return prisma.vehicle.findUnique({
    where: {
      driverId,
    },
  });
}

export async function updateVehicle(
  driverId: string,
  name: string,
  capacity: number
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      driverId,
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (capacity <= 0) {
    throw new Error("Vehicle capacity must be greater than zero");
  }

  if (capacity < vehicle.capacity) {
    const activePool = await prisma.pool.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: "OPEN",
      },
    });

    if (activePool && activePool.occupiedSeats > capacity) {
      throw new Error(
        "Vehicle capacity cannot be lower than occupied seats"
      );
    }
  }

  return prisma.vehicle.update({
    where: {
      id: vehicle.id,
    },
    data: {
      name,
      capacity,
    },
  });
}

export async function setVehicleOnline(
  driverId: string,
  isOnline: boolean
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      driverId,
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  return prisma.vehicle.update({
    where: {
      id: vehicle.id,
    },
    data: {
      isOnline,
    },
  });
}

export async function createPool(input: CreatePoolInput) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: input.vehicleId,
      driverId: input.driverId,
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found or does not belong to driver");
  }

  if (!vehicle.isOnline) {
    throw new Error("Vehicle must be online before creating a pool");
  }

  if (input.totalSeats <= 0) {
    throw new Error("Pool seats must be greater than zero");
  }

  if (input.totalSeats > vehicle.capacity) {
    throw new Error("Pool seats cannot exceed vehicle capacity");
  }

  const existingPool = await prisma.pool.findFirst({
    where: {
      driverId: input.driverId,
      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
    },
  });

  if (existingPool) {
    throw new Error("Driver already has an active pool");
  }

  return prisma.pool.create({
    data: {
      driverId: input.driverId,
      vehicleId: input.vehicleId,
      totalSeats: input.totalSeats,
      occupiedSeats: 0,
      status: "OPEN",
    },
  });
}

export async function getMyPools(driverId: string) {
  return prisma.pool.findMany({
    where: {
      driverId,
    },
    include: {
      vehicle: true,
      members: {
        include: {
          rideRequest: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMyPoolById(
  poolId: string,
  driverId: string
) {
  const pool = await prisma.pool.findFirst({
    where: {
      id: poolId,
      driverId,
    },
    include: {
      vehicle: true,
      members: {
        include: {
          rideRequest: true,
        },
      },
    },
  });

  if (!pool) {
    throw new Error("Pool not found");
  }

  return pool;
}

export async function getRequestedRides() {
  return prisma.rideRequest.findMany({
    where: {
      status: "REQUESTED",
      poolMember: null,
    },
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function addRideToPool(
  poolId: string,
  rideRequestId: string,
  driverId: string
) {
  const pool = await prisma.pool.findFirst({
    where: {
      id: poolId,
      driverId,
    },
  });

  if (!pool) {
    throw new Error("Pool not found");
  }

  if (pool.status !== "OPEN") {
    throw new Error("Only an open pool can accept rides");
  }

  const ride = await prisma.rideRequest.findUnique({
    where: {
      id: rideRequestId,
    },
  });

  if (!ride) {
    throw new Error("Ride request not found");
  }

  if (ride.status !== "REQUESTED") {
    throw new Error("Ride is no longer available for matching");
  }

  if (ride.seats <= 0) {
    throw new Error("Invalid ride seat count");
  }

  const existingMember = await prisma.poolMember.findUnique({
    where: {
      rideRequestId,
    },
  });

  if (existingMember) {
    throw new Error("Ride is already assigned to a pool");
  }

  const availableSeats = pool.totalSeats - pool.occupiedSeats;

  if (ride.seats > availableSeats) {
    throw new Error("Not enough seats available in this pool");
  }

  return prisma.$transaction(async (tx) => {
    const member = await tx.poolMember.create({
      data: {
        poolId: pool.id,
        rideRequestId: ride.id,
        seats: ride.seats,
        fare: ride.finalFare ?? ride.estimatedFare,
      },
    });

    await tx.pool.update({
      where: {
        id: pool.id,
      },
      data: {
        occupiedSeats: {
          increment: ride.seats,
        },
        status:
          pool.occupiedSeats + ride.seats >= pool.totalSeats
            ? "IN_PROGRESS"
            : "OPEN",
      },
    });

    await tx.rideRequest.update({
      where: {
        id: ride.id,
      },
      data: {
        status: "MATCHED",
      },
    });

    await tx.rideStatusHistory.create({
      data: {
        rideRequestId: ride.id,
        fromStatus: "REQUESTED",
        toStatus: "MATCHED",
      },
    });

    return member;
  });
}

const allowedStatusTransitions: Record<string, string[]> = {
  MATCHED: ["DRIVER_ARRIVED", "CANCELLED"],
  DRIVER_ARRIVED: ["STARTED", "CANCELLED"],
  STARTED: ["COMPLETED"],
};

export async function updateRideStatus(
  rideRequestId: string,
  driverId: string,
  newStatus: "DRIVER_ARRIVED" | "STARTED" | "COMPLETED"
) {
  const ride = await prisma.rideRequest.findFirst({
    where: {
      id: rideRequestId,
      poolMember: {
        pool: {
          driverId,
        },
      },
    },
  });

  if (!ride) {
    throw new Error("Ride not found or not assigned to this driver");
  }

  const allowedNextStatuses =
    allowedStatusTransitions[ride.status] ?? [];

  if (!allowedNextStatuses.includes(newStatus)) {
    throw new Error(
      `Cannot change ride status from ${ride.status} to ${newStatus}`
    );
  }

  return prisma.$transaction(async (tx) => {
    const updatedRide = await tx.rideRequest.update({
      where: {
        id: ride.id,
      },
      data: {
        status: newStatus,
      },
    });

    await tx.rideStatusHistory.create({
      data: {
        rideRequestId: ride.id,
        fromStatus: ride.status,
        toStatus: newStatus,
      },
    });

    if (newStatus === "COMPLETED") {
      const member = await tx.poolMember.findUnique({
        where: {
          rideRequestId: ride.id,
        },
      });

      if (member) {
        const pool = await tx.pool.findUnique({
          where: {
            id: member.poolId,
          },
        });

        if (pool) {
          const remainingMembers = await tx.poolMember.count({
            where: {
              poolId: pool.id,
              rideRequest: {
                status: {
                  not: "COMPLETED",
                },
              },
            },
          });

          if (remainingMembers === 0) {
            await tx.pool.update({
              where: {
                id: pool.id,
              },
              data: {
                status: "COMPLETED",
              },
            });
          }
        }
      }
    }

    return updatedRide;
  });
}

export async function completePool(
  poolId: string,
  driverId: string
) {
  const pool = await prisma.pool.findFirst({
    where: {
      id: poolId,
      driverId,
    },
  });

  if (!pool) {
    throw new Error("Pool not found");
  }

  if (pool.status === "COMPLETED") {
    throw new Error("Pool is already completed");
  }

  if (pool.status === "CANCELLED") {
    throw new Error("Cancelled pool cannot be completed");
  }

  return prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      status: "COMPLETED",
    },
  });
}

export async function cancelPool(
  poolId: string,
  driverId: string
) {
  const pool = await prisma.pool.findFirst({
    where: {
      id: poolId,
      driverId,
    },
    include: {
      members: {
        include: {
          rideRequest: true,
        },
      },
    },
  });

  if (!pool) {
    throw new Error("Pool not found");
  }

  if (pool.status === "COMPLETED") {
    throw new Error("Completed pool cannot be cancelled");
  }

  return prisma.$transaction(async (tx) => {
    for (const member of pool.members) {
      if (
        member.rideRequest.status !== "COMPLETED" &&
        member.rideRequest.status !== "CANCELLED"
      ) {
        await tx.rideRequest.update({
          where: {
            id: member.rideRequest.id,
          },
          data: {
            status: "CANCELLED",
          },
        });

        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: member.rideRequest.id,
            fromStatus: member.rideRequest.status,
            toStatus: "CANCELLED",
          },
        });
      }
    }

    return tx.pool.update({
      where: {
        id: pool.id,
      },
      data: {
        status: "CANCELLED",
      },
    });
  });
}
