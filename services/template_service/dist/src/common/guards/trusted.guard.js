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
var TrustedGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustedGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
let TrustedGuard = TrustedGuard_1 = class TrustedGuard {
    reflector;
    logger = new common_1.Logger(TrustedGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const serviceKey = request.headers['x-service-key'] || request.headers['X-Service-Key'];
        const userRole = (request.headers['x-user-role'] ||
            request.headers['X-User-Role'] ||
            '')
            .toString()
            .toLowerCase();
        this.logger.debug('Parsed headers:', {
            serviceKey: serviceKey ? '***' : 'MISSING',
            userRole: userRole || 'MISSING',
        });
        if (!serviceKey || serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
            this.logger.warn('Invalid or missing service key');
            throw new common_1.UnauthorizedException('Valid service key required');
        }
        request.user = { role: userRole };
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) || [];
        this.logger.debug(`Required roles: [${requiredRoles.join(', ')}]`);
        if (requiredRoles.length === 0) {
            this.logger.debug('Access granted via valid service key');
            return true;
        }
        if (!requiredRoles.includes(userRole)) {
            this.logger.warn(`Access denied: user role "${userRole}" does not match required roles [${requiredRoles.join(', ')}]`);
            throw new common_1.ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
        }
        this.logger.debug(`Access granted for role: ${userRole}`);
        return true;
    }
};
exports.TrustedGuard = TrustedGuard;
exports.TrustedGuard = TrustedGuard = TrustedGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], TrustedGuard);
//# sourceMappingURL=trusted.guard.js.map