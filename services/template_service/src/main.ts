import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interfaces/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle(process.env.API_TITLE || 'Template Service API')
    .setDescription(
      process.env.API_DESCRIPTION || 'Notification template management service',
    )
    .setVersion(process.env.API_VERSION || '1.0.0')
    .addTag('Templates', 'Template CRUD operations')
    .addTag('Health', 'Service health checks')
    .addTag('Root', 'Service information')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.log(`🚀 Template Service running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`💚 Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap()
  .then(() => {
    console.log('Application started on port', process.env.PORT);
  })
  .catch((e) => {
    console.log(e);
  });
