import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export type AuthTokenPayload = {
  userId: string;
  role: "PASSENGER" | "DRIVER";
};

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.userId !== "string" ||
    (decoded.role !== "PASSENGER" && decoded.role !== "DRIVER")
  ) {
    throw new Error("Invalid authentication token");
  }

  return {
    userId: decoded.userId,
    role: decoded.role,
  };
}