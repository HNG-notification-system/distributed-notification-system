import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import config from '../../config/configuration';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  // Use `any` for now to avoid type-mismatch errors
  private conn: any = null;
  private channel: any = null;
  private readonly logger = new Logger(RabbitmqService.name);
  private readonly cfg = config();

  async onModuleInit() {
    try {
      this.logger.log(`Connecting to RabbitMQ at ${this.cfg.rabbit.url} ...`);
      this.conn = await amqp.connect(this.cfg.rabbit.url);
      this.channel = await this.conn.createChannel();

      await this.channel.assertExchange(this.cfg.rabbit.exchange, 'direct', { durable: true });

      // Declare queues (gateway can ensure they exist)
      await this.channel.assertQueue('email.queue', {
        durable: true,
        deadLetterExchange: this.cfg.rabbit.exchange,
        deadLetterRoutingKey: 'failed',
      });
      await this.channel.assertQueue('push.queue', {
        durable: true,
        deadLetterExchange: this.cfg.rabbit.exchange,
        deadLetterRoutingKey: 'failed',
      });
      await this.channel.assertQueue('failed.queue', { durable: true });

      await this.channel.bindQueue('email.queue', this.cfg.rabbit.exchange, 'email');
      await this.channel.bindQueue('push.queue', this.cfg.rabbit.exchange, 'push');
      await this.channel.bindQueue('failed.queue', this.cfg.rabbit.exchange, 'failed');

      this.logger.log('Connected to RabbitMQ and setup exchange/queues');
    } catch (err) {
      this.logger.error('Failed to initialize RabbitMQ connection/channel', err as any);
      // rethrow so Nest knows startup failed (optional)
      throw err;
    }
  }
  async getChannel(): Promise<amqp.Channel> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }



  async publish(routingKey: string, msg: object, options = {}) {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel is not initialized. Cannot publish.');
      throw new Error('RabbitMQ channel not initialized');
    }
    const payload = Buffer.from(JSON.stringify(msg));
    // persistent: true to survive broker restart
    return this.channel.publish(this.cfg.rabbit.exchange, routingKey, payload, { persistent: true, ...options });
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.conn) {
        await this.conn.close();
      }
      this.logger.log('RabbitMQ connection closed');
    } catch (err) {
      this.logger.error('Error closing RabbitMQ resources', err as any);
    }
  }

  isHealthy(): boolean {
    // Basic health check:
    // channel exists and connection is not closed
    try {
      return !!this.channel && !!this.conn;
    } catch {
      return false;
    }
  }
}

