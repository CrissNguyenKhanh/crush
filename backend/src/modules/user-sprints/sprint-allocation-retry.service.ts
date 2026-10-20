import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';

import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';

import { SprintAllocationInvitationService } from './sprint-allocation-invitation.service';

import { PmRealtimeService } from '../pm-realtime/pm-realtime.service';
import { User } from '../users/entities/user.entity';
import { Sprint } from '../sprints/entities/sprint.entity';

@Injectable()
export class SprintAllocationRetryService {
  constructor(
    private readonly sprintAllocationInvitationService: SprintAllocationInvitationService,

    private readonly pmRealtimeService: PmRealtimeService,
    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // RETRY DECLINED INVITATION
  // ==========================================

  async retry(allocationId: string, percentage?: number) {
    const { saved, sprint } = await this.dataSource.transaction(
      async (manager) => {
        const allocationRepo = manager.getRepository(UserSprint);
        let allocation = await allocationRepo.findOne({
          where: {
            id: allocationId,
          },

          relations: {
            user: true,

            sprint: {
              project: true,
            },
          },
        });

        if (!allocation) {
          throw new NotFoundException({
            code: 'ALLOCATION_NOT_FOUND',

            message: 'Không tìm thấy Allocation.',
          });
        }

        await manager
          .getRepository(User)
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :userId', { userId: allocation.userId })
          .getOneOrFail();

        const reloadedAllocation = await allocationRepo.findOne({
          where: { id: allocationId },
          relations: { user: true, sprint: { project: true } },
        });

        if (!reloadedAllocation) {
          throw new NotFoundException({
            code: 'ALLOCATION_NOT_FOUND',
            message: 'Không tìm thấy Allocation.',
          });
        }

        allocation = reloadedAllocation;

        // ========================================
        // DECLINED ONLY
        // ========================================

        if (allocation.status !== UserSprintStatus.DECLINED) {
          throw new ConflictException({
            code: 'ALLOCATION_NOT_DECLINED',

            message: 'Chỉ lời mời đã bị Dev từ chối mới được gửi lại.',

            currentStatus: allocation.status,
          });
        }

        const relatedProject = allocation.sprint?.project;
        const sprint = await manager
          .getRepository(Sprint)
          .createQueryBuilder('sprint')
          .setLock('pessimistic_read')
          .where('sprint.id = :sprintId', { sprintId: allocation.sprintId })
          .getOne();

        if (!sprint) {
          throw new NotFoundException({
            code: 'SPRINT_NOT_FOUND',

            message: 'Không tìm thấy Sprint.',
          });
        }

        if (relatedProject) sprint.project = relatedProject;
        allocation.sprint = sprint;

        // ========================================
        // SPRINT MUST STILL BE MUTABLE
        // ========================================

        const sprintStatus = (sprint.status ?? '').toString().toUpperCase();

        if (sprintStatus === 'COMPLETED' || sprintStatus === 'CANCELLED') {
          throw new ConflictException({
            code: 'SPRINT_INVITATION_EXPIRED',

            message:
              'Sprint đã hoàn thành hoặc bị hủy nên không thể gửi lại lời mời.',
          });
        }

        // ========================================
        // NEW PERCENTAGE
        // ========================================

        const nextPercentage = percentage ?? Number(allocation.percitant ?? 0);

        // ========================================
        // CAPACITY RE-CHECK
        // ========================================

        await this.assertCapacityAvailable(allocation, nextPercentage, manager);

        // ========================================
        // UPDATE
        //
        // Giữ responseReason/respondedAt cũ.
        // Đây là phản hồi gần nhất của Dev,
        // hữu ích cho PM theo dõi.
        // ========================================

        allocation.percitant = nextPercentage;

        allocation.status = UserSprintStatus.PENDING_APPROVAL;

        const saved = await allocationRepo.save(allocation);
        return { saved, sprint };
      },
    );

    // ========================================
    // REFRESH ALL PMs
    // ========================================

    await this.pmRealtimeService.publishSprintChanged(saved.sprintId, {
      entity: 'ALLOCATION',

      action: 'STATUS_CHANGED',

      entityId: saved.id,
    });

    // ========================================
    // SEND NEW INVITATION TO DEV
    // ========================================

    await this.sprintAllocationInvitationService.send({
      userId: saved.userId,

      allocationId: saved.id,

      sprintId: sprint.id,

      sprintName: sprint.name ?? 'Sprint',

      projectId: sprint.projectId,

      projectName: sprint.project?.name ?? 'Dự án',

      percentage: Number(saved.percitant ?? 0),

      startDate: sprint.startDate ?? null,

      endDate: sprint.endDate ?? null,
    });

    return saved;
  }

  // ==========================================
  // CAPACITY
  // ==========================================

  private async assertCapacityAvailable(
    allocation: UserSprint,
    requestedPercentage: number,
    manager: EntityManager,
  ) {
    const sprint = allocation.sprint;

    if (!sprint?.startDate || !sprint?.endDate) {
      throw new ConflictException({
        code: 'SPRINT_TIMELINE_REQUIRED',

        message: 'Sprint chưa có timeline hợp lệ.',
      });
    }

    const activeStatuses = [
      UserSprintStatus.REQUESTED,

      UserSprintStatus.PENDING_APPROVAL,

      UserSprintStatus.ASSIGNED,
    ];

    const allocations = await manager
      .getRepository(UserSprint)
      .createQueryBuilder('allocation')

      .innerJoin('allocation.sprint', 'sprint')

      .where('allocation.userId = :userId', {
        userId: allocation.userId,
      })

      // Không tính record đang retry.
      .andWhere('allocation.id != :allocationId', {
        allocationId: allocation.id,
      })

      .andWhere('allocation.status IN (:...statuses)', {
        statuses: activeStatuses,
      })

      .andWhere('sprint.startDate <= :targetEnd', {
        targetEnd: sprint.endDate,
      })

      .andWhere('sprint.endDate >= :targetStart', {
        targetStart: sprint.startDate,
      })

      .getMany();

    const usedPercentage = allocations.reduce(
      (total, current) => total + Number(current.percitant ?? 0),
      0,
    );

    const afterRetry = usedPercentage + requestedPercentage;

    if (afterRetry > 100) {
      throw new ConflictException({
        code: 'ALLOCATION_CAPACITY_EXCEEDED',

        message: `Nhân sự chỉ còn ${Math.max(
          0,
          100 - usedPercentage,
        )}% capacity trong thời gian Sprint.`,

        usedPercentage,

        requestedPercentage,

        afterRetry,
      });
    }
  }
}
