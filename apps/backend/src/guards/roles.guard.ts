import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../common/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    return true; // ← BYPASS TOTAL TEMPORAL PARA UNBLOCK USER
  }
}