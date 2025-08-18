import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;


export enum JobType {
  MICRO = 'micro',
  SMALL_SCALE = 'small_scale',
  PROFESSIONAL_PART_TIME = 'professional_part_time',
}

export enum PaymentType {
  CASH = 'cash',
  ONLINE = 'online',
  BOTH = 'both',
}

export enum JobStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  PLATFORM_MESSAGE = 'platform_message',
}

export enum Urgency {
  URGENT = 'urgent',
  NOT_URGENT = 'not_urgent',
}

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  title: string;

  // Category is a free-form string managed by admin-defined template categories
  @Prop({ required: true })
  category: string;

  // Optional job type for additional classification
  @Prop({ required: false, enum: JobType })
  jobType?: JobType;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  specificArea: string;

  @Prop({ required: true })
  expectedDuration: string;

  @Prop({ required: true })
  completionDeadline: Date;

  @Prop({ required: true, enum: PaymentType })
  paymentType: PaymentType;

  @Prop({ required: true })
  paymentAmount: number;

  @Prop({ required: true })
  basicRequirements: string;

  @Prop({ required: true })
  whatYouProvide: string;

  @Prop({ required: true, enum: ContactMethod })
  preferredContactMethod: ContactMethod;

  @Prop({ required: true, enum: Urgency })
  urgency: Urgency;

  @Prop()
  additionalNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employerId: Types.ObjectId;

  @Prop({ default: JobStatus.ACTIVE, enum: JobStatus })
  status: JobStatus;

  @Prop({ default: 0 })
  applicationsCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const JobSchema = SchemaFactory.createForClass(Job);