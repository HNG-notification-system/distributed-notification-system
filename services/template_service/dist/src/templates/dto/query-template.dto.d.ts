import { TemplateType } from '@prisma/client';
export declare class QueryTemplateDto {
    search?: string;
    type?: TemplateType;
    language?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}
