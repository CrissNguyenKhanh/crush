import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_PERMISSION,
  REQUIRED_ROLES,
} from '../../../decorator/customize';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard role metadata', () => {
  const createContext = () =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', route: { path: '/protected' } }),
      }),
    }) as unknown as ExecutionContext;

  const createGuard = () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === REQUIRED_ROLES) return ['HR'];
        if (key === IS_PUBLIC_PERMISSION) return true;
        return undefined;
      }),
    } as unknown as Reflector;

    return new JwtAuthGuard(reflector);
  };

  it('allows an authenticated user with the required role', () => {
    const guard = createGuard();
    const user = { role: { name: 'HR' }, permissions: [] };

    expect(guard.handleRequest(null, user, null, createContext())).toBe(user);
  });

  it('rejects an authenticated user with a different role', () => {
    const guard = createGuard();
    const user = { role: { name: 'PM' }, permissions: [] };

    expect(() => {
      guard.handleRequest(null, user, null, createContext());
    }).toThrow(ForbiddenException);
  });
});
