import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import authRoutes from "./routes/auth.routes";
import droneRoutes from "./routes/drone.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/drones", droneRoutes);
app.use("/api/orders", require("./routes/orders").default);
app.use("/api/users", require("./routes/users").default);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

export default app;
