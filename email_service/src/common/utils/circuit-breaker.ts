import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerState } from '../dto';

@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failure_count: 0,
    last_failure_time: null,
    success_count: 0,
  };

  private threshold: number;
  private timeout: number;
  private resetTimeout: number;
  private name: string;

  constructor(name: string, configService: ConfigService) {
    this.name = name;
    this.threshold = configService.get<number>('CIRCUIT_BREAKER_THRESHOLD', 5);
    this.timeout = configService.get<number>('CIRCUIT_BREAKER_TIMEOUT', 60000);
    this.resetTimeout = configService.get<number>('CIRCUIT_BREAKER_RESET_TIMEOUT', 30000);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.state.last_failure_time || 0);
      
      if (timeSinceLastFailure >= this.resetTimeout) {
        this.logger.log(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
        this.state.state = 'HALF_OPEN';
        this.state.success_count = 0;
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Service unavailable.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.success_count++;
      
      // If enough successes, close the circuit
      if (this.state.success_count >= 3) {
        this.logger.log(`Circuit breaker ${this.name} transitioning to CLOSED`);
        this.state = {
          state: 'CLOSED',
          failure_count: 0,
          last_failure_time: null,
          success_count: 0,
        };
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success
      this.state.failure_count = 0;
    }
  }

  private onFailure(): void {
    this.state.failure_count++;
    this.state.last_failure_time = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      // Immediately open circuit on failure in HALF_OPEN
      this.logger.warn(`Circuit breaker ${this.name} transitioning to OPEN (failed in HALF_OPEN)`);
      this.state.state = 'OPEN';
      this.state.success_count = 0;
    } else if (
      this.state.state === 'CLOSED' &&
      this.state.failure_count >= this.threshold
    ) {
      // Open circuit if threshold exceeded
      this.logger.warn(
        `Circuit breaker ${this.name} transitioning to OPEN (threshold: ${this.threshold})`
      );
      this.state.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  isOpen(): boolean {
    return this.state.state === 'OPEN';
  }

  reset(): void {
    this.logger.log(`Circuit breaker ${this.name} manually reset`);
    this.state = {
      state: 'CLOSED',
      failure_count: 0,
      last_failure_time: null,
      success_count: 0,
    };
  }
}
