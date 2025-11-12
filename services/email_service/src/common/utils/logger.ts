import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const createLogger = (logLevel: string = 'info', serviceName: string = 'email-service') => {
  return WinstonModule.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike(serviceName, {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
      // Error log file
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Combined log file
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
};
