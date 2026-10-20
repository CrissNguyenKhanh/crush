import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  IS_PUBLIC_KEY,
  IS_PUBLIC_PERMISSION,
  REQUIRED_ROLES,
} from 'decorator/customize';

interface GuardPermission {
  method: string;
  api_path: string;
}

interface GuardUser {
  role?: { name?: string };
  permissions?: GuardPermission[];
}

interface GuardRequest {
  method: string;
  route: { path: string };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = GuardUser>(
    err: Error | null,
    user: TUser | null,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<GuardRequest>();
    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    const authenticatedUser = user as TUser & GuardUser;
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (
      requiredRoles?.length &&
      !requiredRoles.includes(
        String(authenticatedUser.role?.name ?? '').toUpperCase(),
      )
    ) {
      throw new ForbiddenException(
        'Vai trò hiện tại không được phép truy cập endpoint này',
      );
    }

    const targetMethod = request.method;
    const targetEndPoint = request.route.path;
    const permissions = authenticatedUser.permissions || [];

    const hasPermission =
      targetEndPoint.startsWith('/api/v1/auth') ||
      permissions.some(
        (permission) =>
          targetMethod === permission.method &&
          targetEndPoint === permission.api_path,
      );

    if (!hasPermission && !isSkipPermission) {
      throw new ForbiddenException('Bạn không có quyền truy cập endpoint này');
    }

    return user;
  }
}
