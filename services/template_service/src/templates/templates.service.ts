import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import * as Handlebars from 'handlebars';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString();
    });
  }

  private extractVariables(text: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(text)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  async create(dto: CreateTemplateDto) {
    // Check if template_code already exists
    const existing = await this.prisma.template.findUnique({
      where: { template_code: dto.template_code },
    });

    if (existing) {
      throw new BadRequestException('Template with this code already exists');
    }

    // Auto-extract variables if not provided
    const subjectVars = this.extractVariables(dto.subject);
    const bodyVars = this.extractVariables(dto.body);
    const allVariables = Array.from(new Set([...subjectVars, ...bodyVars]));

    // Create template
    const template = await this.prisma.template.create({
      data: {
        template_code: dto.template_code,
        name: dto.name,
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables || allVariables,
        language: dto.language || 'en',
        metadata: dto.metadata || {},
        created_by: dto.created_by,
      },
    });

    // Create initial version
    await this.prisma.templateVersion.create({
      data: {
        template_id: template.id,
        version: 1,
        subject: template.subject,
        body: template.body,
        variables: template.variables as any,
        changed_by: dto.created_by,
        change_reason: 'Initial creation',
      },
    });

    this.logger.log(`✅ Template created: ${dto.template_code}`);
    return template;
  }

  async findAll(query: QueryTemplateDto): Promise<ApiResponse> {
    const { search, type, language, is_active, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { template_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (language) where.language = language;

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);

    const total_pages = Math.ceil(total / limit);

    return {
      success: true,
      data: templates,
      message: 'Templates retrieved successfully',
      meta: {
        total,
        limit,
        page,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' }, take: 5 } },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async findByCode(template_code: string) {
    // Try cache first
    const cacheKey = `template:${template_code}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      this.logger.debug(`✅ Cache hit: ${template_code}`);
      return cached;
    }

    // Query database
    const template = await this.prisma.template.findUnique({
      where: { template_code, is_active: true },
    });

    if (!template) {
      throw new NotFoundException(
        `Template with code ${template_code} not found`,
      );
    }

    // Cache for TTL configured in Redis
    await this.cacheManager.set(cacheKey, template);

    return template;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const template = await this.findOne(id);

    // If template_code changed, check uniqueness
    if (dto.template_code && dto.template_code !== template.template_code) {
      const existing = await this.prisma.template.findUnique({
        where: { template_code: dto.template_code },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('Template code already exists');
      }
    }

    // Update variables if content changed
    let variables = template.variables as string[];
    if (dto.subject || dto.body) {
      const subjectVars = this.extractVariables(
        dto.subject || template.subject,
      );
      const bodyVars = this.extractVariables(dto.body || template.body);
      variables = Array.from(new Set([...subjectVars, ...bodyVars]));
    }

    // Update template
    const updated = await this.prisma.template.update({
      where: { id },
      data: {
        ...dto,
        variables,
      },
    });

    // Create new version
    const lastVersion = await this.prisma.templateVersion.findFirst({
      where: { template_id: id },
      orderBy: { version: 'desc' },
    });

    await this.prisma.templateVersion.create({
      data: {
        template_id: id,
        version: (lastVersion?.version || 0) + 1,
        subject: updated.subject,
        body: updated.body,
        variables: updated.variables as any,
        changed_by: dto.updated_by,
        change_reason: dto.change_reason || 'Template updated',
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`template:${updated.template_code}`);

    this.logger.log(`✅ Template updated: ${updated.template_code}`);
    return updated;
  }

  async remove(id: string) {
    const template = await this.findOne(id);

    // Soft delete
    await this.prisma.template.update({
      where: { id },
      data: { is_active: false },
    });

    // Invalidate cache
    await this.cacheManager.del(`template:${template.template_code}`);

    this.logger.log(`🗑️ Template soft deleted: ${template.template_code}`);
  }

  async preview(dto: PreviewTemplateDto) {
    let template;

    if (dto.version) {
      // Get specific version
      const version = await this.prisma.templateVersion.findFirst({
        where: {
          template: { template_code: dto.template_code },
          version: dto.version,
        },
        include: { template: true },
      });

      if (!version) {
        throw new NotFoundException(
          `Template version ${dto.version} not found`,
        );
      }

      template = {
        subject: version.subject,
        body: version.body,
      };
    } else {
      // Get latest version
      template = await this.findByCode(dto.template_code);
    }

    try {
      const subjectTemplate = Handlebars.compile(template.subject);
      const bodyTemplate = Handlebars.compile(template.body);

      return {
        subject: subjectTemplate(dto.variables),
        body: bodyTemplate(dto.variables),
      };
    } catch (error) {
      this.logger.error(
        `❌ Error rendering template ${dto.template_code}: ${error.message}`,
      );
      throw new BadRequestException('Failed to render template');
    }
  }

  async getVersions(templateId: string): Promise<ApiResponse> {
    const versions = await this.prisma.templateVersion.findMany({
      where: { template_id: templateId },
      orderBy: { version: 'desc' },
    });

    return {
      success: true,
      data: versions,
      message: 'Template versions retrieved successfully',
    };
  }

  async revertToVersion(templateId: string, versionNumber: number) {
    const version = await this.prisma.templateVersion.findFirst({
      where: {
        template_id: templateId,
        version: versionNumber,
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Update template with old version data
    const reverted = await this.prisma.template.update({
      where: { id: templateId },
      data: {
        subject: version.subject,
        body: version.body,
        variables: version.variables as any,
        updated_at: new Date(),
      },
    });

    // Create new version entry
    const lastVersion = await this.prisma.templateVersion.findFirst({
      where: { template_id: templateId },
      orderBy: { version: 'desc' },
    });

    await this.prisma.templateVersion.create({
      data: {
        template_id: templateId,
        version: (lastVersion?.version || 0) + 1,
        subject: reverted.subject,
        body: reverted.body,
        variables: reverted.variables as any,
        changed_by: 'system',
        change_reason: `Reverted to version ${versionNumber}`,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`template:${reverted.template_code}`);

    this.logger.log(`✅ Template reverted to version ${versionNumber}`);
    return reverted;
  }
}
