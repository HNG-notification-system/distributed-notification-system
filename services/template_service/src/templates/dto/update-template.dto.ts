import { PartialType } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  template_code?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  updated_by?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  change_reason?: string;
}
