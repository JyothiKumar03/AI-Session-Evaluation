import express from "express";
import cors from "cors";
import helmet from "helmet";
import { api_router } from "./src/routes/index";
import { error_handler } from "./src/middlewares/error-handler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", api_router);
app.use(error_handler);

export default app;
