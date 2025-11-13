// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { NotificationProducer } from './notification.producer';
import { RedisService } from '../infra/redis.service';
import { UserServiceClient } from '../users/user.service.client';
import { User } from '../users/user.types';
import config from '../../config/configuration';

@Injectable()
export class NotificationsService {
  private readonly cfg = config();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly producer: NotificationProducer,
    private readonly redis: RedisService,
    private readonly userClient: UserServiceClient,
  ) {}

  async enqueueNotification(dto: any) {
    // 1) Fetch user info (from cache or user service)
    const data: any = await this.userClient.getUser(dto.userId);
    const user: User | null = data?.data;
    if (!user) {
      this.logger.warn(`User not found: ${dto.userId}`);
      await this.redis.setStatus(dto.id, 'failed:user_not_found');
      return { enqueued: false, reason: 'user_not_found' };
    }
    // 2) Check user preferences and decide whether to enqueue
    // tolerate both legacy and new pref names
    const prefs = (user.preferences ?? {}) as Record<string, any>;

    // treat explicit false as opt-out
    if (
      dto.type === 'email' &&
      (prefs.emailNotifications === false || prefs.email === false)
    ) {
      await this.redis.setStatus(dto.id, 'skipped:user_opt_out');
      return { enqueued: false, reason: 'user_opt_out' };
    }
    if (
      dto.type === 'push' &&
      (prefs.pushNotifications === false || prefs.push === false)
    ) {
      await this.redis.setStatus(dto.id, 'skipped:user_opt_out');
      return { enqueued: false, reason: 'user_opt_out' };
    }

    // 3) Idempotency: ensure we only process once
    const claimed = await this.redis.claimRequest(
      `idempotency:${dto.id}`,
      this.cfg.idempotencyTTL,
    );
    if (!claimed) {
      this.logger.log(`Duplicate or already processing: ${dto.id}`);
      return { enqueued: false, reason: 'duplicate' };
    }

    // 4) Enrich dto with direct contact info for consumers
    dto.variables = dto.variables || {};
    const pushToken = user.pushToken || user.devices?.[0]?.token || null;

    dto.variables.__user = {
      id: user.id,
      email: user.email,
      pushToken,
    };

    // 5) Handle scheduled notifications
    if (dto.scheduledAt) {
      const when = Date.parse(dto.scheduledAt);
      if (!isNaN(when) && when > Date.now()) {
        // For now: mark as scheduled and leave to scheduler (not implemented)
        await this.redis.setStatus(dto.id, 'scheduled');
        this.logger.log(
          `Notification scheduled for ${dto.scheduledAt} (id=${dto.id})`,
        );
        return { enqueued: true, scheduled: true };
      }
    }

    // 6) Set initial status, publish via producer
    await this.redis.setStatus(dto.id, 'queued');
    await this.producer.publish(dto);

    return { enqueued: true };
  }

  async getStatus(id: string) {
    return this.redis.getStatus(id);
  }
}
