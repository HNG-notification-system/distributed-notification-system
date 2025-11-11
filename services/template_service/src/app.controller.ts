import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Service information' })
  getInfo() {
    return {
      service: 'Template Service',
      version: '1.0.0',
      description: 'Notification template management service',
      endpoints: {
        health: '/health',
        docs: '/api/docs',
        templates: '/templates',
      },
    };
  }
}
