import { IsString, IsEmail, IsObject, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';

// Email Notification DTO
export class EmailNotificationDto {
  @IsString()
  notification_id: string;

  @IsString()
  user_id: string;

  @IsString()
  template_id: string;

  @IsEmail()
  to_email: string;

  @IsObject()
  variables: Record<string, any>;

  @IsOptional()
  @IsEnum(['high', 'normal', 'low'])
  priority?: 'high' | 'normal' | 'low';

  @IsOptional()
  @IsNumber()
  retry_count?: number;

  @IsOptional()
  @IsString()
  correlation_id?: string;
}

// Template Interface
export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  language?: string;
  version?: number;
}

// Email Payload
export interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  meta?: PaginationMeta;
}

// Pagination Meta
export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// Circuit Breaker State
export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failure_count: number;
  last_failure_time: number | null;
  success_count: number;
}

// Retry Config
export interface RetryConfig {
  max_attempts: number;
  initial_delay: number;
  max_delay: number;
  multiplier: number;
}

// Email Result
export interface EmailResult {
  success: boolean;
  notification_id: string;
  message_id?: string;
  error?: string;
  retry_count: number;
  delivered_at?: Date;
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  uptime: number;
  checks: {
    rabbitmq: boolean;
    template_service: boolean;
    smtp: boolean;
  };
  version: string;
}

// Queue Stats
export interface QueueStats {
  email_queue: number;
  failed_queue: number;
}
