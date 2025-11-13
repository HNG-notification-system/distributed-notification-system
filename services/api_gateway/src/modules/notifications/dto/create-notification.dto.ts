import { IsString, IsObject, IsOptional, IsIn, IsISO8601 } from 'class-validator';

export class CreateNotificationDto {
  @IsString() id: string;
  @IsString() userId: string;
  @IsIn(['email','push']) type: 'email' | 'push';
  @IsString() template_id: string;
  @IsObject() variables: Record<string, any>;
  @IsOptional() @IsString() priority?: 'low' | 'normal' | 'high';
  @IsOptional() @IsISO8601() scheduledAt?: string;
  @IsOptional() retryCount?: number;
}
