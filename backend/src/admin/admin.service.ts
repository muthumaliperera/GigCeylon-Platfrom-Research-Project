import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Job, JobDocument, JobStatus, ApprovalStatus } from '../schemas/job.schema';
import { PaymentPlan, PaymentPlanDocument } from '../schemas/payment-plan.schema';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(PaymentPlan.name) private planModel: Model<PaymentPlanDocument>,
    @InjectModel(Application.name) private appModel: Model<ApplicationDocument>,
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
    const [totalJobs, activeJobs, completedJobs, pendingApprovalJobs] = await Promise.all([
      this.jobModel.countDocuments(),
      // Active: status active (handle legacy uppercase), not deactivated, and not past deadline
      this.jobModel.countDocuments({
        status: { $in: [JobStatus.ACTIVE, 'ACTIVE'] },
        isActive: true,
        completionDeadline: { $gte: new Date() },
        approvalStatus: { $in: [ApprovalStatus.APPROVED, 'approved'] },
      }),
      // Completed: handle legacy uppercase values
      this.jobModel.countDocuments({ status: { $in: [JobStatus.COMPLETED, 'COMPLETED'] } }),
      // Pending Approval jobs (awaiting admin review) - case-insensitive and trims stray whitespace
      this.jobModel.countDocuments({ approvalStatus: { $regex: /^\s*pending\s*$/i } }),
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
        pendingApproval: pendingApprovalJobs,
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

    // Case-insensitive approval filter that also trims stray whitespace
    const base: any = { approvalStatus: { $regex: new RegExp(`^\\s*${approval}\\s*$`, 'i') } };

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
    // Ensure the job is active and visible after approval
    job.isActive = true;
    job.status = JobStatus.ACTIVE as any;
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

  // Payment Plans
  async listPlans() {
    const items = await this.planModel.find({}).sort({ price: 1, name: 1 }).lean();
    return items;
  }

  async createPlan(body: { name: string; price: number; interval: 'monthly' | 'yearly'; audience: 'job_seeker' | 'talent_connector' | 'both'; subHeader?: string; features?: string[] }) {
    const { name, price, interval, audience, subHeader, features = [] } = body;
    const doc = new this.planModel({ name, price, interval, audience, subHeader, features, isActive: true });
    const saved = await doc.save();
    return saved.toObject();
  }

  async updatePlan(id: string, body: { name?: string; price?: number; interval?: 'monthly' | 'yearly'; audience?: 'job_seeker' | 'talent_connector' | 'both'; subHeader?: string; features?: string[]; isActive?: boolean }) {
    const plan = await this.planModel.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    if (typeof body.name === 'string') plan.name = body.name;
    if (typeof body.price === 'number') plan.price = body.price;
    if (typeof body.interval === 'string') plan.interval = body.interval as any;
    if (typeof body.audience === 'string') plan.audience = body.audience as any;
    if (typeof body.subHeader === 'string') plan.subHeader = body.subHeader;
    if (Array.isArray(body.features)) plan.features = body.features;
    if (typeof body.isActive === 'boolean') plan.isActive = body.isActive;
    await plan.save();
    return plan.toObject();
  }

  async deletePlan(id: string) {
    const res = await this.planModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Plan not found');
    return { id };
  }

  // Reviews (stub): return empty paginated result for now
  async listReviews(params: { search?: string; page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 10 } = params || {};
    return { items: [], total: 0, page, pageSize };
  }

  // Earnings for a seeker: rows of completed applications with job data
  async getSeekerEarnings(seekerId: string) {
    const seekerObjectId = new Types.ObjectId(seekerId);
    // Completed if status is completed OR both parties marked completed
    const pipeline: any[] = [
      { $match: { seekerId: seekerObjectId } },
      {
        $addFields: {
          isCompleted: {
            $or: [
              { $eq: ['$status', ApplicationStatus.COMPLETED] },
              { $and: [{ $ifNull: ['$seekerCompleted', false] }, { $ifNull: ['$connectorCompleted', false] }] },
            ],
          },
        },
      },
      { $match: { isCompleted: true } },
      // Lookup job
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      // Lookup employer (talent connector)
      {
        $lookup: {
          from: 'users',
          localField: 'job.employerId',
          foreignField: '_id',
          as: 'employer',
        },
      },
      { $unwind: { path: '$employer', preserveNullAndEmptyArrays: true } },
      // Compute fields
      {
        $project: {
          _id: 0,
          applicationId: { $toString: '$_id' },
          jobId: { $toString: '$job._id' },
          appliedDate: {
            $ifNull: [
              '$seekerCompletedAt',
              { $ifNull: ['$connectorCompletedAt', '$createdAt'] },
            ],
          },
          jobTitle: '$job.title',
          talentConnector: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$employer.firstName', ''] },
                  ' ',
                  { $ifNull: ['$employer.lastName', ''] },
                ],
              },
            },
          },
          amount: { $ifNull: ['$job.paymentAmount', 0] },
        },
      },
      { $sort: { appliedDate: -1 } },
    ];

    const rows = await this.appModel.aggregate(pipeline).exec();
    return rows.map((r: any) => ({
      appliedDate: r.appliedDate instanceof Date ? r.appliedDate.toISOString() : r.appliedDate,
      jobTitle: r.jobTitle,
      talentConnector: r.talentConnector?.trim(),
      amount: r.amount,
      jobId: r.jobId,
      applicationId: r.applicationId,
    }));
  }
}
