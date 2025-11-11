import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import config from '../../config/configuration';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    const cfg = config();
    this.client = new Redis(cfg.redis.url);
  }

  async claimRequest(id: string, ttlSeconds: number) {
    // SETNX pattern: return true if set (first time), false if exists
    const result = await (this.client as any).set(id, 'processing', 'NX', 'EX', ttlSeconds);
    return result === 'OK';
  }

  async setStatus(id: string, status: string) {
    await this.client.hset(`notif:${id}`, 'status', status, 'updatedAt', new Date().toISOString());
  }

  async getStatus(id: string) {
    return this.client.hgetall(`notif:${id}`);
  }

  
  async setKey(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async getKey(key: string): Promise<string | null> {
    return this.client.get(key);
  }


  async ping(): Promise<string> {
    return this.client.ping();
  }
}
