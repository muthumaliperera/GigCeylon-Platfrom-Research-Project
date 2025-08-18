import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TemplateType = 'micro' | 'small_scale' | 'professional_part_time';

@Schema({ timestamps: true })
export class TemplateCategory extends Document {
  @Prop({ type: String, required: true, enum: ['micro', 'small_scale', 'professional_part_time'] })
  type: TemplateType;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  jobs: string[];

  @Prop({ type: [String], default: [] })
  requirements: string[];
}

export const TemplateCategorySchema = SchemaFactory.createForClass(TemplateCategory);
