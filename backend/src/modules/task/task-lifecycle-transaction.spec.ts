/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { NotFoundException } from '@nestjs/common';
import { SkillEvidence } from '../skill-evidences/entities/skill-evidence.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { UserSkill } from '../user-skill/entities/user-skill.entity';
import { User } from '../users/entities/user.entity';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { TasksService } from './task.service';

describe('TasksService lifecycle transaction', () => {
  const createQueryBuilder = (result: unknown) => {
    const queryBuilder: any = {};
    for (const method of ['setLock', 'where', 'andWhere']) {
      queryBuilder[method] = jest.fn().mockReturnValue(queryBuilder);
    }
    queryBuilder.getOne = jest.fn().mockResolvedValue(result);
    queryBuilder.getOneOrFail = jest.fn().mockResolvedValue(result);
    return queryBuilder;
  };

  const setup = (taskResult: Task | null, existingEvidence?: SkillEvidence) => {
    const taskQuery = createQueryBuilder(taskResult);
    const userQuery = createQueryBuilder({ id: taskResult?.userId });
    const taskRepository = {
      createQueryBuilder: jest.fn(() => taskQuery),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const userSkill = {
      id: 'user-skill-1',
      userId: taskResult?.userId,
      skillId: 'skill-1',
    };
    const userSkillRepository = {
      findOne: jest.fn().mockResolvedValue(userSkill),
      create: jest.fn((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const evidenceRepository = {
      findOne: jest.fn().mockResolvedValue(existingEvidence ?? null),
      create: jest.fn((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Task) return taskRepository;
        if (entity === Sprint) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: taskResult?.sprintId,
              status: 'active',
            }),
          };
        }
        if (entity === User) return { createQueryBuilder: () => userQuery };
        if (entity === UserSkill) return userSkillRepository;
        if (entity === SkillEvidence) return evidenceRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const dependencies = {
      assertDependenciesCompleted: jest.fn().mockResolvedValue(undefined),
    };
    const realtime = {
      publishSprintChanged: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const service = new TasksService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dependencies as any,
      realtime as any,
      dataSource as any,
    );

    return {
      service,
      taskQuery,
      taskRepository,
      evidenceRepository,
      dataSource,
      realtime,
    };
  };

  const task = {
    id: 'task-1',
    sprintId: 'sprint-1',
    userId: 'developer-1',
    title: 'Task One',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    progress: 50,
    isDeleted: false,
    requiredSkills: [{ skill_id: 'skill-1', min_level: 2, weight: 10 }],
  } as Task;

  it('enforces developer ownership in the locked task query', async () => {
    const context = setup({ ...task });

    await context.service.updateTaskLifecycle(
      task.id,
      { progress: 60 },
      task.userId!,
    );

    expect(context.taskQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(context.taskQuery.andWhere).toHaveBeenCalledWith(
      'task.userId = :ownerUserId',
      { ownerUserId: task.userId },
    );
    expect(context.taskRepository.save).toHaveBeenCalledTimes(1);
    expect(context.realtime.publishSprintChanged).toHaveBeenCalledTimes(1);
  });

  it('does not expose or update a task that is not owned by the developer', async () => {
    const context = setup(null);

    await expect(
      context.service.updateTaskLifecycle(
        task.id,
        { progress: 60 },
        'different-developer',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(context.taskRepository.save).not.toHaveBeenCalled();
    expect(context.realtime.publishSprintChanged).not.toHaveBeenCalled();
  });

  it('does not duplicate completion evidence after a reopen and recomplete', async () => {
    const context = setup({ ...task }, { id: 'evidence-1' } as SkillEvidence);

    await context.service.updateTaskLifecycle(task.id, {
      status: TaskStatus.DONE,
      progress: 100,
    });

    expect(context.evidenceRepository.findOne).toHaveBeenCalledWith({
      where: {
        userSkillId: 'user-skill-1',
        taskId: task.id,
        type: 'TASK_COMPLETION',
        isDeleted: false,
      },
    });
    expect(context.evidenceRepository.save).not.toHaveBeenCalled();
    expect(context.taskRepository.save).toHaveBeenCalledTimes(1);
  });
});
