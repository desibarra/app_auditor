import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../common/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.some((role) => user.roles?.includes(role))) {
      const operation = context.getHandler().name;
      const empresaId = request.body?.empresaId || 'N/A';
      const periodo = request.body?.periodo || 'N/A';
      const duration = 0; // No duration for denied access

      this.logger.warn(`[${operation}] [${empresaId}] [${periodo}] [${duration}ms] [ACCESS_DENIED]`);
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}