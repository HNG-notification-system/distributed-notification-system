// src/modules/users/user.service.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, of } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../infra/redis.service';
import { User } from './user.types';

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly cacheTTL = 300; // 5 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) { }

  private userCacheKey(userId: string) {
    return `usercache:${userId}`;
  }

  private get baseUrl(): string | undefined {
    return this.configService.get<string>('userService.url') || process.env.USER_SERVICE_URL;
  }

  async getUser(userId: string): Promise<User | null> {
    const key = this.userCacheKey(userId);

    // Try Redis cache first
    try {
      const cached = await this.redis.getKey(key);
      if (cached) return JSON.parse(cached) as User;
    } catch (err: any) {
      this.logger.warn('Redis read failed', err.message);
    }

    // Fallback to HTTP call
    if (!this.baseUrl) {
      this.logger.error('User Service URL is not configured');
      return null;
    }

    try {
      const resp$ = this.httpService
        .get(`${this.baseUrl}/users/${userId}`)
        .pipe(
          timeout(5000),
          retry(2),
          catchError((err) => {
            this.logger.error(`HTTP request failed`, err.message);
            return of({ data: null });
          }),
        );

      const resp = await firstValueFrom(resp$);
      const user = resp.data as User | null;

      if (user) {
        try {
          await this.redis.setKey(key, JSON.stringify(user), this.cacheTTL);
        } catch (err: any) {
          this.logger.warn('Redis write failed', err.message);
        }
      }

      return user;
    } catch (err: any) {
      this.logger.error(`Failed to fetch user ${userId}`, err.message);
      return null;
    }
  }
}
