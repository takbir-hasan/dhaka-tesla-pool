import express from "express";
import cors from "cors";
import rideRoutes from "./routes/ride.routes";

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

export default app;