import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMatchingRecommendationDto {
  @IsUUID('4')
  employeeId: string;

  @IsUUID('4')
  projectId: string;

  @IsOptional()
  @IsUUID('4')
  sprintId?: string;

  @IsOptional()
  @IsUUID('4')
  skillId?: string;

  @IsString()
  @MaxLength(2000)
  note: string;
}
