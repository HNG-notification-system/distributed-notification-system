import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class TrustedGuard implements CanActivate {
  private readonly logger = new Logger(TrustedGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Get only the headers we need
    const serviceKey =
      request.headers['x-service-key'] || request.headers['X-Service-Key'];
    const userRole = (
      request.headers['x-user-role'] ||
      request.headers['X-User-Role'] ||
      ''
    )
      .toString()
      .toLowerCase();

    this.logger.debug('Parsed headers:', {
      serviceKey: serviceKey ? '***' : 'MISSING',
      userRole: userRole || 'MISSING',
    });

    // Service key authentication
    if (!serviceKey || serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
      this.logger.warn('Invalid or missing service key');
      throw new UnauthorizedException('Valid service key required');
    }

    // Attach user to request (minimal info)
    request.user = { role: userRole };

    //  Check role requirements
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    this.logger.debug(`Required roles: [${requiredRoles.join(', ')}]`);

    // If no specific roles required, grant access to service key holder
    if (requiredRoles.length === 0) {
      this.logger.debug('Access granted via valid service key');
      return true;
    }

    // Check if user role matches required roles
    if (!requiredRoles.includes(userRole)) {
      this.logger.warn(
        `Access denied: user role "${userRole}" does not match required roles [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    this.logger.debug(`Access granted for role: ${userRole}`);
    return true;
  }
}
