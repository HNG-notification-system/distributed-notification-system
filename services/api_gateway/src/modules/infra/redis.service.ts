// src/modules/infra/redis.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import config from '../../config/configuration';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    const cfg = config();
    this.client = new Redis(cfg.redis.url);
  }

  /**
   * Claim an idempotency key using SET NX EX.
   * Returns true if the key was set (this is the caller that "owns" processing),
   * false if the key already exists.
   */
  async claimRequest(id: string, ttlSeconds: number): Promise<boolean> {
    try {
      // Use cast to any to avoid TypeScript overload issues with ioredis typings
      const result = await (this.client as any).set(id, 'processing', 'NX', 'EX', ttlSeconds);
      return result === 'OK';
    } catch (err) {
      this.logger.warn(`claimRequest failed for ${id}: ${(err as any).message}`);
      throw err;
    }
  }

  /**
   * Set a simple string key. If ttlSeconds is provided, set with expiry.
   */
  async setKey(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    try {
      if (ttlSeconds) {
        // cast to any to avoid type errors with certain ioredis type defs
        return await (this.client as any).set(key, value, 'EX', ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch (err) {
      this.logger.warn(`setKey failed for ${key}: ${(err as any).message}`);
      throw err;
    }
  }

  /**
   * Get a simple string key.
   */
  async getKey(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn(`getKey failed for ${key}: ${(err as any).message}`);
      throw err;
    }
  }

  /**
   * Delete a key.
   */
  async delKey(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (err) {
      this.logger.warn(`delKey failed for ${key}: ${(err as any).message}`);
      throw err;
    }
  }

  /**
   * Set notification status (hash) for notif:{id}
   */
  async setStatus(id: string, status: string): Promise<number> {
    try {
      return await this.client.hset(
        `notif:${id}`,
        'status',
        status,
        'updatedAt',
        new Date().toISOString(),
      );
    } catch (err) {
      this.logger.warn(`setStatus failed for notif:${id}: ${(err as any).message}`);
      throw err;
    }
  }

  /**
   * Get all fields of the notification hash.
   */
  async getStatus(id: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(`notif:${id}`);
    } catch (err) {
      this.logger.warn(`getStatus failed for notif:${id}: ${(err as any).message}`);
      throw err;
    }
  }

  /**
   * Ping Redis.
   */
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (err) {
      this.logger.warn(`Redis ping failed: ${(err as any).message}`);
      throw err;
    }
  }
}
