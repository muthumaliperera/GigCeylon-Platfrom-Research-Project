import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Request,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJobDto } from '../dto/create-job.dto';
import { JobStatus } from '../schemas/job.schema';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(JwtAuthGuard)
  async createJob(@Body() createJobDto: CreateJobDto, @Request() req) {
    return await this.jobsService.createJob(createJobDto, req.user._id);
  }

  @Get('my-jobs')
  @UseGuards(JwtAuthGuard)
  async getMyJobs(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.jobsService.getJobsByEmployer(req.user._id, page, limit);
  }



  @Get('active')
  async getActiveJobs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('location') location?: string,
  ) {
    return await this.jobsService.getActiveJobs(page, limit, category, location);
  }

  // Public list for landing page: show active + completed (expired) jobs
  @Get('public')
  async getPublicJobs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('location') location?: string,
  ) {
    return await this.jobsService.getPublicJobs(page, limit, category, location);
  }

  // All jobs for landing page: show all jobs regardless of status
  @Get('all')
  async getAllJobs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('location') location?: string,
  ) {
    return await this.jobsService.getAllJobs(page, limit, category, location);
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return await this.jobsService.getJobById(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(JwtAuthGuard)
  async updateJob(
    @Param('id') id: string,
    @Body() updateJobDto: Partial<CreateJobDto>,
    @Request() req,
  ) {
    return await this.jobsService.updateJob(id, updateJobDto, req.user._id, req.user.role);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateJobStatus(
    @Param('id') id: string,
    @Body('status') status: JobStatus,
    @Request() req,
  ) {
    return await this.jobsService.updateJobStatus(id, status, req.user._id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteJob(@Param('id') id: string, @Request() req) {
    return await this.jobsService.deleteJob(id, req.user._id, req.user.role);
  }
}