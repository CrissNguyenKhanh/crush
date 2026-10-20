import { IsEnum } from 'class-validator';
import { UserSprintStatus } from '../entities/user-sprint.entity';

export class UpdateUserSprintStatusDto {
  @IsEnum(UserSprintStatus)
  status: UserSprintStatus;
}
