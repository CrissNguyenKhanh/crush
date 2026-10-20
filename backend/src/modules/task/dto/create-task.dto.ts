import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateRequiredSkillDto {
  @IsUUID('4')
  skill_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  min_level: number;

  @IsInt()
  @Min(1)
  @Max(10)
  weight: number;
}

export class CreateTaskDto {
  @IsUUID('4')
  sprintId: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetRate?: number | null;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequiredSkillDto)
  requiredSkills?: CreateRequiredSkillDto[];
}
