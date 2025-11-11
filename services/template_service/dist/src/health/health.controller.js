"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let HealthController = class HealthController {
    prisma;
    cacheManager;
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'template-service',
            version: '1.0.0',
        };
    }
    async detailedCheck() {
        const checks = await Promise.allSettled([
            this.checkDatabase(),
            this.checkRedis(),
        ]);
        const [database, redis] = checks.map((result) => result.status === 'fulfilled'
            ? result.value
            : { status: 'down', error: result.reason?.message });
        const isHealthy = database.status === 'up' && redis.status === 'up';
        return {
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            service: 'template-service',
            version: '1.0.0',
            checks: {
                database,
                redis,
            },
        };
    }
    async checkDatabase() {
        try {
            const start = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
            const duration = Date.now() - start;
            return {
                status: 'up',
                response_time: `${duration}ms`,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
    async checkRedis() {
        try {
            const start = Date.now();
            await this.cacheManager.set('health-check', 'ok', 1000);
            const value = await this.cacheManager.get('health-check');
            const duration = Date.now() - start;
            return {
                status: value === 'ok' ? 'up' : 'down',
                response_time: `${duration}ms`,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Basic health check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, swagger_1.ApiOperation)({ summary: 'Detailed health check with dependency status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detailed health information' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "detailedCheck", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], HealthController);
//# sourceMappingURL=health.controller.js.map