import { api } from './api';
import { User } from './authService';

// NOTE: Adjust endpoint paths to match your backend if different
// Common patterns: /users/me, /profile, /me

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  // For seeker: `bio`; for connector: backend expects `connectorBio`
  bio?: string;
  connectorBio?: string;
  servicesLookingFor?: string[];
  skillsLookingFor?: string[];
  profileImageUrl?: string;
}

const PROFILE_UPDATE_PATH = process.env.REACT_APP_PROFILE_UPDATE_PATH; // e.g. '/users/me'
const AVATAR_UPLOAD_PATH = process.env.REACT_APP_AVATAR_UPLOAD_PATH;   // e.g. '/users/me/avatar'
const DEV_LOCAL_AVATAR = (process.env.REACT_APP_DEV_LOCAL_AVATAR || 'false').toLowerCase() === 'true';

export const profileCapabilities = {
  hasProfileEndpoint: !!PROFILE_UPDATE_PATH,
  hasAvatarEndpoint: !!AVATAR_UPLOAD_PATH,
  devLocalAvatar: DEV_LOCAL_AVATAR,
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const profileService = {
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    if (!PROFILE_UPDATE_PATH) {
      throw new Error('PROFILE_UPDATE_PATH is not configured');
    }
    const res = await api.patch(PROFILE_UPDATE_PATH, payload);
    return res.data as User;
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    if (AVATAR_UPLOAD_PATH) {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(AVATAR_UPLOAD_PATH, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || {};
      const url: string | undefined = data.url || data.profilePhotoUrl || data.imageUrl || data.location;
      if (!url) {
        throw new Error('Avatar upload succeeded but no URL returned. Expected one of: url, profilePhotoUrl, imageUrl, location');
      }
      return { url };
    }
    if (DEV_LOCAL_AVATAR) {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl };
    }
    throw new Error('AVATAR_UPLOAD_PATH is not configured');
  },
  
  // New concrete profile APIs matching backend
  async getMyProfile(): Promise<any> {
    const res = await api.get('/profile/me', {
      params: { _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    return res.data;
  },

  async putMyProfile(payload: any): Promise<any> {
    // Accepts the new structured payload (languages with levels, workingHours, etc.)
    const res = await api.put('/profile', payload);
    return res.data;
  },

  async getPublicProfile(userId: string): Promise<any> {
    const res = await api.get(`/profiles/${userId}/public`);
    return res.data;
  },

  async listPublicProfiles(params: { role?: 'job_seeker' | 'talent_connector'; q?: string; page?: number; limit?: number } = {}): Promise<{ total: number; page: number; limit: number; items: any[] }> {
    const res = await api.get('/profiles/public', { params });
    return res.data;
  },
};

// Optional TS shapes you can import in components/forms
export type LanguageOther = { name: string; level: number }; // 0-10
export type Languages = { sinhala?: number; tamil?: number; english?: number; other?: LanguageOther[] };
export type WorkingHoursSingle = { start: string; end: string };
export type WorkingHoursWeekly = { days: Array<{ day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'; ranges: Array<{ start: string; end: string }> }> };
export type WorkingHours = { mode: 'single'|'weekly'; single?: WorkingHoursSingle; weekly?: WorkingHoursWeekly };
export type Rate = { amount: number; unit: 'hour'|'day'|'week'|'month'; currency: 'LKR' };
