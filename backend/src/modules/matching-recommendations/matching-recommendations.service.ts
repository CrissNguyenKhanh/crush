import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import type { IUser } from '../../common/types/user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { PmAccessService } from '../pm-access/pm-access.service';
import { Project } from '../projects/entities/project.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user.entity';
import { CreateMatchingRecommendationDto } from './dto/create-matching-recommendation.dto';
import { DecideMatchingRecommendationDto } from './dto/decide-matching-recommendation.dto';
import {
  MatchingRecommendation,
  MatchingRecommendationStatus,
} from './entities/matching-recommendation.entity';

@Injectable()
export class MatchingRecommendationsService {
  private readonly logger = new Logger(MatchingRecommendationsService.name);

  constructor(
    @InjectRepository(MatchingRecommendation)
    private readonly recommendationRepo: Repository<MatchingRecommendation>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly pmAccessService: PmAccessService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  findTargets() {
    return this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.pm', 'pm')
      .leftJoinAndSelect(
        'project.sprints',
        'sprint',
        'sprint.isDeleted = :sprintDeleted AND sprint.status NOT IN (:...terminalStatuses)',
        {
          sprintDeleted: false,
          terminalStatuses: ['completed', 'cancelled'],
        },
      )
      .where('project.isDeleted = :projectDeleted', { projectDeleted: false })
      .andWhere('project.status = :projectStatus', { projectStatus: 'active' })
      .orderBy('project.name', 'ASC')
      .addOrderBy('sprint.startDate', 'ASC')
      .getMany();
  }

  async create(dto: CreateMatchingRecommendationDto, user: IUser) {
    const note = dto.note.trim();
    if (!note) {
      throw new BadRequestException('Nội dung đề cử không được để trống.');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      // The employee lock serializes recommendations for one person, so the
      // duplicate check and insert cannot race one another.
      const employee = await manager
        .getRepository(User)
        .createQueryBuilder('employee')
        .innerJoinAndSelect('employee.role', 'role')
        .setLock('pessimistic_write')
        .where('employee.id = :employeeId', { employeeId: dto.employeeId })
        .andWhere('employee.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!employee || employee.role?.name !== 'DEVELOPER') {
        throw new BadRequestException(
          'Chỉ có thể đề cử tài khoản Developer đang hoạt động.',
        );
      }

      const project = await manager.getRepository(Project).findOne({
        where: { id: dto.projectId, isDeleted: false, status: 'active' },
      });
      if (!project || !project.pmId) {
        throw new NotFoundException(
          'Project active chưa có Primary PM để nhận đề cử.',
        );
      }

      if (dto.sprintId) {
        const sprint = await manager.getRepository(Sprint).findOne({
          where: { id: dto.sprintId, projectId: project.id, isDeleted: false },
        });
        if (!sprint) {
          throw new BadRequestException('Sprint không thuộc Project đã chọn.');
        }

        const sprintStatus = String(sprint.status ?? '').toLowerCase();
        if (sprintStatus === 'completed' || sprintStatus === 'cancelled') {
          throw new ConflictException({
            code: 'SPRINT_NOT_MUTABLE',
            message: 'Không thể đề cử cho Sprint đã hoàn thành hoặc bị hủy.',
          });
        }
      }

      if (dto.skillId) {
        const skill = await manager.getRepository(Skill).findOne({
          where: { id: dto.skillId, isDeleted: false },
        });
        if (!skill) {
          throw new BadRequestException('Kỹ năng đề cử không tồn tại.');
        }
      }

      const recommendationRepo = manager.getRepository(MatchingRecommendation);
      const duplicate = await recommendationRepo.findOne({
        where: {
          employeeId: dto.employeeId,
          projectId: dto.projectId,
          sprintId: dto.sprintId ?? IsNull(),
          status: In([
            MatchingRecommendationStatus.PROPOSED,
            MatchingRecommendationStatus.ACCEPTED,
          ]),
        },
      });
      if (duplicate) {
        throw new ConflictException({
          code: 'DUPLICATE_MATCHING_RECOMMENDATION',
          message:
            'Đề cử chưa bị từ chối cho nhân sự và phạm vi này đã tồn tại.',
        });
      }

      const saved = await recommendationRepo.save(
        recommendationRepo.create({
          ...dto,
          sprintId: dto.sprintId ?? null,
          skillId: dto.skillId ?? null,
          note,
          hrId: user.id,
          pmId: project.pmId,
          status: MatchingRecommendationStatus.PROPOSED,
        }),
      );

      return { saved, employee, project };
    });

    await this.notifyBestEffort({
      userId: result.project.pmId,
      title: 'HR đề cử nhân sự',
      description: `${result.employee.fullName} được đề cử cho ${result.project.name}.`,
      type: 'info',
    });

    return (
      (await this.recommendationRepo.findOne({
        where: { id: result.saved.id },
      })) ?? result.saved
    );
  }

  findMineAsHr(userId: string) {
    return this.recommendationRepo.find({
      where: { hrId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  findMineAsPm(userId: string) {
    return this.recommendationRepo
      .createQueryBuilder('recommendation')
      .leftJoinAndSelect('recommendation.employee', 'employee')
      .leftJoinAndSelect('recommendation.project', 'project')
      .leftJoinAndSelect('recommendation.sprint', 'sprint')
      .leftJoinAndSelect('recommendation.skill', 'skill')
      .leftJoinAndSelect('recommendation.hr', 'hr')
      .leftJoin('project.managers', 'manager')
      .where('project.pmId = :userId OR manager.userId = :userId', { userId })
      .orderBy('recommendation.createdAt', 'DESC')
      .getMany();
  }

  async decide(
    recommendationId: string,
    dto: DecideMatchingRecommendationDto,
    user: IUser,
  ) {
    const recommendation = await this.recommendationRepo.findOne({
      where: { id: recommendationId },
    });
    if (!recommendation) {
      throw new NotFoundException('Không tìm thấy đề cử.');
    }

    await this.pmAccessService.assertProjectAccess(
      user.id,
      recommendation.projectId,
    );

    const saved = await this.dataSource.transaction(async (manager) => {
      const locked = await manager
        .getRepository(MatchingRecommendation)
        .createQueryBuilder('recommendation')
        .setLock('pessimistic_write')
        .where('recommendation.id = :recommendationId', { recommendationId })
        .getOne();

      if (!locked) {
        throw new NotFoundException('Không tìm thấy đề cử.');
      }
      if (locked.status !== MatchingRecommendationStatus.PROPOSED) {
        throw new ConflictException('Đề cử này đã được xử lý.');
      }

      locked.status = dto.status;
      locked.decisionNote = dto.decisionNote?.trim() || null;
      return manager.getRepository(MatchingRecommendation).save(locked);
    });

    await this.notifyBestEffort({
      userId: recommendation.hrId,
      title: 'PM đã phản hồi đề cử',
      description: `Đề cử ${recommendation.employee?.fullName ?? 'nhân sự'} cho ${recommendation.project?.name ?? 'Project'} đã chuyển sang ${dto.status}.`,
      type:
        dto.status === MatchingRecommendationStatus.REJECTED
          ? 'warning'
          : 'success',
    });

    return (
      (await this.recommendationRepo.findOne({ where: { id: saved.id } })) ??
      saved
    );
  }

  private async notifyBestEffort(input: {
    userId: string;
    title: string;
    description: string;
    type: 'info' | 'success' | 'warning';
  }) {
    try {
      await this.notificationsService.createForUser(input);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(
        `Matching recommendation notification failed: ${reason}`,
      );
    }
  }
}
