/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Project } from '../projects/entities/project.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user.entity';
import {
  MatchingRecommendation,
  MatchingRecommendationStatus,
} from './entities/matching-recommendation.entity';
import { MatchingRecommendationsService } from './matching-recommendations.service';

describe('MatchingRecommendationsService', () => {
  const hr = { id: 'hr-1' } as any;
  const employee = {
    id: 'dev-1',
    fullName: 'Developer One',
    role: { name: 'DEVELOPER' },
  };
  const project = {
    id: 'project-1',
    name: 'Project One',
    pmId: 'pm-1',
    status: 'active',
  };
  const dto = {
    employeeId: employee.id,
    projectId: project.id,
    note: 'Strong match',
  };

  const createQueryBuilder = (result: unknown) => {
    const queryBuilder: any = {};
    for (const method of [
      'innerJoinAndSelect',
      'leftJoinAndSelect',
      'leftJoin',
      'setLock',
      'where',
      'andWhere',
      'orderBy',
      'addOrderBy',
    ]) {
      queryBuilder[method] = jest.fn().mockReturnValue(queryBuilder);
    }
    queryBuilder.getOne = jest.fn().mockResolvedValue(result);
    queryBuilder.getMany = jest.fn().mockResolvedValue(result);
    return queryBuilder;
  };

  const setupCreate = (options?: {
    duplicate?: MatchingRecommendation;
    sprint?: Partial<Sprint> | null;
    notificationError?: Error;
  }) => {
    const saved = { id: 'recommendation-1', ...dto };
    const employeeQuery = createQueryBuilder(employee);
    const txRecommendationRepo = {
      findOne: jest.fn().mockResolvedValue(options?.duplicate ?? null),
      create: jest.fn((value) => value),
      save: jest
        .fn()
        .mockImplementation(async (value) => ({ ...value, id: saved.id })),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return { createQueryBuilder: () => employeeQuery };
        if (entity === Project) {
          return { findOne: jest.fn().mockResolvedValue(project) };
        }
        if (entity === Sprint) {
          return {
            findOne: jest.fn().mockResolvedValue(options?.sprint ?? null),
          };
        }
        if (entity === Skill) {
          return { findOne: jest.fn().mockResolvedValue({ id: 'skill-1' }) };
        }
        if (entity === MatchingRecommendation) return txRecommendationRepo;
        throw new Error('Unexpected repository');
      }),
    };
    const recommendationRepo = {
      findOne: jest.fn().mockResolvedValue(saved),
    };
    const projectRepo = { createQueryBuilder: jest.fn() };
    const pmAccess = { assertProjectAccess: jest.fn() };
    const notifications = {
      createForUser: options?.notificationError
        ? jest.fn().mockRejectedValue(options.notificationError)
        : jest.fn().mockResolvedValue({ id: 'notification-1' }),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const service = new MatchingRecommendationsService(
      recommendationRepo as any,
      projectRepo as any,
      pmAccess as any,
      notifications as any,
      dataSource as any,
    );

    return {
      service,
      employeeQuery,
      txRecommendationRepo,
      notifications,
    };
  };

  it('serializes creation on the employee and creates one proposed record', async () => {
    const context = setupCreate();

    await expect(context.service.create(dto, hr)).resolves.toMatchObject({
      id: 'recommendation-1',
    });
    expect(context.employeeQuery.setLock).toHaveBeenCalledWith(
      'pessimistic_write',
    );
    expect(context.txRecommendationRepo.save).toHaveBeenCalledTimes(1);
    expect(context.notifications.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId: project.pmId }),
    );
  });

  it('rejects an active duplicate in the same matching scope', async () => {
    const context = setupCreate({
      duplicate: {
        id: 'existing',
        status: MatchingRecommendationStatus.PROPOSED,
      } as MatchingRecommendation,
    });

    await expect(context.service.create(dto, hr)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(context.txRecommendationRepo.save).not.toHaveBeenCalled();
  });

  it('rejects a terminal sprint', async () => {
    const context = setupCreate({
      sprint: {
        id: 'sprint-1',
        projectId: project.id,
        status: 'completed',
      },
    });

    await expect(
      context.service.create({ ...dto, sprintId: 'sprint-1' }, hr),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not turn a committed recommendation into an API failure when notification fails', async () => {
    const context = setupCreate({ notificationError: new Error('offline') });

    await expect(context.service.create(dto, hr)).resolves.toMatchObject({
      id: 'recommendation-1',
    });
  });

  it('checks current project access before a PM decision', async () => {
    const recommendationRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'recommendation-1',
        projectId: project.id,
      }),
    };
    const pmAccess = {
      assertProjectAccess: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('denied')),
    };
    const dataSource = { transaction: jest.fn() };
    const service = new MatchingRecommendationsService(
      recommendationRepo as any,
      {} as any,
      pmAccess as any,
      { createForUser: jest.fn() } as any,
      dataSource as any,
    );

    await expect(
      service.decide(
        'recommendation-1',
        { status: MatchingRecommendationStatus.ACCEPTED },
        { id: 'pm-2' } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('locks a proposed recommendation before accepting it', async () => {
    const initial = {
      id: 'recommendation-1',
      projectId: project.id,
      hrId: 'hr-1',
      status: MatchingRecommendationStatus.PROPOSED,
      employee,
      project,
    };
    const locked = { ...initial };
    const lockQuery = createQueryBuilder(locked);
    const txRepository = {
      createQueryBuilder: jest.fn(() => lockQuery),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn(() => txRepository),
    };
    const recommendationRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce({
          ...locked,
          status: MatchingRecommendationStatus.ACCEPTED,
        }),
    };
    const service = new MatchingRecommendationsService(
      recommendationRepo as any,
      {} as any,
      { assertProjectAccess: jest.fn().mockResolvedValue(project) } as any,
      { createForUser: jest.fn().mockResolvedValue({}) } as any,
      {
        transaction: jest.fn(async (callback) => callback(manager)),
      } as any,
    );

    await expect(
      service.decide(
        initial.id,
        { status: MatchingRecommendationStatus.ACCEPTED },
        { id: project.pmId } as any,
      ),
    ).resolves.toMatchObject({
      status: MatchingRecommendationStatus.ACCEPTED,
    });
    expect(lockQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(txRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MatchingRecommendationStatus.ACCEPTED,
      }),
    );
  });
});
