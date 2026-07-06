import pino from "pino";
import { env } from "./env";

const isDev = env.nodeEnv === "development";

export const logger = pino({
  level: env.logLevel,
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    },
  }),
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.secret"],
    censor: "[REDACTED]",
  },
});
