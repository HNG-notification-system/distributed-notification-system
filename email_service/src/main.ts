import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { createLogger } from './common/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: createLogger(),
  });

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3002);
  const serviceName = configService.get<string>('SERVICE_NAME', 'email-service');

  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🚀  Email Service Started Successfully                   ║
║                                                           ║
║  📦  Service: ${serviceName.padEnd(43)}║
║  🌐  Port: ${String(port).padEnd(48)}║
║  📝  Environment: ${configService.get<string>('NODE_ENV', 'development').padEnd(40)}║
║                                                           ║
║  Health Check: http://localhost:${port}/health${' '.repeat(19)}║
║  Status: http://localhost:${port}/status${' '.repeat(23)}║
║  Ready: http://localhost:${port}/ready${' '.repeat(24)}║
║  Live: http://localhost:${port}/live${' '.repeat(25)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
