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

  const baseUrl = `http://localhost:${port}`;
  const healthUrl = `${baseUrl}/health`;
  const statusUrl = `${baseUrl}/status`;
  const readyUrl = `${baseUrl}/ready`;
  const liveUrl = `${baseUrl}/live`;

  // Choose a consistent column width for the URL column so banner stays aligned
  const urlColumnWidth = 48;

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🚀  Email Service Started Successfully                   ║
║                                                           ║
║  📦  Service: ${serviceName.padEnd(43)}║
║  🌐  Port: ${String(port).padEnd(48)}║
║  📝  Environment: ${configService.get<string>('NODE_ENV', 'development').padEnd(40)}║
║                                                           ║
║  Health Check: ${healthUrl.padEnd(urlColumnWidth)}║
║  Status:       ${statusUrl.padEnd(urlColumnWidth)}║
║  Ready:        ${readyUrl.padEnd(urlColumnWidth)}║
║  Live:         ${liveUrl.padEnd(urlColumnWidth)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
