import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { TemplatesService, TemplateType } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Get()
  async list(@Query('type') type?: TemplateType) {
    return this.service.list(type);
  }

  @Post()
  async createCategory(@Body() body: { type: TemplateType; name: string }) {
    return this.service.createCategory(body.type, body.name);
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Post(':id/jobs')
  async addJob(@Param('id') id: string, @Body() body: { name: string }) {
    return this.service.addJob(id, body.name);
  }

  @Delete(':id/jobs/:index')
  async removeJob(@Param('id') id: string, @Param('index') index: string) {
    return this.service.removeJob(id, Number(index));
  }

  @Post(':id/requirements')
  async addRequirement(@Param('id') id: string, @Body() body: { text: string }) {
    return this.service.addRequirement(id, body.text);
  }

  @Delete(':id/requirements/:index')
  async removeRequirement(@Param('id') id: string, @Param('index') index: string) {
    return this.service.removeRequirement(id, Number(index));
  }
}
