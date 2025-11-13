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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateTemplateDto {
    template_code;
    name;
    type;
    subject;
    body;
    variables;
    language;
    metadata;
    created_by;
}
exports.CreateTemplateDto = CreateTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'welcome-email',
        description: 'Unique code identifier for the template',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "template_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Welcome Email Template',
        description: 'Human-readable template name',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.TemplateType,
        example: client_1.TemplateType.EMAIL,
        description: 'Type of notification template',
    }),
    (0, class_validator_1.IsEnum)(client_1.TemplateType),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Welcome to {{company_name}}!',
        description: 'Subject line with optional variables in {{brackets}}',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Hello {{name}}, welcome to our platform!',
        description: 'Main content with variables',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['name', 'company_name'],
        required: false,
        description: 'List of variables used in template (auto-extracted if not provided)',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'en', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { category: 'onboarding', tags: ['welcome'] },
        required: false,
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTemplateDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "created_by", void 0);
//# sourceMappingURL=create-template.dto.js.map