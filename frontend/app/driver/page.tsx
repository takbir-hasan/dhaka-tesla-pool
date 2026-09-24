"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import {
  clearAuth,
  getUser,
} from "../../lib/auth";
import {
  Pool,
  Vehicle,
  Ride,
} from "../../types";

type DriverRide = Ride & {
  passenger?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function DriverPage() {
  const router = useRouter();

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);

  const [pools, setPools] =
    useState<Pool[]>([]);

  const [requestedRides, setRequestedRides] =
    useState<DriverRide[]>([]);

  const [vehicleName, setVehicleName] =
    useState("");

  const [capacity, setCapacity] =
    useState(4);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [busyRideId, setBusyRideId] =
    useState<string | null>(null);

  const [busyPoolId, setBusyPoolId] =
    useState<string | null>(null);

const [user, setUser] =
  useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    const currentUser = getUser();

  if (!currentUser) {
    router.push("/login");
    return;
  }

  setUser(currentUser);

    if (currentUser.role !== "DRIVER") {
      router.push("/dashboard");
      return;
    }

    loadDriverData();
  }, []);

  async function loadDriverData() {
    setError("");

    try {
      const [
        vehicleResponse,
        poolsResponse,
        ridesResponse,
      ] = await Promise.all([
        api.get("/drivers/vehicle"),
        api.get("/drivers/pools"),
        api.get("/drivers/rides/requests"),
      ]);

      setVehicle(
        vehicleResponse.data.vehicle ||
          null
      );

      setPools(
        poolsResponse.data.pools ||
          []
      );

      setRequestedRides(
        ridesResponse.data.rides ||
          ridesResponse.data.rideRequests ||
          []
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to load driver data"
      );
    }
  }

  async function createVehicle(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response =
        await api.post(
          "/drivers/vehicle",
          {
            name: vehicleName,
            capacity: Number(capacity),
          }
        );

      setVehicle(
        response.data.vehicle
      );

      setVehicleName("");
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to create vehicle"
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateVehicle(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!vehicle) return;

    setError("");
    setLoading(true);

    try {
      const response =
        await api.patch(
          "/drivers/vehicle",
          {
            name: vehicle.name,
            capacity: vehicle.capacity,
          }
        );

      setVehicle(
        response.data.vehicle ||
          vehicle
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to update vehicle"
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleOnline() {
    if (!vehicle) return;

    setError("");

    try {
      const response =
        await api.patch(
          "/drivers/vehicle/status",
          {
            isOnline:
              !vehicle.isOnline,
          }
        );

      setVehicle(
        response.data.vehicle
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to update vehicle status"
      );
    }
  }

  async function createPool() {
    if (!vehicle) {
      setError(
        "Create a vehicle first"
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post(
        "/drivers/pools",
        {
          vehicleId: vehicle.id,
          totalSeats: vehicle.capacity,
        }
      );

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to create pool"
      );
    } finally {
      setLoading(false);
    }
  }

  async function autoMatch(
    rideId: string
  ) {
    setError("");
    setBusyRideId(rideId);

    try {
      await api.post(
        `/drivers/rides/${rideId}/auto-match`
      );

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to match ride"
      );
    } finally {
      setBusyRideId(null);
    }
  }

  async function updateRideStatus(
    rideId: string,
    status: string
  ) {
    setError("");
    setBusyRideId(rideId);

    try {
      await api.patch(
        `/drivers/rides/${rideId}/status`,
        {
          status,
        }
      );

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to update ride status"
      );
    } finally {
      setBusyRideId(null);
    }
  }

  async function addRideToPool(
    poolId: string,
    rideId: string
  ) {
    setError("");
    setBusyPoolId(poolId);

    try {
      await api.post(
        `/drivers/pools/${poolId}/members`,
        {
          rideRequestId: rideId,
        }
      );

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to add ride to pool"
      );
    } finally {
      setBusyPoolId(null);
    }
  }

  async function completePool(
    poolId: string
  ) {
    setError("");
    setBusyPoolId(poolId);

    try {
      await api.patch(
        `/drivers/pools/${poolId}/complete`
      );

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to complete pool"
      );
    } finally {
      setBusyPoolId(null);
    }
  }

  async function cancelPool(
    poolId: string
  ) {
    setError("");
    setBusyPoolId(poolId);

    try {
      await api.patch(
        `/drivers/pools/${poolId}/cancel`
      );

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to cancel pool"
      );
    } finally {
      setBusyPoolId(null);
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
          <h1>Driver Dashboard</h1>

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

      {!vehicle ? (
        <section className="card">
          <h2>Create Vehicle</h2>

          <form onSubmit={createVehicle}>
            <input
              type="text"
              placeholder="Vehicle name"
              value={vehicleName}
              onChange={(event) =>
                setVehicleName(
                  event.target.value
                )
              }
              required
            />

            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(event) =>
                setCapacity(
                  Number(
                    event.target.value
                  )
                )
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Vehicle"}
            </button>
          </form>
        </section>
      ) : (
        <section className="card">
          <h2>My Vehicle</h2>

          <form onSubmit={updateVehicle}>
            <input
              type="text"
              value={vehicle.name}
              onChange={(event) =>
                setVehicle({
                  ...vehicle,
                  name: event.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="1"
              value={vehicle.capacity}
              onChange={(event) =>
                setVehicle({
                  ...vehicle,
                  capacity: Number(
                    event.target.value
                  ),
                })
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              Update Vehicle
            </button>
          </form>

          <p>
            Status:{" "}
            <strong>
              {vehicle.isOnline
                ? "Online"
                : "Offline"}
            </strong>
          </p>

          <div className="button-row">
            <button
              onClick={toggleOnline}
            >
              {vehicle.isOnline
                ? "Go Offline"
                : "Go Online"}
            </button>

            {vehicle.isOnline && (
              <button
                className="secondary-button"
                onClick={createPool}
                disabled={loading}
              >
                Create Pool
              </button>
            )}
          </div>
        </section>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Ride Requests</h2>
            <p>
              Passenger requests available
              to you.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadDriverData}
          >
            Refresh
          </button>
        </div>

        {requestedRides.length === 0 ? (
          <p>
            No pending ride requests.
          </p>
        ) : (
          <div className="ride-list">
            {requestedRides.map(
              (ride) => (
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

                    <span className="status">
                      {ride.status}
                    </span>
                  </div>

                  <div className="button-column">
                    <button
                      onClick={() =>
                        autoMatch(
                          ride.id
                        )
                      }
                      disabled={
                        busyRideId ===
                        ride.id
                      }
                    >
                      {busyRideId ===
                      ride.id
                        ? "Matching..."
                        : "Auto Match"}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="card">
        <h2>My Pools</h2>

        {pools.length === 0 ? (
          <p>
            No pools created yet.
          </p>
        ) : (
          <div className="ride-list">
            {pools.map((pool) => (
              <div
                className="ride-item pool-item"
                key={pool.id}
              >
                <div>
                  <strong>
                    Pool
                  </strong>

                  <p>
                    Seats:{" "}
                    {pool.occupiedSeats}
                    /
                    {pool.totalSeats}
                  </p>

                  <p>
                    Status:{" "}
                    {pool.status}
                  </p>

                  <span className="status">
                    {pool.vehicle?.name ||
                      "Vehicle"}
                  </span>
                </div>

                <div className="button-column">
                  {pool.status ===
                    "OPEN" && (
                    <>
                      {requestedRides.map(
                        (ride) => (
                          <button
                            key={ride.id}
                            className="secondary-button"
                            onClick={() =>
                              addRideToPool(
                                pool.id,
                                ride.id
                              )
                            }
                            disabled={
                              busyPoolId ===
                              pool.id
                            }
                          >
                            Add{" "}
                            {ride.pickupLocation}
                            {" ? "}
                            {ride.destination}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          completePool(
                            pool.id
                          )
                        }
                        disabled={
                          busyPoolId ===
                          pool.id
                        }
                      >
                        Complete Pool
                      </button>

                      <button
                        className="danger-button"
                        onClick={() =>
                          cancelPool(
                            pool.id
                          )
                        }
                        disabled={
                          busyPoolId ===
                          pool.id
                        }
                      >
                        Cancel Pool
                      </button>
                    </>
                  )}

                  {pool.status ===
                    "IN_PROGRESS" && (
                    <button
                      onClick={() =>
                        completePool(
                          pool.id
                        )
                      }
                      disabled={
                        busyPoolId ===
                        pool.id
                      }
                    >
                      Complete Pool
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
