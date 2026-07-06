import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import routes from "./routes/index";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./config/logger";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api", routes);

app.use(errorHandler);

export default app;
