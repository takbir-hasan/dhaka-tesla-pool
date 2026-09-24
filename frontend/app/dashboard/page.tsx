"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import {
  clearAuth,
  getUser,
} from "../../lib/auth";
import { Ride } from "../../types";

const locations = [
  "Dhanmondi",
  "Gulshan",
  "Banani",
  "Mirpur",
];

export default function DashboardPage() {
  const router = useRouter();

  const [rides, setRides] =
    useState<Ride[]>([]);

  const [pickupLocation, setPickupLocation] =
    useState("Dhanmondi");

  const [destination, setDestination] =
    useState("Gulshan");

  const [seats, setSeats] =
    useState(1);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [cancellingRideId, setCancellingRideId] =
    useState<string | null>(null);

  const user = getUser();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "PASSENGER") {
      router.push("/driver");
      return;
    }

    loadRides();
  }, []);

  async function loadRides() {
    try {
      const response = await api.get("/rides");

      setRides(
        response.data.rides || []
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to load rides"
      );
    }
  }

  async function createRide(
    event: FormEvent
  ) {
    event.preventDefault();

    if (pickupLocation === destination) {
      setError(
        "Pickup and destination cannot be the same"
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/rides", {
        pickupLocation,
        destination,
        seats: Number(seats),
      });

      setSeats(1);

      await loadRides();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to create ride"
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelRide(
    rideId: string
  ) {
    setError("");
    setCancellingRideId(rideId);

    try {
      await api.patch(
        `/rides/${rideId}/cancel`
      );

      await loadRides();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to cancel ride"
      );
    } finally {
      setCancellingRideId(null);
    }
  }

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <h1>Passenger Dashboard</h1>

          <p>
            Welcome, {user?.name}
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <section className="card">
        <h2>Request a Ride</h2>

        <form onSubmit={createRide}>
          <select
            value={pickupLocation}
            onChange={(event) =>
              setPickupLocation(
                event.target.value
              )
            }
          >
            {locations.map((location) => (
              <option
                key={location}
                value={location}
              >
                {location}
              </option>
            ))}
          </select>

          <select
            value={destination}
            onChange={(event) =>
              setDestination(
                event.target.value
              )
            }
          >
            {locations.map((location) => (
              <option
                key={location}
                value={location}
              >
                {location}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            max="6"
            value={seats}
            onChange={(event) =>
              setSeats(
                Number(event.target.value)
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Requesting..."
              : "Request Ride"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>My Rides</h2>

        {rides.length === 0 ? (
          <p>No rides yet.</p>
        ) : (
          <div className="ride-list">
            {rides.map((ride) => {
              const canCancel =
                ride.status === "REQUESTED" ||
                ride.status === "MATCHED";

              return (
                <div
                  className="ride-item"
                  key={ride.id}
                >
                  <div>
                    <strong>
                      {ride.pickupLocation}
                      {" ? "}
                      {ride.destination}
                    </strong>

                    <p>
                      Seats: {ride.seats}
                    </p>

                    <p>
                      Estimated fare: ?
                      {ride.estimatedFare}
                    </p>

                    {ride.finalFare !==
                      null && (
                      <p>
                        Final fare: ?
                        {ride.finalFare}
                      </p>
                    )}

                    <span className="status">
                      {ride.status}
                    </span>
                  </div>

                  {canCancel && (
                    <button
                      className="danger-button"
                      onClick={() =>
                        cancelRide(ride.id)
                      }
                      disabled={
                        cancellingRideId ===
                        ride.id
                      }
                    >
                      {cancellingRideId ===
                      ride.id
                        ? "Cancelling..."
                        : "Cancel Ride"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
