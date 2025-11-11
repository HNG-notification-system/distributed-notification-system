import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'template-service',
      version: '1.0.0',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependency status' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedCheck() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const [database, redis] = checks.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { status: 'down', error: result.reason?.message },
    );

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

  private async checkDatabase() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      return {
        status: 'up',
        response_time: `${duration}ms`,
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  private async checkRedis() {
    try {
      const start = Date.now();
      await this.cacheManager.set('health-check', 'ok', 1000);
      const value = await this.cacheManager.get('health-check');
      const duration = Date.now() - start;

      return {
        status: value === 'ok' ? 'up' : 'down',
        response_time: `${duration}ms`,
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }
}
