import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

export type FeedbackRole = 'job_seeker' | 'talent_connector';

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'Application', required: true })
  applicationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: Types.ObjectId;

  @Prop({ required: true, enum: ['job_seeker', 'talent_connector'] })
  fromRole: FeedbackRole;

  @Prop({ required: true, enum: ['job_seeker', 'talent_connector'] })
  toRole: FeedbackRole;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: '' })
  description: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

// Each side can only leave one feedback per application
FeedbackSchema.index({ applicationId: 1, fromUserId: 1 }, { unique: true });
