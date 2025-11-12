import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationProducer } from './notification.producer';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../infra/redis.service';
import { UserServiceClient } from '../users/user.service.client';

@Module({
  imports: [
    HttpModule.register({ timeout: 5000 }), // for calling User Service
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationProducer,
    RabbitmqService,
    RedisService,
    UserServiceClient,
  ],
  exports: [NotificationsService, NotificationProducer],
})
export class NotificationsModule {}
