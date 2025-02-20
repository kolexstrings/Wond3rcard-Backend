import path from "path";
import { createLogger, format, transports as winstonTransports } from "winston";
import 'winston-daily-rotate-file';

const { combine, timestamp, json, printf, colorize, errors } = format;
export class LoggerStream {
  write(message: string) {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  }
}
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

  if (stack) {
    logMessage += `\nStack: ${stack}`;
  }

  if (Object.keys(metadata).length) {
    logMessage += ` | Metadata: ${JSON.stringify(metadata)}`;
  }

  return logMessage;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winstonTransports.Console({
      level: 'debug',
      format: combine(
        colorize(),
        logFormat
      ),
    }),
    new winstonTransports.DailyRotateFile({
      filename: path.join(__dirname, 'logs', 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD', // Log files will be named with date (e.g., application-2024-11-11.log)
      zippedArchive: true, // Compress old log files
      maxSize: '20m', // Max size of log files before rotation
      maxFiles: '30d', // Keep 30 days' worth of logs
      level: 'info', // Log info and above to file
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Timestamp for file logs
        json() // Output in JSON format for easier parsing
      ),
    }),

    new winstonTransports.DailyRotateFile({
      filename: path.join(__dirname, 'logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '14d',
      level: 'error',
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        json()
      ),
    }),
  ],
});

export default logger;
