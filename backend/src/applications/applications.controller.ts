import { Body, Controller, Get, Param, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationsService } from './applications.service';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly apps: ApplicationsService) {}

  // Seeker applies to a job
  @Post('jobs/:jobId/apply')
  async apply(
    @Req() req: any,
    @Param('jobId') jobId: string,
    @Body() body: { name?: string; email?: string; phone?: string; bio?: string; skills?: string[]; services?: string[]; otherInfo?: string },
  ) {
    if (!req.user || req.user.role !== 'job_seeker') {
      throw new ForbiddenException('Job seeker access only');
    }
    return this.apps.apply(jobId, req.user.userId || req.user._id, body || {});
  }

  // List applications for a job (talent connector or admin)
  @Get('jobs/:jobId')
  async listForJob(@Req() req: any, @Param('jobId') jobId: string) {
    if (!req.user || (req.user.role !== 'talent_connector' && req.user.role !== 'admin')) {
      throw new ForbiddenException('Not allowed');
    }
    return this.apps.listForJob(jobId);
  }

  // Seeker: my applications
  @Get('me')
  async myApplications(@Req() req: any) {
    if (!req.user || req.user.role !== 'job_seeker') {
      throw new ForbiddenException('Job seeker access only');
    }
    return this.apps.listForSeeker(req.user.userId || req.user._id);
  }

  // Talent connector actions
  @Post(':id/shortlist')
  async shortlist(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'talent_connector') {
      throw new ForbiddenException('Talent connector access only');
    }
    return this.apps.shortlist(id);
  }

  @Post(':id/reject')
  async reject(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'talent_connector') {
      throw new ForbiddenException('Talent connector access only');
    }
    return this.apps.reject(id);
  }

  @Post(':id/confirm')
  async confirmByConnector(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'talent_connector') {
      throw new ForbiddenException('Talent connector access only');
    }
    return this.apps.confirmByConnector(id);
  }

  // Seeker actions
  @Post(':id/confirm-by-seeker')
  async confirmBySeeker(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'job_seeker') {
      throw new ForbiddenException('Job seeker access only');
    }
    return this.apps.confirmBySeeker(id);
  }

  // Seeker rejection
  @Post(':id/reject-by-seeker')
  async rejectBySeeker(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'job_seeker') {
      throw new ForbiddenException('Job seeker access only');
    }
    return this.apps.rejectBySeeker(id);
  }

  // Completion (both sides can call their respective endpoint)
  @Post(':id/complete/seeker')
  async completeBySeeker(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'job_seeker') {
      throw new ForbiddenException('Job seeker access only');
    }
    return this.apps.markCompleted(id, 'seeker');
  }

  @Post(':id/complete/connector')
  async completeByConnector(@Req() req: any, @Param('id') id: string) {
    if (!req.user || req.user.role !== 'talent_connector') {
      throw new ForbiddenException('Talent connector access only');
    }
    return this.apps.markCompleted(id, 'connector');
  }
}
