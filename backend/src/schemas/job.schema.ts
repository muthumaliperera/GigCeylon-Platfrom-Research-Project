import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobCategory {
  TUTORING = 'tutoring',
  RETAIL_SALES = 'retail_sales',
  DELIVERY_SERVICES = 'delivery_services',
  DATA_ENTRY = 'data_entry',
  CUSTOMER_SERVICE = 'customer_service',
  CONTENT_WRITING = 'content_writing',
  GRAPHIC_DESIGN = 'graphic_design',
  SOCIAL_MEDIA = 'social_media',
  EVENT_ASSISTANCE = 'event_assistance',
  CLEANING_SERVICES = 'cleaning_services',
  OTHER = 'other',
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

  @Prop({ required: true, enum: JobCategory })
  category: JobCategory;

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