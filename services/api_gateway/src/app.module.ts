import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RabbitmqService } from './modules/rabbitmq/rabbitmq.service';
import { RedisService } from './modules/infra/redis.service';
import { HealthController } from './modules/health/health.controller';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot(), // no ttl/limit here in v6
    NotificationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    RabbitmqService,
    RedisService,
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // global throttler guard
  ],
  exports: [RabbitmqService, RedisService],
})
export class AppModule {}
