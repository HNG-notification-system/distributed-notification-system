import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty({
    example: 'Welcome Email Template',
    description: 'Human-readable template name',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    enum: TemplateType,
    example: TemplateType.EMAIL,
    description: 'Type of notification template',
  })
  @IsEnum(TemplateType)
  type: TemplateType;

  @ApiProperty({
    example: 'Welcome to {{company_name}}!',
    description: 'Subject line with optional variables in {{brackets}}',
  })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiProperty({
    example: 'Hello {{name}}, welcome to our platform!',
    description: 'Main content with variables',
  })
  @IsString()
  @MinLength(10)
  body: string;

  @ApiProperty({
    example: ['name', 'company_name'],
    required: false,
    description:
      'List of variables used in template (auto-extracted if not provided)',
  })
  @IsArray()
  @IsString({ each: true }) 
  @IsOptional()
  variables?: string[];

  @ApiProperty({ example: 'en', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    example: { category: 'onboarding', tags: ['welcome'] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  created_by?: string;
}
