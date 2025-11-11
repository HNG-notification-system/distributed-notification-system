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
const trusted_guard_1 = require("../common/guards/trusted.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
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
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new template',
        description: 'Requires admin role and valid service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Template created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Bad request - validation failed',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Forbidden - user role does not have permission',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('admin', 'editor'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all templates with pagination and filters',
        description: 'Requires admin or editor role and valid service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Templates retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Forbidden - user role does not have permission',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_template_dto_1.QueryTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a template by ID',
        description: 'Requires valid service key (no specific role required)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Template UUID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Template retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Template not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('code/:template_code'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a template by template_code',
        description: 'Requires valid service key (no specific role required)',
    }),
    (0, swagger_1.ApiParam)({ name: 'template_code', example: 'welcome-email' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Template retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Template not found',
    }),
    __param(0, (0, common_1.Param)('template_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('admin', 'editor'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update a template',
        description: 'Requires admin or editor role and valid service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Template updated successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Bad request - validation failed',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Forbidden - user role does not have permission',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Template not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_template_dto_1.UpdateTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a template (soft delete)',
        description: 'Requires admin role and valid service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Template deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Forbidden - user role does not have permission',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Template not found',
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
        description: 'Renders template with provided variables. Requires valid service key (no specific role required). Optionally specify a version number.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Template rendered successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Bad request - validation failed or failed to render template',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Template not found',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [preview_template_dto_1.PreviewTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('admin', 'editor'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all versions of a template',
        description: 'Requires admin or editor role and valid service key',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Template UUID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Template versions retrieved',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Forbidden - user role does not have permission',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Template not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Post)(':id/versions/:version/revert'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('admin', 'editor'),
    (0, swagger_1.ApiOperation)({
        summary: 'Revert template to a specific version',
        description: 'Requires admin or editor role and valid service key',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Template UUID' }),
    (0, swagger_1.ApiParam)({ name: 'version', description: 'Version number to revert to' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Template reverted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Bad request - invalid version number',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - invalid or missing service key',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Forbidden - user role does not have permission',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
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
    (0, swagger_1.ApiBearerAuth)('service-key'),
    (0, common_1.Controller)('templates'),
    (0, common_1.UseGuards)(trusted_guard_1.TrustedGuard),
    __metadata("design:paramtypes", [templates_service_1.TemplatesService])
], TemplatesController);
//# sourceMappingURL=templates.controller.js.map