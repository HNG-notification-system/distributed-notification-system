// src/modules/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../infra/redis.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule], // provide http globally if you like
    providers: [RabbitmqService, RedisService],
    exports: [RabbitmqService, RedisService, HttpModule],
})
export class SharedModule { }
