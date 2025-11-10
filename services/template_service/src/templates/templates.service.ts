import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.template.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        'Template with similar name already exists',
      );
    }

    const subjectVars = this.extractVariables(dto.subject);
    const bodyVars = this.extractVariables(dto.body);
    const allVariables = Array.from(new Set([...subjectVars, ...bodyVars]));

    const template = await this.prisma.template.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables || allVariables,
        language: dto.language || 'en',
        metadata: dto.metadata || {},
        created_by: dto.created_by,
      },
    });

    // Create first version
    await this.prisma.templateVersion.create({
      data: {
        template_id: template.id,
        version: 1,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        changed_by: dto.created_by,
        change_reason: 'Initial creation',
      },
    });

    this.logger.log(`✅ Template created: ${slug}`);
    return template;
  }

  async findAll(query: QueryTemplateDto) {
    const { search, type, language, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { is_active: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
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

  async findBySlug(slug: string) {
    const cacheKey = `template:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      this.logger.debug(`✅ Cache hit: ${slug}`);
      return cached;
    }

    const template = await this.prisma.template.findUnique({
      where: { slug, is_active: true },
    });

    if (!template) {
      throw new NotFoundException(`Template not found: ${slug}`);
    }

    await this.cacheManager.set(cacheKey, template, 300000);
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const template = await this.findOne(id);

    let slug = template.slug;
    if (dto.name && dto.name !== template.name) {
      slug = this.generateSlug(dto.name);
      const existing = await this.prisma.template.findUnique({
        where: { slug },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Template with similar name exists');
      }
    }

    let variables = template.variables as string[];
    if (dto.subject || dto.body) {
      const subjectVars = this.extractVariables(
        dto.subject || template.subject,
      );
      const bodyVars = this.extractVariables(dto.body || template.body);
      variables = Array.from(new Set([...subjectVars, ...bodyVars]));
    }

    const updated = await this.prisma.template.update({
      where: { id },
      data: { ...dto, slug, variables },
    });

    // Get current max version
    const lastVersion = await this.prisma.templateVersion.findFirst({
      where: { template_id: id },
      orderBy: { version: 'desc' },
    });

    // Create new version
    await this.prisma.templateVersion.create({
      data: {
        template_id: id,
        version: (lastVersion?.version || 0) + 1,
        subject: updated.subject,
        body: updated.body,
        variables: updated.variables,
        changed_by: dto.updated_by,
        change_reason: dto.change_reason || 'Template updated',
      },
    });

    await this.cacheManager.del(`template:${updated.slug}`);
    this.logger.log(`✅ Template updated: ${updated.slug}`);
    return updated;
  }

  async remove(id: string) {
    const template = await this.findOne(id);

    await this.prisma.template.update({
      where: { id },
      data: { is_active: false },
    });

    await this.cacheManager.del(`template:${template.slug}`);
    this.logger.log(`🗑️ Template deleted: ${template.slug}`);
  }

  async render(dto: RenderTemplateDto) {
    const template = await this.findBySlug(dto.slug);

    try {
      const subjectTemplate = Handlebars.compile(template.subject);
      const bodyTemplate = Handlebars.compile(template.body);

      return {
        subject: subjectTemplate(dto.variables),
        body: bodyTemplate(dto.variables),
      };
    } catch (error) {
      this.logger.error(`❌ Render failed: ${error.message}`);
      throw new BadRequestException('Failed to render template');
    }
  }

  async getVersions(templateId: string) {
    const versions = await this.prisma.templateVersion.findMany({
      where: { template_id: templateId },
      orderBy: { version: 'desc' },
    });

    return {
      success: true,
      data: versions,
      message: 'Versions retrieved',
    };
  }
}
