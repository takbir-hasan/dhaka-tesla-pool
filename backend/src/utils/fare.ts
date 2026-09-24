const BASE_FARE = 50;
const PER_KM_FARE = 15;
const SERVICE_FEE_RATE = 0.05;

const DISTANCES: Record<string, number> = {
  "Dhanmondi:Gulshan": 8,
  "Dhanmondi:Banani": 7,
  "Dhanmondi:Mirpur": 9,
  "Gulshan:Dhanmondi": 8,
  "Gulshan:Banani": 4,
  "Gulshan:Mirpur": 10,
  "Banani:Dhanmondi": 7,
  "Banani:Gulshan": 4,
  "Banani:Mirpur": 9,
  "Mirpur:Dhanmondi": 9,
  "Mirpur:Gulshan": 10,
  "Mirpur:Banani": 9,
};

export function estimateDistance(
  pickupLocation: string,
  destination: string
): number {
  if (pickupLocation === destination) {
    throw new Error(
      "Pickup and destination cannot be the same"
    );
  }

  const key = `${pickupLocation}:${destination}`;

  const distance = DISTANCES[key];

  if (distance === undefined) {
    throw new Error(
      `Distance is not available for ${pickupLocation} to ${destination}`
    );
  }

  return distance;
}

export function calculateBaseFare(
  distanceKm: number
): number {
  if (distanceKm <= 0) {
    throw new Error("Distance must be greater than zero");
  }

  return BASE_FARE + distanceKm * PER_KM_FARE;
}

export function calculateServiceFee(
  fare: number
): number {
  if (fare < 0) {
    throw new Error("Fare cannot be negative");
  }

  return Number(
    (fare * SERVICE_FEE_RATE).toFixed(2)
  );
}

export function calculateEstimatedFare(
  pickupLocation: string,
  destination: string,
  seats: number
): number {
  if (!Number.isInteger(seats) || seats <= 0) {
    throw new Error(
      "Seats must be a positive integer"
    );
  }

  const distance = estimateDistance(
    pickupLocation,
    destination
  );

  const baseFare = calculateBaseFare(distance);

  const passengerFare = baseFare * seats;

  const serviceFee =
    calculateServiceFee(passengerFare);

  return Number(
    (passengerFare + serviceFee).toFixed(2)
  );
}

export function calculatePoolFare(
  estimatedFare: number,
  poolOccupancy: number
): number {
  if (estimatedFare < 0) {
    throw new Error(
      "Estimated fare cannot be negative"
    );
  }

  if (
    !Number.isInteger(poolOccupancy) ||
    poolOccupancy <= 0
  ) {
    throw new Error(
      "Pool occupancy must be a positive integer"
    );
  }

  /*
   * Shared rides receive a simple pool discount.
   * The discount increases slightly with occupancy,
   * but is capped at 20%.
   */
  const discountRate = Math.min(
    0.05 * (poolOccupancy - 1),
    0.2
  );

  const finalFare =
    estimatedFare * (1 - discountRate);

  return Number(finalFare.toFixed(2));
}
