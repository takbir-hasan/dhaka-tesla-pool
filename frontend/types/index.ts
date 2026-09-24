export type UserRole =
  | "PASSENGER"
  | "DRIVER";

export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

export type PoolStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type Ride = {
  id: string;
  pickupLocation: string;
  destination: string;
  seats: number;
  estimatedFare: number;
  finalFare: number | null;
  status: RideStatus;
  createdAt: string;
};

export type Vehicle = {
  id: string;
  name: string;
  capacity: number;
  isOnline: boolean;
};

export type Pool = {
  id: string;
  totalSeats: number;
  occupiedSeats: number;
  status: PoolStatus;
  vehicle: Vehicle;
  members: Array<{
    id: string;
    seats: number;
    fare: number;
    rideRequest: Ride;
  }>;
};
