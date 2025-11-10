import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckResponse, ApiResponse } from '../../common/dto';
import { QueueService } from '../queue/queue.service';
import { EmailService } from '../email/email.service';
import { TemplateService } from '../template/template.service';

@Controller()
export class HealthController {
  constructor(
    private configService: ConfigService,
    private queueService: QueueService,
    private emailService: EmailService,
    private templateService: TemplateService,
  ) {}

  @Get('/health')
  async health(): Promise<ApiResponse<HealthCheckResponse>> {
    try {
      // Check all service dependencies
      const [rabbitmqHealthy, templateServiceHealthy, smtpHealthy] =
        await Promise.all([
          Promise.resolve(this.queueService.isHealthy()),
          this.templateService.healthCheck().catch(() => false),
          this.emailService.healthCheck().catch(() => false),
        ]);

      const allHealthy =
        rabbitmqHealthy && templateServiceHealthy && smtpHealthy;

      const response: HealthCheckResponse = {
        status: allHealthy ? 'healthy' : 'unhealthy',
        service: this.configService.get<string>('SERVICE_NAME'),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          rabbitmq: rabbitmqHealthy,
          template_service: templateServiceHealthy,
          smtp: smtpHealthy,
        },
        version: '1.0.0',
      };

      return {
        success: allHealthy,
        data: response,
        message: allHealthy ? 'Service is healthy' : 'Service is unhealthy',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Health check failed',
      };
    }
  }

  @Get('/status')
  async status(): Promise<ApiResponse> {
    try {
      const queueStats = await this.queueService.getQueueStats();
      const emailProvider = this.emailService.getProviderInfo();

      return {
        success: true,
        data: {
          service: this.configService.get<string>('SERVICE_NAME'),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          queue_stats: queueStats,
          email_provider: emailProvider,
          circuit_breakers: {
            smtp: this.emailService.getCircuitBreakerState(),
            template_service: this.templateService.getCircuitBreakerState(),
          },
        },
        message: 'Status retrieved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get status',
      };
    }
  }

  @Get('/ready')
  readiness(): ApiResponse {
    const ready = this.queueService.isHealthy();

    return {
      success: ready,
      message: ready ? 'Service is ready' : 'Service is not ready',
    };
  }

  @Get('/live')
  liveness(): ApiResponse {
    return {
      success: true,
      message: 'Service is alive',
    };
  }

  @Get('/')
  root(): ApiResponse {
    return {
      success: true,
      data: {
        service: this.configService.get<string>('SERVICE_NAME'),
        version: '1.0.0',
        status: 'running',
      },
      message: 'Email Service is running',
    };
  }
}
