import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsAutoCompleteService } from './applications.autocomplete.service';
import { ApplicationsGateway } from './applications.gateway';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { Feedback, FeedbackSchema } from '../schemas/feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsAutoCompleteService, ApplicationsGateway],
  exports: [ApplicationsService, ApplicationsGateway],
})
export class ApplicationsModule {}
