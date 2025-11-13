import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { EmailNotificationDto, EmailPayload } from '../../common/dto';
import { EmailService } from '../email/email.service';
import { TemplateService } from '../template/template.service';
import { RetryHandler } from '../../common/utils/retry';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private retryHandler: RetryHandler;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService,
    private templateService: TemplateService,
  ) {
    this.retryHandler = new RetryHandler(configService);
  }

  async onModuleInit() {
    await this.connect();
    await this.startConsuming();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect(): Promise<void> {
    // Provide defaults so values are never undefined at runtime or compile-time
    const rabbitmqUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672',
    );
    const emailQueue = this.configService.get<string>('EMAIL_QUEUE', 'email.queue');
    const failedQueue = this.configService.get<string>('FAILED_QUEUE', 'failed.queue');
    const prefetchCount = parseInt(this.configService.get('PREFETCH_COUNT', '10'), 10);
    // Sanitize URL for logs to avoid leaking credentials
    try {
      const parsed = new URL(rabbitmqUrl);
      const safeUrl = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${parsed.pathname || ''}`;
      this.logger.log('Connecting to RabbitMQ...', { url: safeUrl });
    } catch (err) {
      // Fallback: log only hostname if parsing fails
      this.logger.log('Connecting to RabbitMQ...', {
        url: rabbitmqUrl.split('@').pop() || 'rabbitmq',
      });
    }

    this.connection = amqp.connect([rabbitmqUrl]);

    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ successfully');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.error('Disconnected from RabbitMQ', err);
    });

    this.channelWrapper = this.connection.createChannel({
      json: false,
      setup: async (channel: any) => {
        // Use the previously-read values with defaults
        // Set prefetch count
        await channel.prefetch(prefetchCount);

        // Assert queues
        await channel.assertQueue(emailQueue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'notifications.direct', // ❌ Remove this
            'x-dead-letter-routing-key': 'failed',
          },
        });
        await channel.assertQueue(failedQueue, {
          durable: true,
        });

        this.logger.log('RabbitMQ queues asserted', {
          email_queue: emailQueue,
          failed_queue: failedQueue,
          prefetch: prefetchCount,
        });
      },
    });

    await this.channelWrapper.waitForConnect();
  }

  private async startConsuming(): Promise<void> {
    const emailQueue = this.configService.get<string>('EMAIL_QUEUE', 'email.queue');

    this.logger.log('Starting to consume messages from email queue...');

    await this.channelWrapper.addSetup((channel: any) => {
      return channel.consume(
        emailQueue,
        async (msg: ConsumeMessage | null) => {
          if (msg) {
            await this.processMessage(msg, channel);
          }
        },
        { noAck: false },
      );
    });

    this.logger.log('Email queue consumer started successfully');
  }

  private async processMessage(msg: ConsumeMessage, channel: any): Promise<void> {
    const startTime = Date.now();
    let notification: EmailNotificationDto | null = null;
    
    try {
      // Parse message
      const content = msg.content.toString();
      notification = JSON.parse(content) as EmailNotificationDto;
      console.log(notification)
      const retryCount = notification.retry_count || 0;

      this.logger.log('Processing email notification', {
        notification_id: notification.notification_id,
        user_id: notification.user_id,
        template_id: notification.template_id,
        retry_count: retryCount,
        correlation_id: notification.correlation_id,
      });

      // Process with retry logic
      await this.retryHandler.execute(
        async () => {
          if (!notification) throw new Error('Notification is null');

          // Fetch template
          const template = await this.templateService.getTemplate(
            notification.template_id,
            notification.correlation_id,
          );

          // Render template with variables
          const { subject, body } = this.templateService.renderTemplate(
            template,
            notification.variables,
          );

          // Prepare email payload
          const fromEmail = this.configService.get<string>('FROM_EMAIL');
          if (!fromEmail) {
            throw new Error('FROM_EMAIL is required but not configured');
          }
          const emailPayload: EmailPayload = {
            to: notification.variables.__user.email,
            from: fromEmail,
            subject,
            html: body,
          };

          // Send email
          const result = await this.emailService.sendEmail(
            emailPayload,
            notification.notification_id,
            notification.correlation_id,
            retryCount,
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to send email');
          }

          return result;
        },
        {
          notification_id: notification.notification_id,
          correlation_id: notification.correlation_id,
        },
      );

      // Success - acknowledge message
      channel.ack(msg);

      const duration = Date.now() - startTime;
      this.logger.log('Email notification processed successfully', {
        notification_id: notification.notification_id,
        duration_ms: duration,
        correlation_id: notification.correlation_id,
      });
    } catch (error: any) {
      this.logger.error('Failed to process email notification', {
        notification_id: notification?.notification_id,
        error: error.message,
        correlation_id: notification?.correlation_id,
      });

      // Move to failed queue
      await this.moveToFailedQueue(msg, error.message);

      // Acknowledge original message to remove from queue
      channel.ack(msg);
    }
  }

  private async moveToFailedQueue(msg: ConsumeMessage, errorMessage: string): Promise<void> {
    try {
      const content = msg.content.toString();
      const notification = JSON.parse(content) as EmailNotificationDto;

      const failedMessage = {
        ...notification,
        error: errorMessage,
        failed_at: new Date().toISOString(),
        original_queue: this.configService.get<string>('EMAIL_QUEUE'),
      };

      const failedQueue = this.configService.get<string>('FAILED_QUEUE');
      if (!failedQueue) {
        throw new Error('FAILED_QUEUE is required but not configured');
      }
      await this.channelWrapper.sendToQueue(
        failedQueue,
        Buffer.from(JSON.stringify(failedMessage)),
        { persistent: true },
      );

      this.logger.log('Message moved to failed queue', {
        notification_id: notification.notification_id,
        error: errorMessage,
      });
    } catch (error: any) {
      this.logger.error('Failed to move message to failed queue', {
        error: error.message,
      });
    }
  }

  private async close(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error: any) {
      this.logger.error('Error closing RabbitMQ connection', {
        error: error.message,
      });
    }
  }

  isHealthy(): boolean {
    return this.connection?.isConnected() || false;
  }

  async getQueueStats(): Promise<{
    email_queue: number;
    failed_queue: number;
  } | null> {
    try {
      const emailQueue = this.configService.get<string>('EMAIL_QUEUE', 'email.queue');
      const failedQueue = this.configService.get<string>('FAILED_QUEUE', 'failed.queue');

      const emailQueueInfo = await this.channelWrapper.checkQueue(emailQueue);
      const failedQueueInfo = await this.channelWrapper.checkQueue(failedQueue);

      return {
        email_queue: emailQueueInfo.messageCount,
        failed_queue: failedQueueInfo.messageCount,
      };
    } catch {
      return null;
    }
  }
}
