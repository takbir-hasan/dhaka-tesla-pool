import express from "express";
import cors from "cors";
import rideRoutes from "./routes/ride.routes";
import authRoutes from "./routes/auth.routes";
import driverRoutes from "./routes/driver.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "dhaka-tesla-pool-api",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/driver", driverRoutes);

app.use(errorHandler);

export default app;
