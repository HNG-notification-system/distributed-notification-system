import { CreateTemplateDto } from './create-template.dto';
declare const UpdateTemplateDto_base: import("@nestjs/common").Type<Partial<CreateTemplateDto>>;
export declare class UpdateTemplateDto extends UpdateTemplateDto_base {
    template_code?: string;
    is_active?: boolean;
    updated_by?: string;
    change_reason?: string;
}
export {};
