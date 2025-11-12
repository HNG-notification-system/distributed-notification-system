import { Controller, Post, Body, Get, Param, ConflictException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) 
  async create(@Body() dto: CreateNotificationDto) {
    const result = await this.svc.enqueueNotification(dto);

    if (!result.enqueued) {
      // conflict for duplicates/opt-outs if you prefer
      throw new ConflictException(result.reason || 'not enqueued');
    }

    return { id: dto.id, status: 'queued', scheduled: !!result.scheduled };
  }

  @Get(':id/status')
  async status(@Param('id') id: string) {
    return this.svc.getStatus(id);
  }
}
