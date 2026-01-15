import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  applyDecorators,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../models/user.schema';
import { JwtAuthGuard } from './jwt-auth.guard';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not authenticated.',
      });
    }

    // Check if user has required role
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    return true;
  }
}

export function authorize(...roles: UserRole[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}

export default authorize;

