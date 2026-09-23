const DISTANCES: Record<string, number> = {
  "Dhanmondi:Gulshan": 8,
  "Dhanmondi:Banani": 7,
  "Dhanmondi:Mirpur": 9,
  "Gulshan:Banani": 4,
  "Gulshan:Mirpur": 10,
  "Banani:Mirpur": 9,
};

export function estimateDistance(
  pickupLocation: string,
  destination: string
): number {
  const key = `${pickupLocation}:${destination}`;

  const distance = DISTANCES[key];

  if (distance === undefined) {
    throw new Error(
      `Distance is not available for ${pickupLocation} to ${destination}`
    );
  }

  return distance;
}