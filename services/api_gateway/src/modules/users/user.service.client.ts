import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import config from '../../config/configuration';
import { RedisService } from '../infra/redis.service';

@Injectable()
export class UserServiceClient {
  private readonly cfg = config();
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly cacheTTL = 300; // cache user info for 5 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly redis: RedisService,
  ) {}

  private userCacheKey(userId: string) {
    return `usercache:${userId}`;
  }

  async getUser(userId: string): Promise<any | null> {
    const key = this.userCacheKey(userId);

    // 1) try Redis cache
    try {
      const cached = await this.redis.getKey(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn('Redis cache read failed', (err as any).message);
      // continue to fetch fresh data
    }

    // 2) fetch from User Service
    const base = this.cfg.userService?.url || process.env.USER_SERVICE_URL;
    if (!base) {
      this.logger.error('No User Service URL configured (USER_SERVICE_URL)');
      return null;
    }

    try {
      const resp$ = this.httpService.get(`${base}/users/${userId}`);
      const resp = await firstValueFrom(resp$);
      const user = resp.data;

      // store in cache
      try {
        await this.redis.setKey(key, JSON.stringify(user), this.cacheTTL);
      } catch (err) {
        this.logger.warn('Redis cache write failed', (err as any).message);
      }

      return user;
    } catch (err) {
      this.logger.error(`Failed fetching user ${userId}`, (err as any).message);
      return null;
    }
  }
}
