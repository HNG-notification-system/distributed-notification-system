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
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-service-key, x-user-role',
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
  const apiDescription =
    process.env.API_DESCRIPTION ||
    `Template Service API for managing notification templates

## 🔐 Authentication
- **Internal Services**: Use \`x-service-key\` header
- **Admin Users**: Use API Gateway headers (\`x-user-role\`, \`x-auth-verified\`, \`x-user-id\`)

## 📋 Role Access
- **Admin**: Full access to all operations
- **Editor**: Can update and view templates  
- **Viewer**: Can view templates only
- **Internal Services**: Can preview templates
`;

  const config = new DocumentBuilder()
    .setTitle(process.env.API_TITLE || 'Template Service API')
    .setDescription(apiDescription)
    .setVersion(process.env.API_VERSION || '1.0.0')
    .addTag(
      'Templates',
      'Template CRUD operations - Role-based access required',
    )
    .addTag('Health', 'Service health checks - No authentication required')
    .addTag('Root', 'Service information - No authentication required')
    .addSecurity('serviceKey', {
      type: 'apiKey',
      in: 'header',
      name: 'x-service-key',
      description: `Internal service key: ${process.env.INTERNAL_SERVICE_KEY ? '***' + process.env.INTERNAL_SERVICE_KEY.slice(-4) : 'Not set'}`,
    })
    .addSecurity('adminAuth', {
      type: 'apiKey',
      in: 'header',
      name: 'x-user-role',
      description: 'Admin access via API Gateway',
    })
    .addSecurityRequirements('serviceKey', [])
    .addSecurityRequirements('adminAuth', [])
    .addServer(
      process.env.API_URL || 'http://localhost:3000',
      process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

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
