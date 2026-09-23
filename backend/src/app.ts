import express from "express";
import cors from "cors";
import rideRoutes from "./routes/ride.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "dhaka-tesla-pool-api",
  });
});


app.use("/api/rides", rideRoutes);
app.use("/api/auth", authRoutes);

export default app;
