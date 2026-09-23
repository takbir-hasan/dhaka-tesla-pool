import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: "PASSENGER" | "DRIVER";
  };
};

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authorization.substring(7);

  try {
    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}