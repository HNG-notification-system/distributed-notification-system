import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import config from '../../config/configuration';

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);
  private readonly cfg = config();

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async sendNotification(notification: any) {
    try {
      const channel = await this.rabbitmqService.getChannel();

      // Use your config-based exchange name instead of hardcoded one
      const exchange = this.cfg.rabbit.exchange;

      // Optional: use notification type to decide routing key dynamically
      const routingKey =
        notification.type === 'push' ? 'push' : 'email';

      const message = Buffer.from(JSON.stringify(notification));

      // Publish to the correct exchange
      channel.publish(exchange, routingKey, message, { persistent: true });

      this.logger.log(
        `📤 Sent notification: ${JSON.stringify(notification)}`
      );
    } catch (error) {
      this.logger.error('Failed to send notification', error);
      throw error;
    }
  }

  async publish(notification: any) {
    const exchange = this.cfg.rabbit.exchange;
    const routingKey = notification.type === 'push' ? 'push' : 'email';

    // Attach metadata if needed
    const payload = {
      ...notification,
      publishedAt: new Date().toISOString(),
    };

    await this.rabbitmqService.publish(routingKey, payload, { persistent: true });
    this.logger.log(`📤 Sent notification (routing=${routingKey}): ${JSON.stringify(notification)}`);
  }
}
