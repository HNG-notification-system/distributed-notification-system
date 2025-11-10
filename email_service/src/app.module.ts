import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './modules/email/email.module';
import { TemplateModule } from './modules/template/template.module';
import { QueueModule } from './modules/queue/queue.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EmailModule,
    TemplateModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule {}
