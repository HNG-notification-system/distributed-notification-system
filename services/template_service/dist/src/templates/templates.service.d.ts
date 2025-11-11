import { PrismaService } from '../prisma/prisma.service';
import { Cache } from 'cache-manager';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
export declare class TemplatesService {
    private prisma;
    private cacheManager;
    private readonly logger;
    constructor(prisma: PrismaService, cacheManager: Cache);
    private registerHandlebarsHelpers;
    private extractVariables;
    create(dto: CreateTemplateDto): Promise<{
        name: string;
        id: string;
        template_code: string;
        type: import("@prisma/client").$Enums.TemplateType;
        subject: string;
        body: string;
        variables: import("@prisma/client/runtime/library").JsonValue | null;
        language: string;
        is_active: boolean;
        created_by: string | null;
        updated_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
        updated_at: Date;
    }>;
    findAll(query: QueryTemplateDto): Promise<ApiResponse>;
    findOne(id: string): Promise<{
        versions: {
            id: string;
            subject: string;
            body: string;
            variables: import("@prisma/client/runtime/library").JsonValue | null;
            created_at: Date;
            version: number;
            changed_by: string | null;
            change_reason: string | null;
            template_id: string;
        }[];
    } & {
        name: string;
        id: string;
        template_code: string;
        type: import("@prisma/client").$Enums.TemplateType;
        subject: string;
        body: string;
        variables: import("@prisma/client/runtime/library").JsonValue | null;
        language: string;
        is_active: boolean;
        created_by: string | null;
        updated_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
        updated_at: Date;
    }>;
    findByCode(template_code: string): Promise<{}>;
    update(id: string, dto: UpdateTemplateDto): Promise<{
        name: string;
        id: string;
        template_code: string;
        type: import("@prisma/client").$Enums.TemplateType;
        subject: string;
        body: string;
        variables: import("@prisma/client/runtime/library").JsonValue | null;
        language: string;
        is_active: boolean;
        created_by: string | null;
        updated_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
        updated_at: Date;
    }>;
    remove(id: string): Promise<void>;
    preview(dto: PreviewTemplateDto): Promise<{
        subject: string;
        body: string;
    }>;
    getVersions(templateId: string): Promise<ApiResponse>;
    revertToVersion(templateId: string, versionNumber: number): Promise<{
        name: string;
        id: string;
        template_code: string;
        type: import("@prisma/client").$Enums.TemplateType;
        subject: string;
        body: string;
        variables: import("@prisma/client/runtime/library").JsonValue | null;
        language: string;
        is_active: boolean;
        created_by: string | null;
        updated_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
        updated_at: Date;
    }>;
}
