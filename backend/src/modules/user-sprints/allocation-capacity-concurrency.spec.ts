/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { Sprint } from '../sprints/entities/sprint.entity';
import { Task } from '../task/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { SprintInvitationDecision } from './dto/respond-sprint-invitation.dto';
import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';
import { SprintAllocationResponseService } from './sprint-allocation-response.service';
import { SprintAllocationRetryService } from './sprint-allocation-retry.service';
import { UserSprintService } from './user-sprints.service';

const createQueryBuilder = (terminal: Record<string, jest.Mock>) => ({
  setLock: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  ...terminal,
});

describe('allocation capacity concurrency guards', () => {
  it('locks the employee while creating an allocation', async () => {
    const userQuery = createQueryBuilder({
      getOne: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const duplicateQuery = createQueryBuilder({
      getOne: jest.fn().mockResolvedValue(null),
    });
    const overlapQuery = createQueryBuilder({
      getMany: jest.fn().mockResolvedValue([]),
    });
    const saved = {
      id: 'allocation-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      percitant: 60,
      status: UserSprintStatus.REQUESTED,
    } as UserSprint;
    const allocationRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(duplicateQuery)
        .mockReturnValueOnce(overlapQuery),
      create: jest.fn().mockReturnValue(saved),
      save: jest.fn().mockResolvedValue(saved),
    };
    const sprintQuery = createQueryBuilder({
      getOne: jest.fn().mockResolvedValue({
        id: 'sprint-1',
        status: 'ACTIVE',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      }),
    });
    const sprintRepo = { createQueryBuilder: () => sprintQuery };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return { createQueryBuilder: () => userQuery };
        if (entity === Sprint) return sprintRepo;
        return allocationRepo;
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };
    const realtime = {
      publishSprintChanged: jest.fn().mockResolvedValue(undefined),
    };
    const service = new UserSprintService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      realtime as never,
      {} as never,
      {} as never,
      dataSource as never,
    );

    await expect(
      service.assignUserToSprint({
        sprintId: 'sprint-1',
        userId: 'user-1',
        percitant: 60,
      }),
    ).resolves.toBe(saved);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(userQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(sprintQuery.setLock).toHaveBeenCalledWith('pessimistic_read');
    expect(allocationRepo.save).toHaveBeenCalledWith(saved);
  });

  it('locks the employee and rechecks capacity when accepting', async () => {
    const userQuery = createQueryBuilder({
      getOneOrFail: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const capacityQuery = createQueryBuilder({
      getMany: jest.fn().mockResolvedValue([]),
    });
    const allocation = {
      id: 'allocation-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      percitant: 50,
      status: UserSprintStatus.PENDING_APPROVAL,
      user: { fullName: 'Developer' },
      sprint: {
        id: 'sprint-1',
        name: 'Sprint 1',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        project: { pmId: 'pm-1', managers: [] },
      },
    } as UserSprint;
    const sprintQuery = createQueryBuilder({
      getOne: jest.fn().mockResolvedValue(allocation.sprint),
    });
    const allocationRepo = {
      findOne: jest.fn().mockResolvedValue(allocation),
      createQueryBuilder: jest.fn().mockReturnValue(capacityQuery),
      save: jest.fn(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return { createQueryBuilder: () => userQuery };
        if (entity === Sprint) return { createQueryBuilder: () => sprintQuery };
        return allocationRepo;
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };
    const realtime = {
      publishSprintChanged: jest.fn().mockResolvedValue(undefined),
    };
    const notifications = {
      createForUser: jest.fn().mockResolvedValue(undefined),
    };
    const service = new SprintAllocationResponseService(
      {} as never,
      realtime as never,
      notifications as never,
      dataSource as never,
    );

    const result = await service.respond(
      'user-1',
      'allocation-1',
      SprintInvitationDecision.ACCEPT,
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(userQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(sprintQuery.setLock).toHaveBeenCalledWith('pessimistic_read');
    expect(capacityQuery.getMany).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(UserSprintStatus.ASSIGNED);
  });

  it('locks the employee and rechecks capacity when retrying', async () => {
    const userQuery = createQueryBuilder({
      getOneOrFail: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const capacityQuery = createQueryBuilder({
      getMany: jest.fn().mockResolvedValue([]),
    });
    const sprint = {
      id: 'sprint-1',
      name: 'Sprint 1',
      projectId: 'project-1',
      status: 'ACTIVE',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      project: { name: 'Project 1' },
    };
    const allocation = {
      id: 'allocation-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      percitant: 40,
      status: UserSprintStatus.DECLINED,
      sprint,
    } as UserSprint;
    const sprintQuery = createQueryBuilder({
      getOne: jest.fn().mockResolvedValue(sprint),
    });
    const allocationRepo = {
      findOne: jest.fn().mockResolvedValue(allocation),
      createQueryBuilder: jest.fn().mockReturnValue(capacityQuery),
      save: jest.fn(async (value) => ({ ...value, sprint: undefined })),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return { createQueryBuilder: () => userQuery };
        if (entity === Sprint) return { createQueryBuilder: () => sprintQuery };
        return allocationRepo;
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };
    const realtime = {
      publishSprintChanged: jest.fn().mockResolvedValue(undefined),
    };
    const invitations = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new SprintAllocationRetryService(
      invitations as never,
      realtime as never,
      dataSource as never,
    );

    const result = await service.retry('allocation-1', 55);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(userQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(sprintQuery.setLock).toHaveBeenCalledWith('pessimistic_read');
    expect(capacityQuery.getMany).toHaveBeenCalledTimes(1);
    expect(invitations.send).toHaveBeenCalledWith(
      expect.objectContaining({ sprintId: 'sprint-1', percentage: 55 }),
    );
    expect(result.status).toBe(UserSprintStatus.PENDING_APPROVAL);
  });

  it('locks the employee while releasing so task assignment cannot race', async () => {
    const userQuery = createQueryBuilder({
      getOneOrFail: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const allocation = {
      id: 'allocation-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      percitant: 50,
      status: UserSprintStatus.ASSIGNED,
      sprint: {
        id: 'sprint-1',
        status: 'active',
      },
    } as UserSprint;
    const allocationRepo = {
      findOne: jest.fn().mockResolvedValue(allocation),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const taskRepo = { find: jest.fn().mockResolvedValue([]) };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return { createQueryBuilder: () => userQuery };
        if (entity === Task) return taskRepo;
        return allocationRepo;
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };
    const realtime = {
      publishSprintChanged: jest.fn().mockResolvedValue(undefined),
    };
    const service = new UserSprintService(
      { findOne: jest.fn().mockResolvedValue(allocation) } as never,
      {} as never,
      {} as never,
      {} as never,
      realtime as never,
      {} as never,
      {} as never,
      dataSource as never,
    );

    const result = await service.releaseUser('allocation-1', {
      hardSkillRate: 4,
      softSkillRate: 5,
      reviewComment: 'Strong delivery',
    });

    expect(userQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(taskRepo.find).toHaveBeenCalledTimes(1);
    expect(allocationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: UserSprintStatus.RELEASED }),
    );
    expect(result.status).toBe(UserSprintStatus.RELEASED);
  });
});
