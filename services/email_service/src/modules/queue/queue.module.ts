import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EmailModule } from '../email/email.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [EmailModule, TemplateModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
