/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { Sprint } from './entities/sprint.entity';
import { SprintsService } from './sprints.service';
import { Task } from '../task/entities/task.entity';
import {
  UserSprint,
  UserSprintStatus,
} from '../user-sprints/entities/user-sprint.entity';
import { User } from '../users/entities/user.entity';

describe('SprintsService timeline concurrency guard', () => {
  const queryBuilder = (terminal: Record<string, jest.Mock>) => ({
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    ...terminal,
  });

  it('locks affected users before the sprint and rechecks allocation safety', async () => {
    const allocation = {
      id: 'allocation-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      percitant: 50,
      status: UserSprintStatus.ASSIGNED,
    } as UserSprint;
    const updatedSprint = {
      id: 'sprint-1',
      projectId: 'project-1',
      name: 'Sprint 1',
      status: 'active',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      attendant: [],
      isDeleted: false,
    } as Sprint;
    const lockedSprint = {
      ...updatedSprint,
      startDate: new Date('2026-10-05'),
      endDate: new Date('2026-10-20'),
    } as Sprint;
    const userQuery = queryBuilder({
      getOneOrFail: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const sprintQuery = queryBuilder({
      getOne: jest.fn().mockResolvedValue(lockedSprint),
    });
    const latestAllocationQuery = queryBuilder({
      getMany: jest.fn().mockResolvedValue([allocation]),
    });
    const currentAllocationQuery = queryBuilder({
      getMany: jest.fn().mockResolvedValue([allocation]),
    });
    const otherAllocationQuery = queryBuilder({
      getMany: jest.fn().mockResolvedValue([]),
    });
    const allocationRepo = {
      find: jest.fn().mockResolvedValue([allocation]),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(latestAllocationQuery)
        .mockReturnValueOnce(currentAllocationQuery)
        .mockReturnValueOnce(otherAllocationQuery),
    };
    const sprintRepo = {
      createQueryBuilder: jest.fn(() => sprintQuery),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const taskRepo = { find: jest.fn().mockResolvedValue([]) };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === UserSprint) return allocationRepo;
        if (entity === Sprint) return sprintRepo;
        if (entity === Task) return taskRepo;
        if (entity === User) return { createQueryBuilder: () => userQuery };
        throw new Error('Unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const service = new SprintsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource as any,
    );

    const result = await (service as any).saveTimelineUpdateWithLocks(
      updatedSprint,
    );

    expect(userQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(sprintQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(userQuery.setLock.mock.invocationCallOrder[0]).toBeLessThan(
      sprintQuery.setLock.mock.invocationCallOrder[0],
    );
    expect(latestAllocationQuery.setLock).toHaveBeenCalledWith(
      'pessimistic_read',
    );
    expect(otherAllocationQuery.getMany).toHaveBeenCalledTimes(1);
    expect(result.startDate).toEqual(updatedSprint.startDate);
    expect(result.endDate).toEqual(updatedSprint.endDate);
  });
});
