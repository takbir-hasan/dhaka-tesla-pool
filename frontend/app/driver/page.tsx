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
} from "../../types";

export default function DriverPage() {
  const router = useRouter();

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);

  const [pools, setPools] =
    useState<Pool[]>([]);

  const [vehicleName, setVehicleName] =
    useState("");

  const [capacity, setCapacity] =
    useState(4);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const user = getUser();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "DRIVER") {
      router.push("/dashboard");
      return;
    }

    loadDriverData();
  }, []);

  async function loadDriverData() {
    try {
      const [
        vehicleResponse,
        poolsResponse,
      ] = await Promise.all([
        api.get("/drivers/vehicle"),
        api.get("/drivers/pools"),
      ]);

      setVehicle(
        vehicleResponse.data.vehicle ||
          null
      );

      setPools(
        poolsResponse.data.pools || []
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
      const response = await api.post(
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

  async function toggleOnline() {
    if (!vehicle) return;

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
          "Unable to update vehicle"
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

    try {
      await api.post("/drivers/pools", {
        vehicleId: vehicle.id,
        totalSeats: vehicle.capacity,
      });

      await loadDriverData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to create pool"
      );
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

          <p>
            <strong>
              {vehicle.name}
            </strong>
          </p>

          <p>
            Capacity:{" "}
            {vehicle.capacity}
          </p>

          <p>
            Status:{" "}
            {vehicle.isOnline
              ? "Online"
              : "Offline"}
          </p>

          <button
            onClick={toggleOnline}
          >
            {vehicle.isOnline
              ? "Go Offline"
              : "Go Online"}
          </button>

          {vehicle.isOnline && (
            <button
              onClick={createPool}
              className="secondary-button"
            >
              Create Pool
            </button>
          )}
        </section>
      )}

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
                className="ride-item"
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

                  <span className="status">
                    {pool.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
