import { PrismaService } from '../prisma/prisma.service';
import { Cache } from 'cache-manager';
export declare class HealthController {
    private readonly prisma;
    private readonly cacheManager;
    constructor(prisma: PrismaService, cacheManager: Cache);
    check(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    detailedCheck(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        version: string;
        checks: {
            database: {
                status: string;
                response_time: string;
                error?: undefined;
            } | {
                status: string;
                error: any;
                response_time?: undefined;
            };
            redis: {
                status: string;
                response_time: string;
                error?: undefined;
            } | {
                status: string;
                error: any;
                response_time?: undefined;
            };
        };
    }>;
    private checkDatabase;
    private checkRedis;
}
