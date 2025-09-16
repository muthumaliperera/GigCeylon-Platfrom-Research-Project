import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';
import { Job, JobDocument, JobStatus } from '../schemas/job.schema';
import { ApplicationsGateway } from './applications.gateway';
import { Feedback, FeedbackDocument } from '../schemas/feedback.schema';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private appModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    private applicationsGateway: ApplicationsGateway,
  ) {}

  async apply(jobId: string, seekerId: string, payload: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    skills?: string[];
    services?: string[];
    otherInfo?: string;
  }) {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.ACTIVE) throw new ForbiddenException('Job is not accepting applications');

    // Prevent duplicate active applications
    const existing = await this.appModel.findOne({ jobId: job._id, seekerId: new Types.ObjectId(seekerId) });
    if (existing) return existing; // idempotent

    const app = await this.appModel.create({
      jobId: job._id,
      seekerId: new Types.ObjectId(seekerId),
      status: ApplicationStatus.APPLIED,
      ...payload,
    });

    // increment applicationsCount
    await this.jobModel.updateOne({ _id: job._id }, { $inc: { applicationsCount: 1 } });

    return app;
  }

  // Create or update feedback for an application by the acting user (seeker or connector)
  async leaveFeedback(params: {
    applicationId: string;
    actorUserId: string;
    actorRole: 'job_seeker' | 'talent_connector';
    rating: number;
    description?: string;
  }) {
    const { applicationId, actorUserId, actorRole, rating, description } = params;
    if (rating < 1 || rating > 5) throw new ForbiddenException('Rating must be between 1 and 5');

    const app = await this.appModel.findById(applicationId);
    if (!app) throw new NotFoundException('Application not found');
    const job = await this.jobModel.findById(app.jobId);
    if (!job) throw new NotFoundException('Job not found');

    // Verify that the actor is part of this application/job
    const actorObjectId = new Types.ObjectId(actorUserId);
    if (actorRole === 'job_seeker') {
      if (!app.seekerId.equals(actorObjectId)) {
        throw new ForbiddenException('You are not the applicant for this job');
      }
    } else {
      if (!job.employerId || !new Types.ObjectId(job.employerId as any).equals(actorObjectId)) {
        throw new ForbiddenException('You are not the talent connector for this job');
      }
    }

    // Only allow feedback after job is completed
    // Accept if:
    //  - application status is COMPLETED, or
    //  - both sides have marked completion, or
    //  - related job status is COMPLETED (for historical data where app status wasn't updated)
    const isCompleted =
      app.status === ApplicationStatus.COMPLETED ||
      (app.seekerCompleted && app.connectorCompleted) ||
      (job.status === JobStatus.COMPLETED as any);
    if (!isCompleted) throw new ForbiddenException('Feedback allowed only after job completion');

    const fromRole = actorRole;
    const toRole = actorRole === 'job_seeker' ? 'talent_connector' : 'job_seeker';
    const toUserId = actorRole === 'job_seeker' ? new Types.ObjectId(job.employerId as any) : new Types.ObjectId(app.seekerId);

    // Upsert single feedback per side per application
    const res = await this.feedbackModel.findOneAndUpdate(
      { applicationId: app._id, fromUserId: actorObjectId },
      {
        $set: {
          applicationId: app._id,
          jobId: app.jobId,
          fromUserId: actorObjectId,
          toUserId,
          fromRole,
          toRole,
          rating,
          description: description || '',
        },
      },
      { new: true, upsert: true }
    );

    return res;
  }

  async getFeedbackForApplication(applicationId: string) {
    const list = await this.feedbackModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .sort({ createdAt: -1 })
      .lean();
    return list;
  }

  async listForJob(jobId: string) {
    // Auto-expire: any shortlisted offers older than 24h for this job are marked rejected
    await this.autoExpireShortlisted({ jobId: new Types.ObjectId(jobId) });
    return this.appModel
      .find({ jobId: new Types.ObjectId(jobId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async listForSeeker(seekerId: string) {
    // Auto-expire: any shortlisted offers older than 24h for this seeker are marked rejected
    await this.autoExpireShortlisted({ seekerId: new Types.ObjectId(seekerId) });
    return this.appModel
      .find({ seekerId: new Types.ObjectId(seekerId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateStatus(appId: string, status: ApplicationStatus) {
    const app = await this.appModel.findById(appId);
    if (!app) throw new NotFoundException('Application not found');
    app.status = status;
    await app.save();
    
    // Emit WebSocket update
    this.applicationsGateway.emitApplicationUpdate(app.jobId.toString(), app);
    
    return app;
  }

  async shortlist(appId: string) { return this.updateStatus(appId, ApplicationStatus.SHORTLISTED); }
  async reject(appId: string) { return this.updateStatus(appId, ApplicationStatus.REJECTED); }
  async confirmByConnector(appId: string) { return this.updateStatus(appId, ApplicationStatus.CONFIRMED); }

  // Seeker-initiated rejection (only allowed when currently shortlisted)
  async rejectBySeeker(appId: string) {
    const app = await this.appModel.findById(appId);
    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== ApplicationStatus.SHORTLISTED) {
      // No-op if not shortlisted to avoid breaking flow
      return app;
    }
    app.status = ApplicationStatus.REJECTED;
    await app.save();
    this.applicationsGateway.emitApplicationUpdate(app.jobId.toString(), app);
    return app;
  }

  async confirmBySeeker(appId: string) {
    const app = await this.appModel.findById(appId);
    if (!app) throw new NotFoundException('Application not found');
    app.status = ApplicationStatus.CONFIRMED;
    await app.save();
    
    // Emit WebSocket update
    this.applicationsGateway.emitApplicationUpdate(app.jobId.toString(), app);
    
    return app;
  }

  async markCompleted(appId: string, by: 'seeker' | 'connector') {
    const app = await this.appModel.findById(appId);
    if (!app) throw new NotFoundException('Application not found');
    if (by === 'seeker') {
      app.seekerCompleted = true;
      if (!app.seekerCompletedAt) app.seekerCompletedAt = new Date();
    } else {
      app.connectorCompleted = true;
      if (!app.connectorCompletedAt) app.connectorCompletedAt = new Date();
    }
    // If both complete -> completed
    if (app.seekerCompleted && app.connectorCompleted) {
      app.status = ApplicationStatus.COMPLETED;
      // Also mark related job as completed and deactivate
      try {
        await this.jobModel.updateOne(
          { _id: app.jobId },
          { $set: { status: JobStatus.COMPLETED as any, isActive: false } }
        );
      } catch (e) {
        // swallow job update error to not block app completion
      }
    }
    await app.save();
    
    // Emit WebSocket update
    this.applicationsGateway.emitApplicationUpdate(app.jobId.toString(), app);
    
    return app;
  }

  // Helper: auto-expire shortlisted > 24h based on filter
  private async autoExpireShortlisted(filter: Partial<{ jobId: Types.ObjectId; seekerId: Types.ObjectId }>) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q: any = { status: ApplicationStatus.SHORTLISTED, updatedAt: { $lte: twentyFourHoursAgo } };
    if (filter.jobId) q.jobId = filter.jobId;
    if (filter.seekerId) q.seekerId = filter.seekerId;
    const stale = await this.appModel.find(q);
    if (!stale.length) return;
    for (const app of stale) {
      app.status = ApplicationStatus.REJECTED;
      await app.save();
      this.applicationsGateway.emitApplicationUpdate(app.jobId.toString(), app);
    }
  }
}
