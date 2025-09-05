import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from './user.schema';

export type ProfileDocument = Profile & Document;

export type LanguageOther = { name: string; level: number };

export type Languages = {
  sinhala?: number; // 0-10
  tamil?: number;   // 0-10
  english?: number; // 0-10
  other?: LanguageOther[]; // array of { name, level 0-10 }
};

export type WorkingHoursSingle = { start: string; end: string };
export type WorkingHoursWeekly = {
  days: Array<{
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
    ranges: Array<{ start: string; end: string }>;
  }>;
};

export type WorkingHours = {
  mode: 'single' | 'weekly';
  single?: WorkingHoursSingle;
  weekly?: WorkingHoursWeekly;
};

export type Rate = {
  amount: number; // e.g., 600
  unit: 'hour' | 'day' | 'week' | 'month';
  currency: 'LKR';
};

export type DocumentType = {
  url: string;
  filename: string;
  type: 'cv' | 'certificate' | 'other';
};

@Schema({ _id: false })
class LanguageOtherSchemaClass implements LanguageOther {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, min: 0, max: 10 }) level: number;
}
const LanguageOtherSchema = SchemaFactory.createForClass(LanguageOtherSchemaClass);

@Schema({ _id: false })
class LanguagesSchemaClass implements Languages {
  @Prop({ min: 0, max: 10 }) sinhala?: number;
  @Prop({ min: 0, max: 10 }) tamil?: number;
  @Prop({ min: 0, max: 10 }) english?: number;
  @Prop({ type: [LanguageOtherSchema], default: [] }) other?: LanguageOther[];
}
const LanguagesSchema = SchemaFactory.createForClass(LanguagesSchemaClass);

@Schema({ _id: false })
class WorkingHoursSingleSchemaClass implements WorkingHoursSingle {
  @Prop() start: string;
  @Prop() end: string;
}
const WorkingHoursSingleSchema = SchemaFactory.createForClass(WorkingHoursSingleSchemaClass);

@Schema({ _id: false })
class TmpDay {
  @Prop({ required: true, type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] })
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  @Prop({ type: [{ start: String, end: String }], default: [] }) ranges: Array<{ start: string; end: string }>;
}
const TmpDaySchema = SchemaFactory.createForClass(TmpDay);

@Schema({ _id: false })
class WorkingHoursWeeklySchemaClass implements WorkingHoursWeekly {
  @Prop({
    type: [TmpDaySchema],
    default: [],
  })
  days: Array<{ day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'; ranges: Array<{ start: string; end: string }> }>;
}
const WorkingHoursWeeklySchema = SchemaFactory.createForClass(WorkingHoursWeeklySchemaClass);

@Schema({ _id: false })
class WorkingHoursSchemaClass implements WorkingHours {
  @Prop({ required: true, enum: ['single', 'weekly'] }) mode: 'single' | 'weekly';
  @Prop({ type: WorkingHoursSingleSchema }) single?: WorkingHoursSingle;
  @Prop({ type: WorkingHoursWeeklySchema }) weekly?: WorkingHoursWeekly;
}
const WorkingHoursSchema = SchemaFactory.createForClass(WorkingHoursSchemaClass);

@Schema({ _id: false })
class SeekerProfileSubDoc {
  @Prop({ type: WorkingHoursSchema }) workingHours?: WorkingHours;
  @Prop({ type: { amount: Number, unit: { type: String, enum: ['hour','day','week','month'] }, currency: { type: String, enum: ['LKR'], default: 'LKR' } } })
  rate?: Rate;
  @Prop({ type: [String], default: [] }) jobTitles: string[];
  @Prop() bio?: string; // sanitized HTML
  @Prop({ type: [String], default: [] }) services?: string[];
  @Prop({ type: [String], default: [] }) skills?: string[];
  @Prop({ 
    type: [{ 
      url: { type: String, required: true }, 
      filename: { type: String, required: true }, 
      type: { type: String, enum: ['cv', 'certificate', 'other'], required: true } 
    }], 
    default: [] 
  }) 
  documents?: DocumentType[];
}
const SeekerProfileSchema = SchemaFactory.createForClass(SeekerProfileSubDoc);

@Schema({ _id: false })
class ConnectorProfileSubDoc {
  @Prop() bio?: string; // sanitized HTML
  @Prop({ type: [String], default: [] }) servicesLookingFor?: string[];
  @Prop({ type: [String], default: [] }) skillsLookingFor?: string[];
}
const ConnectorProfileSchema = SchemaFactory.createForClass(ConnectorProfileSubDoc);

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop() profilePhotoUrl?: string;

  @Prop({ type: LanguagesSchema })
  languages?: Languages;

  @Prop({ type: SeekerProfileSchema, default: undefined })
  seeker?: SeekerProfileSubDoc;

  @Prop({ type: ConnectorProfileSchema, default: undefined })
  connector?: ConnectorProfileSubDoc;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.index({ userId: 1 }, { unique: true });
