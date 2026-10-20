import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { IUser } from '../../common/types/user.interface';
import { Roles, SkipCheckPermission, User } from '../../decorator/customize';
import { CreateMatchingRecommendationDto } from './dto/create-matching-recommendation.dto';
import { DecideMatchingRecommendationDto } from './dto/decide-matching-recommendation.dto';
import { MatchingRecommendationsService } from './matching-recommendations.service';

@Controller('matching-recommendations')
@SkipCheckPermission()
export class MatchingRecommendationsController {
  constructor(private readonly service: MatchingRecommendationsService) {}

  @Roles('HR')
  @Get('targets')
  findTargets() {
    return this.service.findTargets();
  }

  @Roles('HR')
  @Post()
  create(@Body() dto: CreateMatchingRecommendationDto, @User() user: IUser) {
    return this.service.create(dto, user);
  }

  @Roles('HR')
  @Get('hr')
  findMineAsHr(@User() user: IUser) {
    return this.service.findMineAsHr(user.id);
  }

  @Roles('PM')
  @Get('pm')
  findMineAsPm(@User() user: IUser) {
    return this.service.findMineAsPm(user.id);
  }

  @Roles('PM')
  @Patch(':id/status')
  decide(
    @Param('id') id: string,
    @Body() dto: DecideMatchingRecommendationDto,
    @User() user: IUser,
  ) {
    return this.service.decide(id, dto, user);
  }
}
