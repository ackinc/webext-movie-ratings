import "dotenv/config";
import Pino from "pino";

const { LOG_LEVEL } = process.env;

const logger = Pino({ level: LOG_LEVEL || "info" });
export default logger;
