import { Controller, Get } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../infra/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly rabbit: RabbitmqService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async health() {
    const rabbitOk = this.rabbit.isHealthy();
    let redisOk = 'down';
    try {
      const pong = await this.redis.ping();
      redisOk = pong === 'PONG' ? 'ok' : 'down';
    } catch (err) {
      redisOk = 'down';
    }

    return { rabbit: rabbitOk ? 'ok' : 'down', redis: redisOk };
  }
}