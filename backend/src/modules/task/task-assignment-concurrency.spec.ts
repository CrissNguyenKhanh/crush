/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { Sprint } from '../sprints/entities/sprint.entity';
import {
  UserSprint,
  UserSprintStatus,
} from '../user-sprints/entities/user-sprint.entity';
import { User } from '../users/entities/user.entity';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { TasksService } from './task.service';

describe('TasksService assignment concurrency guard', () => {
  it('locks the task and developer before checking active sprint membership', async () => {
    const task = {
      id: 'task-1',
      sprintId: 'sprint-1',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      progress: 0,
      isDeleted: false,
    } as Task;
    const queryBuilder = (result: unknown) => {
      const query: any = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(result),
        getOneOrFail: jest.fn().mockResolvedValue(result),
      };
      return query;
    };
    const taskQuery = queryBuilder(task);
    const userQuery = queryBuilder({ id: 'developer-1' });
    const taskRepo = {
      createQueryBuilder: jest.fn(() => taskQuery),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Task) return taskRepo;
        if (entity === User) {
          return {
            createQueryBuilder: () => userQuery,
            findOne: jest.fn().mockResolvedValue({ id: 'developer-1' }),
          };
        }
        if (entity === UserSprint) {
          return {
            findOne: jest.fn().mockResolvedValue({
              sprintId: task.sprintId,
              userId: 'developer-1',
              status: UserSprintStatus.ASSIGNED,
            }),
          };
        }
        throw new Error('Unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const realtime = {
      publishSprintChanged: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TasksService(
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          id: task.sprintId,
          status: 'active',
        } as Sprint),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      realtime as any,
      dataSource as any,
    );

    await expect(
      service.updateTaskAssignee(task.id, 'developer-1'),
    ).resolves.toMatchObject({ userId: 'developer-1' });
    expect(taskQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(userQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(taskRepo.save).toHaveBeenCalledTimes(1);
    expect(realtime.publishSprintChanged).toHaveBeenCalledTimes(1);
  });
});
