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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @SwaggerResponse({
    status: 201,
    description: 'Template created successfully',
  })
  @SwaggerResponse({
    status: 400,
    description: 'Bad request - validation failed',
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
  @ApiOperation({ summary: 'Get all templates with pagination and filters' })
  @SwaggerResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  findAll(@Query() query: QueryTemplateDto): Promise<ApiResponse> {
    return this.templatesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @SwaggerResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.templatesService.findOne(id);
    return {
      success: true,
      data,
      message: 'Template retrieved successfully',
    };
  }

  @Get('code/:template_code')
  @ApiOperation({ summary: 'Get a template by template_code' })
  @ApiParam({ name: 'template_code', example: 'welcome-email' })
  @SwaggerResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Template not found' })
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
  @ApiOperation({ summary: 'Update a template' })
  @SwaggerResponse({
    status: 200,
    description: 'Template updated successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Template not found' })
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
  @ApiOperation({ summary: 'Delete a template (soft delete)' })
  @SwaggerResponse({
    status: 204,
    description: 'Template deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.templatesService.remove(id);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview/render a template with variables',
    description:
      'Renders template with provided variables. Optionally specify a version number.',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Template rendered successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Template not found' })
  @SwaggerResponse({ status: 400, description: 'Failed to render template' })
  async preview(@Body() dto: PreviewTemplateDto): Promise<ApiResponse> {
    const data = await this.templatesService.preview(dto);
    return {
      success: true,
      data,
      message: 'Template rendered successfully',
    };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a template' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @SwaggerResponse({ status: 200, description: 'Template versions retrieved' })
  getVersions(@Param('id') id: string): Promise<ApiResponse> {
    return this.templatesService.getVersions(id);
  }

  @Post(':id/versions/:version/revert')
  @ApiOperation({ summary: 'Revert template to a specific version' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiParam({ name: 'version', description: 'Version number to revert to' })
  @SwaggerResponse({
    status: 200,
    description: 'Template reverted successfully',
  })
  @SwaggerResponse({
    status: 404,
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
