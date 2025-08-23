import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentPlanDocument = HydratedDocument<PaymentPlan>;

export type PlanInterval = 'monthly' | 'yearly';
export type PlanAudience = 'job_seeker' | 'talent_connector' | 'both';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class PaymentPlan {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, enum: ['monthly', 'yearly'], default: 'monthly' })
  interval: PlanInterval;

  @Prop({ required: true, enum: ['job_seeker', 'talent_connector', 'both'], default: 'both' })
  audience: PlanAudience;

  @Prop({ trim: true })
  subHeader?: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PaymentPlanSchema = SchemaFactory.createForClass(PaymentPlan);
