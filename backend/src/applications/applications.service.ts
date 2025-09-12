import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';
import { Job, JobDocument, JobStatus } from '../schemas/job.schema';
import { ApplicationsGateway } from './applications.gateway';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private appModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
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
