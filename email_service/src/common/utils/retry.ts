import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryConfig } from '../dto';

@Injectable()
export class RetryHandler {
  private readonly logger = new Logger(RetryHandler.name);
  private config: RetryConfig;

  constructor(configService: ConfigService) {
    this.config = {
      max_attempts: configService.get<number>('MAX_RETRY_ATTEMPTS', 3),
      initial_delay: configService.get<number>('INITIAL_RETRY_DELAY', 1000),
      max_delay: configService.get<number>('MAX_RETRY_DELAY', 60000),
      multiplier: configService.get<number>('RETRY_MULTIPLIER', 2),
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    context?: { notification_id?: string; correlation_id?: string }
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.max_attempts) {
      try {
        attempt++;
        
        if (attempt > 1) {
          this.logger.log(
            `Retry attempt ${attempt}/${this.config.max_attempts}`,
            context
          );
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        this.logger.warn(
          `Attempt ${attempt} failed: ${lastError.message}`,
          context
        );

        // Don't retry if it's the last attempt
        if (attempt >= this.config.max_attempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);
        
        this.logger.log(
          `Waiting ${delay}ms before retry...`,
          context
        );

        await this.sleep(delay);
      }
    }

    // All attempts failed
    this.logger.error(
      `All ${this.config.max_attempts} retry attempts failed`,
      { ...context, error: lastError?.message }
    );

    throw lastError || new Error('All retry attempts failed');
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: initial_delay * (multiplier ^ (attempt - 1))
    const exponentialDelay = this.config.initial_delay * Math.pow(
      this.config.multiplier,
      attempt - 1
    );

    // Cap at max_delay
    const cappedDelay = Math.min(exponentialDelay, this.config.max_delay);

    // Add jitter (±20%) to prevent thundering herd
    const jitter = cappedDelay * 0.2 * (Math.random() - 0.5);
    
    return Math.floor(cappedDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static isRetryable(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP 5xx errors (server errors)
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }

    // Rate limiting
    if (error.response?.status === 429) {
      return true;
    }

    // SMTP temporary errors
    if (error.responseCode >= 400 && error.responseCode < 500) {
      return true;
    }

    return false;
  }
}
