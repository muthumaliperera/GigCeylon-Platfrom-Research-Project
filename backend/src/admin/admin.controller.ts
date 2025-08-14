import { Body, Controller, Get, Post, Query, UseGuards, Req, ForbiddenException, Patch, Param } from '@nestjs/common';
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
}
