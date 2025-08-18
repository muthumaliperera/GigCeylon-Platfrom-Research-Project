import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplateCategory, TemplateCategorySchema } from '../../schemas/template-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TemplateCategory.name, schema: TemplateCategorySchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
