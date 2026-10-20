/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { UserStatusType } from '../../../common/enum/user.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('uses the current database role instead of stale JWT role claims', async () => {
    const currentUser = {
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Current User',
      status: UserStatusType.AVAILABLE,
      managerId: null,
      role: {
        id: 'role-pm',
        name: 'PM',
        permissions: [{ id: 'permission-1' }],
      },
    };
    const usersService = {
      findOneByEmail: jest.fn().mockResolvedValue(currentUser),
    };
    const strategy = new JwtStrategy(
      { get: jest.fn().mockReturnValue('test-secret') } as any,
      usersService as any,
    );

    const result = await strategy.validate({
      id: 'stale-id',
      email: currentUser.email,
      fullName: 'Stale Name',
      status: UserStatusType.BENCH,
      role: { id: 'role-hr', name: 'HR' },
    } as any);

    expect(result).toMatchObject({
      id: currentUser.id,
      fullName: currentUser.fullName,
      status: currentUser.status,
      role: currentUser.role,
      permissions: currentUser.role.permissions,
    });
  });
});
