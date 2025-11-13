import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');
import { EmailPayload, EmailResult } from '../../common/dto';
import { CircuitBreaker } from '../../common/utils/circuit-breaker';
import axios from 'axios';
import FormData = require('form-data');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private provider: 'smtp' | 'sendgrid' | 'mailgun' = 'smtp';
  private smtpCircuitBreaker: CircuitBreaker;

  constructor(private configService: ConfigService) {
    this.smtpCircuitBreaker = new CircuitBreaker('SMTP', configService);
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const sendgridKey = this.configService.get<string>('SENDGRID_API_KEY');
    const mailgunKey = this.configService.get<string>('MAILGUN_API_KEY');
    if (sendgridKey) {
      this.provider = 'sendgrid';
      this.logger.log('Initialized SendGrid email provider');
    } else if (mailgunKey) {
      this.provider = 'mailgun';
      this.logger.log('Initialized Mailgun email provider');
    } else {
      this.provider = 'smtp';
      const smtpPort = parseInt(this.configService.get('SMTP_PORT', '587'), 10);
      if (isNaN(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
        throw new Error(`Invalid SMTP_PORT: must be a number between 1 and 65535`);
      }

      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: this.configService.get<string>('SMTP_USER', ''),
          pass: this.configService.get<string>('SMTP_PASSWORD', ''),
        },
        tls: {
          // Only reject invalid certs in production; allow self-signed in development if needed
          rejectUnauthorized: this.configService.get('NODE_ENV') === 'production',
        },
        // Force STARTTLS for port 587
        requireTLS: smtpPort === 587,
      } as SMTPTransport.Options);
      this.logger.log('Initialized SMTP email provider');
      this.logger.log('Initialized SMTP email provider');
    }
  }

  async sendEmail(
    payload: EmailPayload,
    notificationId: string,
    correlationId?: string,
    retryCount: number = 0,
  ): Promise<EmailResult> {
    try {
      const result = await this.smtpCircuitBreaker.execute(async () => {
        this.logger.log(`Sending email to ${payload.to}`, {
          notification_id: notificationId,
          correlation_id: correlationId,
          provider: this.provider,
        });

        let messageId: string;

        switch (this.provider) {
          case 'smtp':
            messageId = await this.sendViaSMTP(payload);
            break;
          case 'sendgrid':
            messageId = await this.sendViaSendGrid(payload);
            break;
          case 'mailgun':
            messageId = await this.sendViaMailgun(payload);
            break;
          default:
            throw new Error(`Unknown email provider: ${this.provider}`);
        }

        this.logger.log(`Email sent successfully to ${payload.to}`, {
          notification_id: notificationId,
          correlation_id: correlationId,
          message_id: messageId,
        });

        return {
          success: true,
          notification_id: notificationId,
          message_id: messageId,
          retry_count: retryCount,
          delivered_at: new Date(),
        };
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${payload.to}`, {
        notification_id: notificationId,
        correlation_id: correlationId,
        error: error.message,
      });

      return {
        success: false,
        notification_id: notificationId,
        error: error.message,
        retry_count: retryCount,
      };
    }
  }

  private async sendViaSMTP(payload: EmailPayload): Promise<string> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const fromEmail = this.configService.get<string>('FROM_EMAIL');
    const fromName = this.configService.get<string>('FROM_NAME');

    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return info.messageId;
  }

  private async sendViaSendGrid(payload: EmailPayload): Promise<string> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY', '');
    const fromEmail = this.configService.get<string>('FROM_EMAIL', 'noreply@yourapp.com');
    const fromName = this.configService.get<string>('FROM_NAME', 'YourApp');

    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: payload.to }],
            subject: payload.subject,
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        content: [
          {
            type: 'text/html',
            value: payload.html,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.headers['x-message-id'] || 'sendgrid-' + Date.now();
  }

  private async sendViaMailgun(payload: EmailPayload): Promise<string> {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY', '');
    const domain = this.configService.get<string>('MAILGUN_DOMAIN', '');
    const fromEmail = this.configService.get<string>('FROM_EMAIL', 'noreply@yourapp.com');
    const fromName = this.configService.get<string>('FROM_NAME', 'YourApp');

    const form = new FormData();
    form.append('from', `${fromName} <${fromEmail}>`);
    form.append('to', payload.to);
    form.append('subject', payload.subject);
    form.append('html', payload.html);
    if (payload.text) {
      form.append('text', payload.text);
    }

    const response = await axios.post(`https://api.mailgun.net/v3/${domain}/messages`, form, {
      auth: {
        username: 'api',
        password: apiKey || '',
      },
      headers: form.getHeaders(),
    });

    return response.data.id;
  }

  async verifyConnection(): Promise<boolean> {
    if (this.provider !== 'smtp' || !this.transporter) {
      return true;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error: any) {
      this.logger.error('SMTP connection verification failed', {
        error: error.message,
      });
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.provider === 'smtp') {
        return await this.verifyConnection();
      }
      return true;
    } catch {
      return false;
    }
  }

  getProviderInfo(): { provider: string; configured: boolean } {
    return {
      provider: this.provider,
      configured:
        this.transporter !== null ||
        !!this.configService.get('SENDGRID_API_KEY') ||
        !!this.configService.get('MAILGUN_API_KEY'),
    };
  }

  getCircuitBreakerState() {
    return this.smtpCircuitBreaker.getState();
  }
}
