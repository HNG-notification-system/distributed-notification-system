import { TemplateType } from '@prisma/client';
export declare class CreateTemplateDto {
    template_code: string;
    name: string;
    type: TemplateType;
    subject: string;
    body: string;
    variables?: string[];
    language?: string;
    metadata?: Record<string, any>;
    created_by?: string;
}
