const BASE_FARE = 10000;
const PER_KM_CHARGE = 2000;

export function calculateFare(distanceKm: number): number {
  if (distanceKm <= 0) {
    throw new Error("Distance must be greater than zero");
  }

  return BASE_FARE + Math.ceil(distanceKm * PER_KM_CHARGE);
}