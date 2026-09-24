import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["PASSENGER", "DRIVER"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function requireString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

export function requirePositiveInteger(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive integer`
    );
  }

  return value;
}

export function requirePositiveNumber(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive number`
    );
  }

  return value;
}

export function requireBoolean(
  value: unknown,
  fieldName: string
): boolean {
  if (typeof value !== "boolean") {
    throw new Error(
      `${fieldName} must be a boolean`
    );
  }

  return value;
}
