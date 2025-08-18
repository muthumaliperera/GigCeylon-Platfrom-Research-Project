import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateCategory, TemplateCategory as TemplateCategoryDoc } from '../../schemas/template-category.schema';

export type TemplateType = 'micro' | 'small_scale' | 'professional_part_time';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(TemplateCategory.name)
    private readonly templateModel: Model<TemplateCategoryDoc>,
  ) {}

  async list(type?: TemplateType) {
    const query: Partial<Record<string, any>> = {};
    if (type) query.type = type;
    return this.templateModel.find(query).sort({ createdAt: 1 }).lean();
  }

  async createCategory(type: TemplateType, name: string) {
    const doc = await this.templateModel.create({ type, name });
    return doc.toObject();
  }

  async deleteCategory(id: string) {
    await this.templateModel.findByIdAndDelete(id);
    return { message: 'Deleted' };
  }

  async addJob(id: string, name: string) {
    const doc = await this.templateModel.findById(id);
    if (!doc) throw new NotFoundException('Category not found');
    doc.jobs.push(name);
    await doc.save();
    return doc.toObject();
  }

  async removeJob(id: string, index: number) {
    const doc = await this.templateModel.findById(id);
    if (!doc) throw new NotFoundException('Category not found');
    if (index >= 0 && index < doc.jobs.length) {
      doc.jobs.splice(index, 1);
      await doc.save();
    }
    return doc.toObject();
  }

  async addRequirement(id: string, text: string) {
    const doc = await this.templateModel.findById(id);
    if (!doc) throw new NotFoundException('Category not found');
    doc.requirements.push(text);
    await doc.save();
    return doc.toObject();
  }

  async removeRequirement(id: string, index: number) {
    const doc = await this.templateModel.findById(id);
    if (!doc) throw new NotFoundException('Category not found');
    if (index >= 0 && index < doc.requirements.length) {
      doc.requirements.splice(index, 1);
      await doc.save();
    }
    return doc.toObject();
  }
}
