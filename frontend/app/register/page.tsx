"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import { saveAuth } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [role, setRole] =
    useState<"PASSENGER" | "DRIVER">(
      "PASSENGER"
    );

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/register",
        {
          name,
          email,
          password,
          role,
        }
      );

      const { token, user } =
        response.data;

      saveAuth(token, user);

      if (user.role === "DRIVER") {
        router.push("/driver");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Dhaka Tesla Pool</h1>
        <h2>Create Account</h2>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            minLength={6}
            required
          />

          <select
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as
                  | "PASSENGER"
                  | "DRIVER"
              )
            }
          >
            <option value="PASSENGER">
              Passenger
            </option>
            <option value="DRIVER">
              Driver
            </option>
          </select>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link href="/login">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
