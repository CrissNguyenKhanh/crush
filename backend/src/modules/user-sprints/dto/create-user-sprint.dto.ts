import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateUserSprintDto {
  @IsUUID('4')
  sprintId: string;

  @IsUUID('4')
  userId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  percitant: number;
}
