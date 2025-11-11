"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const templates_service_1 = require("./templates.service");
const create_template_dto_1 = require("./dto/create-template.dto");
const update_template_dto_1 = require("./dto/update-template.dto");
const query_template_dto_1 = require("./dto/query-template.dto");
const preview_template_dto_1 = require("./dto/preview-template.dto");
let TemplatesController = class TemplatesController {
    templatesService;
    constructor(templatesService) {
        this.templatesService = templatesService;
    }
    async create(dto) {
        const data = await this.templatesService.create(dto);
        return {
            success: true,
            data,
            message: 'Template created successfully',
        };
    }
    findAll(query) {
        return this.templatesService.findAll(query);
    }
    async findOne(id) {
        const data = await this.templatesService.findOne(id);
        return {
            success: true,
            data,
            message: 'Template retrieved successfully',
        };
    }
    async findByCode(template_code) {
        const data = await this.templatesService.findByCode(template_code);
        return {
            success: true,
            data,
            message: 'Template retrieved successfully',
        };
    }
    async update(id, dto) {
        const data = await this.templatesService.update(id, dto);
        return {
            success: true,
            data,
            message: 'Template updated successfully',
        };
    }
    async remove(id) {
        await this.templatesService.remove(id);
    }
    async preview(dto) {
        const data = await this.templatesService.preview(dto);
        return {
            success: true,
            data,
            message: 'Template rendered successfully',
        };
    }
    getVersions(id) {
        return this.templatesService.getVersions(id);
    }
    async revertToVersion(id, version) {
        const data = await this.templatesService.revertToVersion(id, parseInt(version));
        return {
            success: true,
            data,
            message: `Template reverted to version ${version}`,
        };
    }
};
exports.TemplatesController = TemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new template' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Template created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - validation failed',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all templates with pagination and filters' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Templates retrieved successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_template_dto_1.QueryTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a template by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Template UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('code/:template_code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a template by template_code' }),
    (0, swagger_1.ApiParam)({ name: 'template_code', example: 'welcome-email' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Param)('template_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a template' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template updated successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_template_dto_1.UpdateTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a template (soft delete)' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Template deleted successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Preview/render a template with variables',
        description: 'Renders template with provided variables. Optionally specify a version number.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template rendered successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Failed to render template' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [preview_template_dto_1.PreviewTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all versions of a template' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Template UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template versions retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Post)(':id/versions/:version/revert'),
    (0, swagger_1.ApiOperation)({ summary: 'Revert template to a specific version' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Template UUID' }),
    (0, swagger_1.ApiParam)({ name: 'version', description: 'Version number to revert to' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template reverted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Template or version not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "revertToVersion", null);
exports.TemplatesController = TemplatesController = __decorate([
    (0, swagger_1.ApiTags)('Templates'),
    (0, common_1.Controller)('templates'),
    __metadata("design:paramtypes", [templates_service_1.TemplatesService])
], TemplatesController);
//# sourceMappingURL=templates.controller.js.map