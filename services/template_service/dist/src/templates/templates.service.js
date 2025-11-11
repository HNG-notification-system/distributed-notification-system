"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TemplatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const Handlebars = __importStar(require("handlebars"));
let TemplatesService = TemplatesService_1 = class TemplatesService {
    prisma;
    cacheManager;
    logger = new common_1.Logger(TemplatesService_1.name);
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
        this.registerHandlebarsHelpers();
    }
    registerHandlebarsHelpers() {
        Handlebars.registerHelper('uppercase', (str) => str?.toUpperCase());
        Handlebars.registerHelper('lowercase', (str) => str?.toLowerCase());
        Handlebars.registerHelper('formatDate', (date) => {
            return new Date(date).toLocaleDateString();
        });
    }
    extractVariables(text) {
        const regex = /\{\{(\w+)\}\}/g;
        const variables = new Set();
        let match;
        while ((match = regex.exec(text)) !== null) {
            variables.add(match[1]);
        }
        return Array.from(variables);
    }
    async create(dto) {
        const existing = await this.prisma.template.findUnique({
            where: { template_code: dto.template_code },
        });
        if (existing) {
            throw new common_1.BadRequestException('Template with this code already exists');
        }
        const subjectVars = this.extractVariables(dto.subject);
        const bodyVars = this.extractVariables(dto.body);
        const allVariables = Array.from(new Set([...subjectVars, ...bodyVars]));
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
        this.logger.log(`✅ Template created: ${dto.template_code}`);
        return template;
    }
    async findAll(query) {
        const { search, type, language, is_active, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { template_code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (type)
            where.type = type;
        if (language)
            where.language = language;
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
    async findOne(id) {
        const template = await this.prisma.template.findUnique({
            where: { id },
            include: { versions: { orderBy: { version: 'desc' }, take: 5 } },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Template with ID ${id} not found`);
        }
        return template;
    }
    async findByCode(template_code) {
        const cacheKey = `template:${template_code}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${template_code}`);
            return cached;
        }
        const template = await this.prisma.template.findUnique({
            where: { template_code, is_active: true },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Template with code ${template_code} not found`);
        }
        await this.cacheManager.set(cacheKey, template);
        return template;
    }
    async update(id, dto) {
        const template = await this.findOne(id);
        if (dto.template_code && dto.template_code !== template.template_code) {
            const existing = await this.prisma.template.findUnique({
                where: { template_code: dto.template_code },
            });
            if (existing && existing.id !== id) {
                throw new common_1.BadRequestException('Template code already exists');
            }
        }
        let variables = template.variables;
        if (dto.subject || dto.body) {
            const subjectVars = this.extractVariables(dto.subject || template.subject);
            const bodyVars = this.extractVariables(dto.body || template.body);
            variables = Array.from(new Set([...subjectVars, ...bodyVars]));
        }
        const updated = await this.prisma.template.update({
            where: { id },
            data: {
                ...dto,
                variables,
            },
        });
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
                variables: updated.variables,
                changed_by: dto.updated_by,
                change_reason: dto.change_reason || 'Template updated',
            },
        });
        await this.cacheManager.del(`template:${updated.template_code}`);
        this.logger.log(`✅ Template updated: ${updated.template_code}`);
        return updated;
    }
    async remove(id) {
        const template = await this.findOne(id);
        await this.prisma.template.update({
            where: { id },
            data: { is_active: false },
        });
        await this.cacheManager.del(`template:${template.template_code}`);
        this.logger.log(`🗑️ Template soft deleted: ${template.template_code}`);
    }
    async preview(dto) {
        let template;
        if (dto.version) {
            const version = await this.prisma.templateVersion.findFirst({
                where: {
                    template: { template_code: dto.template_code },
                    version: dto.version,
                },
                include: { template: true },
            });
            if (!version) {
                throw new common_1.NotFoundException(`Template version ${dto.version} not found`);
            }
            template = {
                subject: version.subject,
                body: version.body,
            };
        }
        else {
            template = await this.findByCode(dto.template_code);
        }
        try {
            const subjectTemplate = Handlebars.compile(template.subject);
            const bodyTemplate = Handlebars.compile(template.body);
            return {
                subject: subjectTemplate(dto.variables),
                body: bodyTemplate(dto.variables),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error rendering template ${dto.template_code}: ${error.message}`);
            throw new common_1.BadRequestException('Failed to render template');
        }
    }
    async getVersions(templateId) {
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
    async revertToVersion(templateId, versionNumber) {
        const version = await this.prisma.templateVersion.findFirst({
            where: {
                template_id: templateId,
                version: versionNumber,
            },
        });
        if (!version) {
            throw new common_1.NotFoundException(`Version ${versionNumber} not found`);
        }
        const template = await this.prisma.template.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Template ${templateId} not found`);
        }
        const reverted = await this.prisma.template.update({
            where: { id: templateId },
            data: {
                subject: version.subject,
                body: version.body,
                variables: version.variables,
                updated_at: new Date(),
            },
        });
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
                variables: reverted.variables,
                changed_by: 'system',
                change_reason: `Reverted to version ${versionNumber}`,
            },
        });
        await this.cacheManager.del(`template:${reverted.template_code}`);
        this.logger.log(`✅ Template reverted to version ${versionNumber}`);
        return reverted;
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = TemplatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map