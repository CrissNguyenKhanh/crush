import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { Sprint } from '../../sprints/entities/sprint.entity';
import { User } from '../../users/entities/user.entity';

export enum MatchingRecommendationStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ALLOCATED = 'ALLOCATED',
}

@Entity('matching_recommendations')
@Index('IDX_matching_recommendations_pm_status', ['pmId', 'status'])
@Index('IDX_matching_recommendations_hr_created', ['hrId', 'createdAt'])
@Index('IDX_matching_recommendations_scope_status', [
  'employeeId',
  'projectId',
  'sprintId',
  'status',
])
export class MatchingRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'employee_id' })
  employee: User;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId: string | null;

  @ManyToOne(() => Sprint, { eager: true, nullable: true })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint | null;

  @Column({ name: 'skill_id', type: 'uuid', nullable: true })
  skillId: string | null;

  @ManyToOne(() => Skill, { eager: true, nullable: true })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill | null;

  @Column({ name: 'hr_id', type: 'uuid' })
  hrId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'hr_id' })
  hr: User;

  @Column({ name: 'pm_id', type: 'uuid' })
  pmId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'pm_id' })
  pm: User;

  @Column({ type: 'text' })
  note: string;

  @Column({ name: 'decision_note', type: 'text', nullable: true })
  decisionNote: string | null;

  @Column({
    type: 'enum',
    enum: MatchingRecommendationStatus,
    default: MatchingRecommendationStatus.PROPOSED,
  })
  status: MatchingRecommendationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
