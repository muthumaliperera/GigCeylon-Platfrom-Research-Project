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

  // Ensure jobs past their completionDeadline are marked as EXPIRED
  private async enforceExpiry() {
    // Define end-of-today so that any job due today is considered expired
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    // 1) Expire documents where completionDeadline is a Date and is on/before today
    await this.jobModel.updateMany(
      {
        completionDeadline: { $lte: endOfToday },
        status: { $ne: JobStatus.EXPIRED },
      },
      { $set: { status: JobStatus.EXPIRED, isActive: false, manuallyClosed: false, closedBy: null, closedAt: null } as any }
    );

    // 2) Expire documents where completionDeadline might be stored as a string
    //    Use $expr with $toDate to safely compare string dates
    await this.jobModel.updateMany(
      {
        status: { $ne: JobStatus.EXPIRED },
        $expr: { $lte: [ { $toDate: "$completionDeadline" }, endOfToday ] },
      } as any,
      { $set: { status: JobStatus.EXPIRED, isActive: false, manuallyClosed: false, closedBy: null, closedAt: null } as any }
    );
  }

  // Public method to trigger expiry enforcement on demand (e.g., admin endpoint)
  async enforceExpiryNow(): Promise<{ updated: number }> {
    // Run same logic as enforceExpiry, but collect modified counts
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const r1: any = await this.jobModel.updateMany(
      {
        completionDeadline: { $lte: endOfToday },
        status: { $ne: JobStatus.EXPIRED },
      },
      { $set: { status: JobStatus.EXPIRED, isActive: false, manuallyClosed: false, closedBy: null, closedAt: null } as any }
    );

    const r2: any = await this.jobModel.updateMany(
      {
        status: { $ne: JobStatus.EXPIRED },
        $expr: { $lte: [ { $toDate: "$completionDeadline" }, endOfToday ] },
      } as any,
      { $set: { status: JobStatus.EXPIRED, isActive: false, manuallyClosed: false, closedBy: null, closedAt: null } as any }
    );

    const m1 = typeof r1?.modifiedCount === 'number' ? r1.modifiedCount : (r1?.nModified || 0);
    const m2 = typeof r2?.modifiedCount === 'number' ? r2.modifiedCount : (r2?.nModified || 0);
    return { updated: (m1 || 0) + (m2 || 0) };
  }

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
    await this.enforceExpiry();
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
    await this.enforceExpiry();
    const skip = (page - 1) * limit;

    // Public feed: show only ACTIVE and EXPIRED/COMPLETED jobs.
    // Include uppercase variants to handle legacy/invalid values saved without validation.
    const filter: any = {
      status: { $in: [JobStatus.ACTIVE, JobStatus.EXPIRED, JobStatus.COMPLETED, 'ACTIVE', 'EXPIRED', 'COMPLETED'] },
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
    await this.enforceExpiry();
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
    await this.enforceExpiry();
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

    // Normalize approval status if client attempts to set it (e.g., resubmission flow)
    const patch: any = {
      ...updateData,
      completionDeadline: updateData.completionDeadline ? new Date(updateData.completionDeadline) : job.completionDeadline,
    };
    const incomingApproval = (updateData as any)?.approvalStatus;
    if (typeof incomingApproval === 'string') {
      const v = incomingApproval.toString().trim().toLowerCase();
      if (v === 'pending') {
        patch.approvalStatus = ApprovalStatus.PENDING;
        patch.rejectedReason = undefined;
        // Ensure re-activation when resubmitting after rejection
        patch.isActive = true;
      } else if (v === 'approved') {
        patch.approvalStatus = ApprovalStatus.APPROVED;
        patch.rejectedReason = undefined;
      } else if (v === 'rejected') {
        patch.approvalStatus = ApprovalStatus.REJECTED;
      }
    }

    const updatedJob = await this.jobModel
      .findByIdAndUpdate(jobId, patch, { new: true })
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

    // Business rules:
    // - Only allow manual close when current status is ACTIVE
    // - When manually closing: set status EXPIRED, isActive false, manuallyClosed true, closedBy and closedAt
    // - Re-open allowed only if current status is EXPIRED and completionDeadline > now
    // - On reopen: set status ACTIVE, isActive true, manuallyClosed false, clear closed fields
    const now = new Date();
    const currentStatus = (job.status || JobStatus.ACTIVE).toString().toLowerCase();
    const requested = (status || JobStatus.ACTIVE).toString().toLowerCase();

    if (requested === JobStatus.EXPIRED) {
      if (currentStatus !== JobStatus.ACTIVE) {
        throw new ForbiddenException('Only active jobs can be manually closed');
      }
      const patch: any = {
        status: JobStatus.EXPIRED,
        isActive: false,
        manuallyClosed: true,
        closedBy: userId as any,
        closedAt: now,
      };
      const updatedJob = await this.jobModel
        .findByIdAndUpdate(jobId, patch, { new: true })
        .populate('employerId', 'firstName lastName email')
        .exec();
      return updatedJob;
    }

    if (requested === JobStatus.ACTIVE) {
      const deadline = new Date(job.completionDeadline);
      if (currentStatus !== JobStatus.EXPIRED) {
        throw new ForbiddenException('Only expired jobs can be re-opened');
      }
      if (deadline.getTime() <= Date.now()) {
        throw new ForbiddenException('Cannot re-open a job after its deadline');
      }
      const patch: any = {
        status: JobStatus.ACTIVE,
        isActive: true,
        manuallyClosed: false,
        closedBy: null,
        closedAt: null,
      };
      const updatedJob = await this.jobModel
        .findByIdAndUpdate(jobId, patch, { new: true })
        .populate('employerId', 'firstName lastName email')
        .exec();
      return updatedJob;
    }

    // For other statuses, just update directly
    const updatedJob = await this.jobModel
      .findByIdAndUpdate(jobId, { status }, { new: true })
      .populate('employerId', 'firstName lastName email')
      .exec();
    return updatedJob;
  }

  async getActiveJobs(page: number = 1, limit: number = 10, category?: string, location?: string) {
    await this.enforceExpiry();
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