import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { QueueModule } from '../queue/queue.module';
import { EmailModule } from '../email/email.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [QueueModule, EmailModule, TemplateModule],
  controllers: [HealthController],
})
export class HealthModule {}
