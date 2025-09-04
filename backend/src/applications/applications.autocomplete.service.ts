import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';
import { Job, JobDocument, JobStatus } from '../schemas/job.schema';
import { ApplicationsGateway } from './applications.gateway';

@Injectable()
export class ApplicationsAutoCompleteService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApplicationsAutoCompleteService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Application.name) private appModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private applicationsGateway: ApplicationsGateway,
  ) {}

  onModuleInit() {
    // Run every 60 seconds
    this.timer = setInterval(() => this.tick().catch(() => {}), 60_000);
    // Also run once on startup after a short delay
    setTimeout(() => this.tick().catch(() => {}), 5_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    const now = Date.now();
    const cutoff = new Date(now - 5 * 60 * 1000); // 5 minutes

    // Find apps where only one side has completed and it's older than cutoff
    const candidates = await this.appModel
      .find({
        status: { $ne: ApplicationStatus.COMPLETED },
        $or: [
          {
            seekerCompleted: true,
            connectorCompleted: false,
            seekerCompletedAt: { $lte: cutoff },
          },
          {
            connectorCompleted: true,
            seekerCompleted: false,
            connectorCompletedAt: { $lte: cutoff },
          },
        ],
      })
      .limit(100)
      .exec();

    if (!candidates.length) return;

    for (const app of candidates) {
      try {
        // Mark the missing side as completed and close the application
        if (app.seekerCompleted && !app.connectorCompleted) {
          app.connectorCompleted = true;
          if (!app.connectorCompletedAt) app.connectorCompletedAt = new Date();
        } else if (app.connectorCompleted && !app.seekerCompleted) {
          app.seekerCompleted = true;
          if (!app.seekerCompletedAt) app.seekerCompletedAt = new Date();
        }
        app.status = ApplicationStatus.COMPLETED;
        await app.save();

        // Emit WebSocket update for auto-completion
        this.applicationsGateway.emitApplicationUpdate(app.jobId.toString(), app);

        // Also mark related job as completed and inactive
        try {
          await this.jobModel.updateOne(
            { _id: app.jobId },
            { $set: { status: JobStatus.COMPLETED as any, isActive: false } },
          );
        } catch (e) {
          // swallow job update errors to not block app completion
        }
      } catch (e) {
        // keep loop going even if one app fails
        this.logger.debug(`Auto-complete failed for app ${app._id}: ${e}`);
      }
    }
  }
}
