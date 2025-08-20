import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job, JobDocument, JobStatus, ApprovalStatus } from '../schemas/job.schema';
import { UserRole } from '../schemas/user.schema';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}
  private readonly logger = new Logger(JobsService.name);

  async createJob(createJobDto: CreateJobDto, employerId: string) {
    const newJob = new this.jobModel({
      ...createJobDto,
      employerId,
      completionDeadline: new Date(createJobDto.completionDeadline),
    });

    const savedJob = await newJob.save() as JobDocument;
    return this.getJobById((savedJob._id as unknown as string).toString());
  }

  async getJobsByEmployer(employerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const jobs = await this.jobModel
      .find({ employerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employerId', 'firstName lastName email')
      .exec();

    const total = await this.jobModel.countDocuments({ employerId });

    return {
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Public: list jobs visible on landing page (active + expired/completed)
  async getPublicJobs(page: number = 1, limit: number = 10, category?: string, location?: string) {
    const skip = (page - 1) * limit;

    // Public feed: show only ACTIVE and COMPLETED (expired) jobs.
    // Include uppercase variants to handle legacy/invalid values saved without validation.
    const filter: any = {
      status: { $in: [JobStatus.ACTIVE, JobStatus.COMPLETED, 'ACTIVE', 'COMPLETED'] },
      approvalStatus: { $in: [ApprovalStatus.APPROVED, 'approved'] },
    };

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { specificArea: { $regex: location, $options: 'i' } },
      ];
    }

    const jobs = await this.jobModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employerId', 'firstName lastName')
      .exec();

    const total = await this.jobModel.countDocuments(filter);

    return {
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // All jobs for landing page: show all jobs except cancelled
  async getAllJobs(page: number = 1, limit: number = 10, category?: string, location?: string) {
    const skip = (page - 1) * limit;

    // Filter out cancelled jobs from landing page
    const filter: any = {
      status: { $ne: JobStatus.CANCELLED },
      approvalStatus: { $in: [ApprovalStatus.APPROVED, 'approved'] },
    };

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { specificArea: { $regex: location, $options: 'i' } },
      ];
    }

    const jobs = await this.jobModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employerId', 'firstName lastName')
      .exec();

    const total = await this.jobModel.countDocuments(filter);

    return {
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getJobById(jobId: string) {
    const job = await this.jobModel
      .findById(jobId)
      .populate('employerId', 'firstName lastName email')
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  private isOwnerOrAdmin(job: any, userId: string, role?: UserRole | string) {
    if (role === UserRole.ADMIN) return true;
    const employer = (job as any).employerId;
    const employerId = typeof employer === 'string'
      ? employer
      : employer?._id?.toString?.() ?? employer?.toString?.();
    const userIdStr = (userId as any)?.toString ? (userId as any).toString() : String(userId);
    return employerId === userIdStr;
  }

  async updateJob(jobId: string, updateData: Partial<CreateJobDto>, userId: string, role?: UserRole | string) {
    const job = await this.jobModel.findById(jobId);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.isOwnerOrAdmin(job, userId, role)) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    const updatedJob = await this.jobModel
      .findByIdAndUpdate(
        jobId,
        { 
          ...updateData,
          completionDeadline: updateData.completionDeadline ? new Date(updateData.completionDeadline) : job.completionDeadline
        },
        { new: true }
      )
      .populate('employerId', 'firstName lastName email')
      .exec();

    return updatedJob;
  }

  async deleteJob(jobId: string, userId: string, role?: UserRole | string) {
    this.logger.debug(`DeleteJob called jobId=${jobId} userId=${userId} role=${role}`);
    const job = await this.jobModel.findById(jobId);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.isOwnerOrAdmin(job, userId, role)) {
      this.logger.warn(`Delete forbidden. employerId=${(job as any).employerId?.toString?.() || (job as any).employerId} userId=${userId} role=${role}`);
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.jobModel.findByIdAndDelete(jobId);
    return { message: 'Job deleted successfully' };
  }

  async updateJobStatus(jobId: string, status: JobStatus, userId: string, role?: UserRole | string) {
    this.logger.debug(`UpdateJobStatus called jobId=${jobId} status=${status} userId=${userId} role=${role}`);
    const job = await this.jobModel.findById(jobId);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.isOwnerOrAdmin(job, userId, role)) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    const updatedJob = await this.jobModel
      .findByIdAndUpdate(jobId, { status }, { new: true })
      .populate('employerId', 'firstName lastName email')
      .exec();

    return updatedJob;
  }

  async getActiveJobs(page: number = 1, limit: number = 10, category?: string, location?: string) {
    const skip = (page - 1) * limit;
    
    const filter: any = { 
      status: JobStatus.ACTIVE,
      isActive: true,
      completionDeadline: { $gte: new Date() },
      approvalStatus: { $in: [ApprovalStatus.APPROVED, 'approved'] },
    };

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { specificArea: { $regex: location, $options: 'i' } }
      ];
    }

    const jobs = await this.jobModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employerId', 'firstName lastName')
      .exec();

    const total = await this.jobModel.countDocuments(filter);

    return {
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }


}