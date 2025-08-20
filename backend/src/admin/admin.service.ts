import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Job, JobDocument, JobStatus, ApprovalStatus } from '../schemas/job.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  async listUsers(params: { role: 'job_seeker' | 'talent_connector'; search: string; page: number; pageSize: number }) {
    const { role, search, page, pageSize } = params;
    const filter: any = { role };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.max(pageSize, 1))
        .select('firstName lastName email role isActive createdAt')
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    // Add static phone and rate on the fly for UI
    const augmented = items.map((u: any) => ({
      ...u,
      phone: '+94 71 234 5678',
      rate: 1000,
    }));

    return { items: augmented, total, page, pageSize };
  }

  async createUser(body: { firstName: string; lastName: string; email: string; password: string; role: 'job_seeker' | 'talent_connector' }) {
    const { firstName, lastName, email, password, role } = body;

    if (![UserRole.JOB_SEEKER, UserRole.TALENT_CONNECTOR].includes(role as any)) {
      throw new ConflictException('Invalid role');
    }

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = new this.userModel({ firstName, lastName, email, password: hashed, role, isActive: true });
    const saved = await user.save();

    return { id: saved._id, email: saved.email, role: saved.role };
  }

  async updateUser(id: string, body: { firstName?: string; lastName?: string; isActive?: boolean }) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (typeof body.firstName === 'string') user.firstName = body.firstName;
    if (typeof body.lastName === 'string') user.lastName = body.lastName;
    if (typeof body.isActive === 'boolean') user.isActive = body.isActive;

    await user.save();
    return { id: user._id, email: user.email, role: user.role, isActive: user.isActive };
  }

  async toggleActive(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    await user.save();
    return { id: user._id, isActive: user.isActive };
  }

  async getDashboardStats() {
    // Get user counts
    const [totalUsers, totalJobSeekers, totalTalentConnectors] = await Promise.all([
      this.userModel.countDocuments({ role: { $in: [UserRole.JOB_SEEKER, UserRole.TALENT_CONNECTOR] } }),
      this.userModel.countDocuments({ role: UserRole.JOB_SEEKER }),
      this.userModel.countDocuments({ role: UserRole.TALENT_CONNECTOR }),
    ]);

    // Get job counts
    const [totalJobs, activeJobs, completedJobs] = await Promise.all([
      this.jobModel.countDocuments(),
      // Active: status active (handle legacy uppercase), not deactivated, and not past deadline
      this.jobModel.countDocuments({
        status: { $in: [JobStatus.ACTIVE, 'ACTIVE'] },
        isActive: true,
        completionDeadline: { $gte: new Date() },
      }),
      // Completed: handle legacy uppercase values
      this.jobModel.countDocuments({ status: { $in: [JobStatus.COMPLETED, 'COMPLETED'] } }),
    ]);

    return {
      users: {
        total: totalUsers,
        jobSeekers: totalJobSeekers,
        talentConnectors: totalTalentConnectors,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        completed: completedJobs,
      },
    };
  }

  // Jobs: list by approval and optional filters for approved tab
  async listJobs(params: {
    approval: 'pending' | 'approved' | 'rejected';
    filter?: 'all' | 'active' | 'expired' | 'deactivated';
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      approval,
      filter = 'all',
      search = '',
      page = 1,
      pageSize = 10,
    } = params;

    const base: any = { approvalStatus: approval };

    if (search) {
      base.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { specificArea: { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();
    if (approval === 'approved') {
      if (filter === 'active') {
        Object.assign(base, {
          status: { $in: [JobStatus.ACTIVE, 'ACTIVE'] },
          isActive: true,
          completionDeadline: { $gte: now },
        });
      } else if (filter === 'expired') {
        Object.assign(base, {
          $or: [
            { status: { $in: [JobStatus.COMPLETED, 'COMPLETED'] } },
            { completionDeadline: { $lt: now } },
          ],
        });
      } else if (filter === 'deactivated') {
        Object.assign(base, { isActive: false });
      }
    }

    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const [items, total] = await Promise.all([
      this.jobModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.max(pageSize, 1))
        .populate('employerId', 'firstName lastName email')
        .lean(),
      this.jobModel.countDocuments(base),
    ]);

    return { items, total, page, pageSize };
  }

  async approveJob(jobId: string) {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    job.approvalStatus = ApprovalStatus.APPROVED;
    job.rejectedReason = undefined;
    await job.save();
    return { id: job._id, approvalStatus: job.approvalStatus };
  }

  async rejectJob(jobId: string, reason: string) {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    job.approvalStatus = ApprovalStatus.REJECTED;
    job.rejectedReason = reason || 'No reason provided';
    // Optionally deactivate rejected jobs
    job.isActive = false;
    await job.save();
    return { id: job._id, approvalStatus: job.approvalStatus, rejectedReason: job.rejectedReason };
  }

  // One-time utility: mark existing jobs as pending approval if field missing
  async migrateJobsApproval() {
    const res = await this.jobModel.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: ApprovalStatus.PENDING }, $unset: { rejectedReason: 1 } }
    );
    return { matched: res.matchedCount ?? (res as any).n ?? 0, modified: res.modifiedCount ?? (res as any).nModified ?? 0 };
  }

  // Danger: clear all jobs (admin only, use with caution)
  async clearAllJobs() {
    const res = await this.jobModel.deleteMany({});
    // For Mongoose <6 compat
    const deleted = (res as any).deletedCount ?? (res as any).n ?? 0;
    return { deleted };
  }
}
