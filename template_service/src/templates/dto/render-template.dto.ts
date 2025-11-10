import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenderTemplateDto {
  @ApiProperty({ example: 'welcome-email' })
  @IsString()
  slug: string;

  @ApiProperty({
    example: { name: 'John Doe', company_name: 'Acme Corp' },
  })
  @IsObject()
  variables: Record<string, any>;
}
