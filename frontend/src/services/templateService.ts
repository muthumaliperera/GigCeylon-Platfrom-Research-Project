import { api } from './api';

export type TemplateType = 'micro' | 'small_scale' | 'professional_part_time';

export interface TemplateCategoryDto {
  _id: string;
  type: TemplateType;
  name: string;
  jobs: string[];
  requirements: string[];
}

export const templateService = {
  list: async (type: TemplateType): Promise<TemplateCategoryDto[]> => {
    const res = await api.get('/templates', { params: { type } });
    return res.data;
  },
  createCategory: async (type: TemplateType, name: string): Promise<TemplateCategoryDto> => {
    const res = await api.post('/templates', { type, name });
    return res.data;
  },
  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/templates/${id}`);
    return res.data;
  },
  addJob: async (id: string, name: string): Promise<TemplateCategoryDto> => {
    const res = await api.post(`/templates/${id}/jobs`, { name });
    return res.data;
  },
  removeJob: async (id: string, index: number): Promise<TemplateCategoryDto> => {
    const res = await api.delete(`/templates/${id}/jobs/${index}`);
    return res.data;
  },
  addRequirement: async (id: string, text: string): Promise<TemplateCategoryDto> => {
    const res = await api.post(`/templates/${id}/requirements`, { text });
    return res.data;
  },
  removeRequirement: async (id: string, index: number): Promise<TemplateCategoryDto> => {
    const res = await api.delete(`/templates/${id}/requirements/${index}`);
    return res.data;
  },
};
