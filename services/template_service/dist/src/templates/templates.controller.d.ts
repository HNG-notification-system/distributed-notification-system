import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    create(dto: CreateTemplateDto): Promise<ApiResponse>;
    findAll(query: QueryTemplateDto): Promise<ApiResponse>;
    findOne(id: string): Promise<ApiResponse>;
    findByCode(template_code: string): Promise<ApiResponse>;
    update(id: string, dto: UpdateTemplateDto): Promise<ApiResponse>;
    remove(id: string): Promise<void>;
    preview(dto: PreviewTemplateDto): Promise<ApiResponse>;
    getVersions(id: string): Promise<ApiResponse>;
    revertToVersion(id: string, version: string): Promise<ApiResponse>;
}
