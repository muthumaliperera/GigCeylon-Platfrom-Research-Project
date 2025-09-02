import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';
import { Job, JobDocument, JobStatus } from '../schemas/job.schema';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private appModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
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
    return this.appModel
      .find({ jobId: new Types.ObjectId(jobId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async listForSeeker(seekerId: string) {
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
    return app;
  }

  async shortlist(appId: string) { return this.updateStatus(appId, ApplicationStatus.SHORTLISTED); }
  async reject(appId: string) { return this.updateStatus(appId, ApplicationStatus.REJECTED); }
  async confirmByConnector(appId: string) { return this.updateStatus(appId, ApplicationStatus.CONFIRMED); }

  async confirmBySeeker(appId: string) {
    const app = await this.appModel.findById(appId);
    if (!app) throw new NotFoundException('Application not found');
    app.status = ApplicationStatus.CONFIRMED;
    await app.save();
    return app;
  }

  async markCompleted(appId: string, by: 'seeker' | 'connector') {
    const app = await this.appModel.findById(appId);
    if (!app) throw new NotFoundException('Application not found');
    if (by === 'seeker') app.seekerCompleted = true; else app.connectorCompleted = true;
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
    return app;
  }
}
