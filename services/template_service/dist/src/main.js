"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const transform_interceptor_1 = require("./common/interfaces/transform.interceptor");
const http_exception_filters_1 = require("./common/filters/http-exception.filters");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, x-service-key, x-user-role',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.useGlobalFilters(new http_exception_filters_1.HttpExceptionFilter());
    const apiDescription = process.env.API_DESCRIPTION ||
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
    const config = new swagger_1.DocumentBuilder()
        .setTitle(process.env.API_TITLE || 'Template Service API')
        .setDescription(apiDescription)
        .setVersion(process.env.API_VERSION || '1.0.0')
        .addTag('Templates', 'Template CRUD operations - Role-based access required')
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
        .addServer(process.env.API_URL || 'http://localhost:3000', process.env.NODE_ENV === 'production' ? 'Production' : 'Development')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
//# sourceMappingURL=main.js.map