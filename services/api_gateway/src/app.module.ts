// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './modules/shared/shared.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    // load your config and make ConfigService global so every module can inject it
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    ThrottlerModule.forRoot(),
    SharedModule,
    NotificationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
