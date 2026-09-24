export type UserRole = "PASSENGER" | "DRIVER";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function saveAuth(
  token: string,
  user: StoredUser
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem("user");

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
