import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { PmAccessModule } from '../pm-access/pm-access.module';
import { Project } from '../projects/entities/project.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user.entity';
import { MatchingRecommendation } from './entities/matching-recommendation.entity';
import { MatchingRecommendationsController } from './matching-recommendations.controller';
import { MatchingRecommendationsService } from './matching-recommendations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchingRecommendation,
      Project,
      Sprint,
      User,
      Skill,
    ]),
    PmAccessModule,
    NotificationsModule,
  ],
  controllers: [MatchingRecommendationsController],
  providers: [MatchingRecommendationsService],
})
export class MatchingRecommendationsModule {}
