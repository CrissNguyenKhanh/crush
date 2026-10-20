import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ReleaseUserSprintDto {
  @IsInt()
  @Min(1)
  @Max(5)
  hardSkillRate: number;

  @IsInt()
  @Min(1)
  @Max(5)
  softSkillRate: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reviewComment: string;
}
