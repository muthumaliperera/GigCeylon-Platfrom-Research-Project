import { Body, Controller, Get, Post, Query, UseGuards, Req, ForbiddenException, Patch, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private ensureAdmin(req: any) {
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access only');
    }
  }

  @Get('users')
  async listUsers(
    @Req() req: any,
    @Query('role') role: 'job_seeker' | 'talent_connector',
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    this.ensureAdmin(req);
    return this.adminService.listUsers({ role, search, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
  }

  @Post('users')
  async createUser(
    @Req() req: any,
    @Body() body: { firstName: string; lastName: string; email: string; password: string; role: 'job_seeker' | 'talent_connector' },
  ) {
    this.ensureAdmin(req);
    return this.adminService.createUser(body);
  }

  @Patch('users/:id')
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; isActive?: boolean },
  ) {
    this.ensureAdmin(req);
    return this.adminService.updateUser(id, body);
  }

  @Patch('users/:id/deactivate')
  async deactivateUser(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.toggleActive(id);
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Req() req: any) {
    this.ensureAdmin(req);
    return this.adminService.getDashboardStats();
  }

  // Jobs approval listing
  @Get('jobs')
  async listJobs(
    @Req() req: any,
    @Query('approval') approval: 'pending' | 'approved' | 'rejected',
    @Query('filter') filter: 'all' | 'active' | 'expired' | 'deactivated' = 'all',
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    this.ensureAdmin(req);
    return this.adminService.listJobs({
      approval,
      filter,
      search,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  // Approve a job
  @Patch('jobs/:id/approve')
  async approveJob(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.approveJob(id);
  }

  // Reject a job with reason
  @Patch('jobs/:id/reject')
  async rejectJob(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    this.ensureAdmin(req);
    return this.adminService.rejectJob(id, body?.reason || '');
  }

  // One-time migration to set approvalStatus on legacy jobs
  @Post('jobs/migrate-approval')
  async migrateJobsApproval(@Req() req: any) {
    this.ensureAdmin(req);
    return this.adminService.migrateJobsApproval();
  }

  // Reviews
  @Get('reviews')
  async listReviews(
    @Req() req: any,
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    this.ensureAdmin(req);
    return this.adminService.listReviews({
      search,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  // Danger: clear all jobs (requires explicit confirmation)
  @Post('jobs/clear')
  async clearAllJobs(@Req() req: any, @Body() body: { confirm: boolean }) {
    this.ensureAdmin(req);
    if (!body || body.confirm !== true) {
      throw new ForbiddenException('Confirmation required to clear all jobs. Send {"confirm": true}.');
    }
    return this.adminService.clearAllJobs();
  }

  // Payment Plans
  @Get('plans')
  async listPlans(@Req() req: any) {
    this.ensureAdmin(req);
    return this.adminService.listPlans();
  }

  @Post('plans')
  async createPlan(
    @Req() req: any,
    @Body()
    body: { name: string; price: number; interval: 'monthly' | 'yearly'; audience: 'job_seeker' | 'talent_connector' | 'both'; subHeader?: string; features?: string[] },
  ) {
    this.ensureAdmin(req);
    return this.adminService.createPlan(body);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: { name?: string; price?: number; interval?: 'monthly' | 'yearly'; audience?: 'job_seeker' | 'talent_connector' | 'both'; subHeader?: string; features?: string[]; isActive?: boolean },
  ) {
    this.ensureAdmin(req);
    return this.adminService.updatePlan(id, body);
  }

  @Delete('plans/:id')
  async deletePlan(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.deletePlan(id);
  }

  // Earnings for a specific job seeker
  @Get('users/:id/earnings')
  async getSeekerEarnings(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.getSeekerEarnings(id);
  }
}
