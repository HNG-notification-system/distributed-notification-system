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
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
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
    const config = new swagger_1.DocumentBuilder()
        .setTitle(process.env.API_TITLE || 'Template Service API')
        .setDescription(process.env.API_DESCRIPTION || 'Notification template management service')
        .setVersion(process.env.API_VERSION || '1.0.0')
        .addTag('Templates', 'Template CRUD operations')
        .addTag('Health', 'Service health checks')
        .addTag('Root', 'Service information')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
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