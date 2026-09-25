"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import { getUser, saveAuth } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();

    if (user) {
      router.replace(
        user.role === "DRIVER"
          ? "/driver"
          : "/dashboard"
      );
    }
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
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
        "/auth/login",
        {
          email,
          password,
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
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Dhaka Tesla Pool</h1>
        <h2>Login</h2>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p>
          Don't have an account?{" "}
          <Link href="/register">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
