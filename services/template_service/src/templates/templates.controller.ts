import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { TrustedGuard } from '../common/guards/trusted.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Templates')
@ApiBearerAuth('service-key')
@Controller('templates')
@UseGuards(TrustedGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  @ApiOperation({
    summary: 'Create a new template',
    description: 'Requires admin role and valid service key',
  })
  @SwaggerResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user role does not have permission',
  })
  async create(@Body() dto: CreateTemplateDto): Promise<ApiResponse> {
    const data = await this.templatesService.create(dto);
    return {
      success: true,
      data,
      message: 'Template created successfully',
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @ApiOperation({
    summary: 'Get all templates with pagination and filters',
    description: 'Requires admin or editor role and valid service key',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user role does not have permission',
  })
  findAll(@Query() query: QueryTemplateDto): Promise<ApiResponse> {
    return this.templatesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a template by ID',
    description: 'Requires valid service key (no specific role required)',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.templatesService.findOne(id);
    return {
      success: true,
      data,
      message: 'Template retrieved successfully',
    };
  }

  @Get('code/:template_code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a template by template_code',
    description: 'Requires valid service key (no specific role required)',
  })
  @ApiParam({ name: 'template_code', example: 'welcome-email' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async findByCode(
    @Param('template_code') template_code: string,
  ): Promise<ApiResponse> {
    const data = await this.templatesService.findByCode(template_code);
    return {
      success: true,
      data,
      message: 'Template retrieved successfully',
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @ApiOperation({
    summary: 'Update a template',
    description: 'Requires admin or editor role and valid service key',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user role does not have permission',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<ApiResponse> {
    const data = await this.templatesService.update(id, dto);
    return {
      success: true,
      data,
      message: 'Template updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete a template (soft delete)',
    description: 'Requires admin role and valid service key',
  })
  @SwaggerResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user role does not have permission',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.templatesService.remove(id);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview/render a template with variables',
    description:
      'Renders template with provided variables. Requires valid service key (no specific role required). Optionally specify a version number.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Template rendered successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed or failed to render template',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async preview(@Body() dto: PreviewTemplateDto): Promise<ApiResponse> {
    const data = await this.templatesService.preview(dto);
    return {
      success: true,
      data,
      message: 'Template rendered successfully',
    };
  }

  @Get(':id/versions')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @ApiOperation({
    summary: 'Get all versions of a template',
    description: 'Requires admin or editor role and valid service key',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Template versions retrieved',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user role does not have permission',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  getVersions(@Param('id') id: string): Promise<ApiResponse> {
    return this.templatesService.getVersions(id);
  }

  @Post(':id/versions/:version/revert')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @ApiOperation({
    summary: 'Revert template to a specific version',
    description: 'Requires admin or editor role and valid service key',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiParam({ name: 'version', description: 'Version number to revert to' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Template reverted successfully',
  })
  @SwaggerResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - invalid version number',
  })
  @SwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing service key',
  })
  @SwaggerResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user role does not have permission',
  })
  @SwaggerResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template or version not found',
  })
  async revertToVersion(
    @Param('id') id: string,
    @Param('version') version: string,
  ): Promise<ApiResponse> {
    const data = await this.templatesService.revertToVersion(
      id,
      parseInt(version),
    );
    return {
      success: true,
      data,
      message: `Template reverted to version ${version}`,
    };
  }
}
