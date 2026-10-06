import "dotenv/config";
import Pino from "pino";

const { APP_ENV, LOG_LEVEL } = process.env;

const logConf =
  APP_ENV === "development"
    ? {
        level: LOG_LEVEL || "info",
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "SYS:h:MM:ss TT",
          },
        },
      }
    : { level: LOG_LEVEL || "info" };
const logger = Pino(logConf);
export default logger;
