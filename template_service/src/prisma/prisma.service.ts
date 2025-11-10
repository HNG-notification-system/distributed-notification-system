import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  constructor() {
    super({
      log: ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connect to PostgreSQL(Aiven)');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected for PostgreSQL');
  }

  //    // Helper method to clear database
  //   async cleanDatabase() {
  //     if (process.env.NODE_ENV === 'production') {
  //       throw new Error('Cannot clean database in production!');
  //     }

  //     await this.templateVersion.deleteMany();
  //     await this.template.deleteMany();
  //   }
}
