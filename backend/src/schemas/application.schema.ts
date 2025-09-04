import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  APPLIED = 'applied',
  SHORTLISTED = 'shortlisted',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seekerId: Types.ObjectId;

  @Prop({ default: ApplicationStatus.APPLIED, enum: ApplicationStatus })
  status: ApplicationStatus;

  // Submitted info snapshot
  @Prop() name?: string;
  @Prop() email?: string;
  @Prop() phone?: string;
  @Prop() bio?: string;
  @Prop({ type: [String], default: [] })
  skills?: string[];
  @Prop({ type: [String], default: [] })
  services?: string[];
  @Prop() otherInfo?: string;

  // Completion flags
  @Prop({ default: false })
  seekerCompleted: boolean;
  @Prop({ default: false })
  connectorCompleted: boolean;
  // When each party marked completion
  @Prop()
  seekerCompletedAt?: Date;
  @Prop()
  connectorCompletedAt?: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
