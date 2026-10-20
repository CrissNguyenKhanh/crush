import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MatchingRecommendationStatus } from '../entities/matching-recommendation.entity';

export class DecideMatchingRecommendationDto {
  @IsIn([
    MatchingRecommendationStatus.ACCEPTED,
    MatchingRecommendationStatus.REJECTED,
  ])
  status: MatchingRecommendationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decisionNote?: string;
}
