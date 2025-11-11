import { IsString, IsObject, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreviewTemplateDto {
  @ApiProperty({ example: 'welcome-email' })
  @IsString()
  template_code: string;

  @ApiProperty({
    example: { name: 'John Doe', company_name: 'Acme Corp' },
    description: 'Variables to substitute in template',
  })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({ required: false, description: 'Specific version to preview' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
