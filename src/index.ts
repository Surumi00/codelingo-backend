import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
