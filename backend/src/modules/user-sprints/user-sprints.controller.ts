import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ResponseMessage,
  Roles,
  SkipCheckPermission,
  User,
} from 'decorator/customize';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { PmAccessService } from '../pm-access/pm-access.service';

import { UserSprintService } from './user-sprints.service';

import type { IUser } from 'common/types/user.interface';
import { SprintAllocationResponseService } from './sprint-allocation-response.service';
import { SprintAllocationRetryService } from './sprint-allocation-retry.service';
import {
  RespondSprintInvitationDto,
  SprintInvitationDecision,
} from './dto/respond-sprint-invitation.dto';
import { RetrySprintInvitationDto } from './dto/retry-sprint-invitation.dto';
import { CreateUserSprintDto } from './dto/create-user-sprint.dto';
import { ReleaseUserSprintDto } from './dto/release-user-sprint.dto';
import { UpdateUserSprintStatusDto } from './dto/update-user-sprint-status.dto';

@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
@Controller('user-sprint')
export class UserSprintController {
  constructor(
    private readonly userSprintService: UserSprintService,

    private readonly pmAccessService: PmAccessService,

    private readonly sprintAllocationResponseService: SprintAllocationResponseService,

    private readonly sprintAllocationRetryService: SprintAllocationRetryService,
  ) {}
  @Get('sprint/:sprintId')
  @Roles('PM')
  async getSprintUsers(
    @Param('sprintId')
    sprintId: string,

    @User()
    user: IUser,
  ) {
    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(user.id, sprintId);

    const data = await this.userSprintService.getSprintUsers(sprintId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách phân bổ Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET USER CAPACITY FOR TARGET SPRINT
  //
  // GET
  // /user-sprint/capacity/:userId?sprintId=...
  //
  // Chỉ cần ownership của Sprint đích.
  //
  // Capacity service vẫn được phép tính
  // workload từ các Sprint overlap khác.
  // ==========================================

  @Get('capacity/:userId')
  @Roles('PM')
  async getUserCapacity(
    @Param('userId')
    userId: string,

    @Query('sprintId')
    sprintId: string,

    @User()
    user: IUser,
  ) {
    if (!sprintId) {
      throw new BadRequestException({
        code: 'SPRINT_ID_REQUIRED',

        message: 'Phải truyền sprintId để kiểm tra capacity.',
      });
    }

    // ========================================
    // TARGET SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(user.id, sprintId);

    const data = await this.userSprintService.getUserCapacity(userId, sprintId);

    return {
      statusCode: 200,

      message: 'Lấy capacity nhân sự thành công',

      data,
    };
  }

  // ==========================================
  // RESOURCE PLANNER
  //
  // GET /user-sprint/resource-planner
  //
  // Không nhận pmId từ frontend.
  // PM hiện tại luôn lấy từ JWT.
  // ==========================================

  @Get('resource-planner')
  @Roles('PM')
  async getResourcePlanner(@User() user: IUser) {
    const currentPmId = user.id;

    const data = await this.userSprintService.getResourcePlanner(currentPmId);

    return {
      statusCode: 200,

      message: 'Lấy Resource Planner thành công',

      data,
    };
  }

  // ==========================================
  // REQUEST ALLOCATION
  //
  // POST /user-sprint
  //
  // PM phải quản lý Project chứa Sprint.
  // ==========================================

  @Get('my-invitations')
  @Roles('DEVELOPER')
  async getMySprintInvitations(@User() user: IUser) {
    const data = await this.sprintAllocationResponseService.getMyInvitations(
      user.id,
    );

    return {
      statusCode: 200,
      message: 'Lấy danh sách lời mời Sprint thành công',
      data,
    };
  }

  @Patch(':id/respond')
  @Roles('DEVELOPER')
  async respondSprintInvitation(
    @Param('id') id: string,
    @Body() body: RespondSprintInvitationDto,
    @User() user: IUser,
  ) {
    const data = await this.sprintAllocationResponseService.respond(
      user.id,
      id,
      body.decision,
      body.reason,
    );

    return {
      statusCode: 200,
      message:
        body.decision === SprintInvitationDecision.ACCEPT
          ? 'Đã chấp nhận lời mời Sprint'
          : 'Đã từ chối lời mời Sprint',
      data,
    };
  }

  @Post()
  @Roles('PM')
  async assignUserToSprint(
    @Body()
    body: CreateUserSprintDto,

    @User()
    user: IUser,
  ) {
    // ========================================
    // BASIC INPUT
    // ========================================

    if (!body?.sprintId) {
      throw new BadRequestException({
        code: 'SPRINT_ID_REQUIRED',

        message: 'Yêu cầu phân bổ phải có sprintId.',
      });
    }

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(user.id, body.sprintId);

    // ========================================
    // BUSINESS
    //
    // Service tiếp tục chịu trách nhiệm:
    // - duplicate
    // - overlap
    // - capacity
    // - percentage
    // - Sprint mutable
    // ========================================

    const data = await this.userSprintService.assignUserToSprint(body);

    return {
      statusCode: 201,

      message: 'Đã gửi yêu cầu gán nhân sự',

      data,
    };
  }

  // ==========================================
  // SUBMIT FOR APPROVAL
  //
  // REQUESTED
  //     ↓
  // PENDING_APPROVAL
  //
  // PATCH
  // /user-sprint/:id/submit-approval
  // ==========================================

  @Patch(':id/submit-approval')
  @Roles('PM')
  async submitForApproval(
    @Param('id')
    id: string,

    @User()
    user: IUser,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(user.id, id);

    const data = await this.userSprintService.submitForApproval(id);

    return {
      statusCode: 200,

      message: 'Đã gửi yêu cầu phân bổ để phê duyệt',

      data,
    };
  }

  // ==========================================
  // CANCEL REQUEST
  //
  // DELETE /user-sprint/:id/request
  // ==========================================

  @Delete(':id/request')
  @Roles('PM')
  async cancelRequest(
    @Param('id')
    id: string,

    @User()
    user: IUser,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(user.id, id);

    const data = await this.userSprintService.cancelRequest(id);

    return {
      statusCode: 200,

      message: 'Đã hủy yêu cầu phân bổ',

      data,
    };
  }

  // ==========================================
  // APPROVE ALLOCATION
  //
  // PATCH /user-sprint/:id
  //
  // Current business flow:
  //
  // PENDING_APPROVAL
  //        ↓
  //     ASSIGNED
  //
  // Service vẫn chịu trách nhiệm state machine
  // và capacity re-check.
  // ==========================================

  @Patch(':id/retry-invitation')
  @Roles('PM')
  async retrySprintInvitation(
    @Param('id') id: string,
    @Body() body: RetrySprintInvitationDto,
    @User() user: IUser,
  ) {
    await this.pmAccessService.assertAllocationAccess(user.id, id);

    const data = await this.sprintAllocationRetryService.retry(
      id,
      body.percentage,
    );

    return {
      statusCode: 200,
      message: 'Đã gửi lại lời mời Sprint tới Dev',
      data,
    };
  }

  @Patch(':id')
  @Roles('PM')
  async updateUserSprintStatus(
    @Param('id')
    id: string,

    @Body()
    body: UpdateUserSprintStatusDto,

    @User()
    user: IUser,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(user.id, id);

    // ========================================
    // BASIC STATUS PAYLOAD
    // ========================================

    // ========================================
    // BUSINESS STATE MACHINE
    // ========================================

    const data = await this.userSprintService.updateStatus(id, body.status);

    return {
      statusCode: 200,

      message: 'Cập nhật trạng thái phân bổ thành công',

      data,
    };
  }

  // ==========================================
  // RELEASE + REVIEW
  //
  // PATCH /user-sprint/:id/release
  //
  // Service tiếp tục chịu trách nhiệm:
  // - ASSIGNED only
  // - Sprint mutable
  // - unfinished Task ownership guard
  // - review data
  // ==========================================

  @Patch(':id/release')
  @Roles('PM')
  async releaseUser(
    @Param('id')
    id: string,

    @Body()
    body: ReleaseUserSprintDto,

    @User()
    user: IUser,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(user.id, id);

    const data = await this.userSprintService.releaseUser(id, body);

    return {
      statusCode: 200,

      message: 'Giải phóng và đánh giá nhân sự thành công',

      data,
    };
  }

  @Get('user')
  @Roles('DEVELOPER')
  @ResponseMessage('Lấy danh sách phân bổ Sprint của nhân sự thành công')
  async getUserSprints(@User() user: IUser) {
    return await this.userSprintService.getUserSprints(user);
  }
}
