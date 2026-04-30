import "dotenv/config";
import Pino from "pino";

const { APP_ENV } = process.env;

const logConf =
  APP_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "SYS:h:MM:ss TT",
          },
        },
      }
    : {};
const logger = Pino(logConf);
export default logger;
