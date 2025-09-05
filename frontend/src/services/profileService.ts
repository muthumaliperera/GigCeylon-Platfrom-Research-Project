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

// Lightweight in-memory cache and in-flight dedupe for `/profile/me`
let __myProfileCache: any | null = null;
let __myProfileCachedAt = 0;
let __myProfileInflight: Promise<any> | null = null;
const DEFAULT_PROFILE_TTL_MS = 30_000; // 30 seconds

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
  async getMyProfile(options?: { force?: boolean; ttlMs?: number }): Promise<any> {
    const { force = false, ttlMs = DEFAULT_PROFILE_TTL_MS } = options || {};
    const now = Date.now();

    // Serve from cache if fresh and not forced
    if (!force && __myProfileCache && now - __myProfileCachedAt < ttlMs) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[profileService] getMyProfile -> cache hit');
      }
      return __myProfileCache;
    }

    // If there's an in-flight request, piggyback on it
    if (!force && __myProfileInflight) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[profileService] getMyProfile -> piggybacking in-flight');
        }
        const data = await __myProfileInflight;
        return data;
      } catch (e) {
        // fallthrough to new request
      }
    }

    // Make a new request and remember it as in-flight
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[profileService] getMyProfile -> network request');
    }
    __myProfileInflight = api.get('/profile/me').then((res) => res.data);
    try {
      const data = await __myProfileInflight;
      __myProfileCache = data;
      __myProfileCachedAt = Date.now();
      return data;
    } finally {
      __myProfileInflight = null;
    }
  },

  async putMyProfile(payload: any): Promise<any> {
    // Accepts the new structured payload (languages with levels, workingHours, etc.)
    const res = await api.put('/profile', payload);
    const data = res.data;
    // Invalidate or refresh cache so next getMyProfile reflects latest server state
    __myProfileCache = null;
    __myProfileCachedAt = 0;
    return data;
  },

  async getPublicProfile(userId: string): Promise<any> {
    const res = await api.get(`/profiles/${userId}/public`);
    return res.data;
  },

  async listPublicProfiles(params: { role?: 'job_seeker' | 'talent_connector'; q?: string; page?: number; limit?: number } = {}): Promise<{ total: number; page: number; limit: number; items: any[] }> {
    const res = await api.get('/profiles/public', { params });
    return res.data;
  },

  async uploadDocument(file: File, documentType: 'cv' | 'certificate' | 'other' = 'cv'): Promise<{ url: string; filename: string; type: string }> {
    const form = new FormData();
    form.append('document', file);
    form.append('documentType', documentType);
    
    try {
      const res = await api.post('/profile/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = res.data || {};
      const url: string | undefined = data.url || data.documentUrl || data.location;
      const filename: string = data.filename || file.name;
      
      if (!url) {
        throw new Error('Document upload succeeded but no URL returned');
      }
      
      // Invalidate profile cache to ensure fresh data on next fetch
      __myProfileCache = null;
      __myProfileCachedAt = 0;
      
      return { url, filename, type: data.type || documentType };
    } catch (error: any) {
      // For development, simulate successful upload
      if (process.env.NODE_ENV === 'development') {
        console.warn('Document upload endpoint not available, using mock response');
        return { 
          url: URL.createObjectURL(file), 
          filename: file.name,
          type: documentType
        };
      }
      throw error;
    }
  },

  async saveDocumentsToProfile(documents: Array<{url: string; filename: string; type: string}>): Promise<void> {
    try {
      await api.put('/profile/documents', { documents });
      // Invalidate profile cache
      __myProfileCache = null;
      __myProfileCachedAt = 0;
    } catch (error: any) {
      // For development, just log the attempt
      if (process.env.NODE_ENV === 'development') {
        console.warn('Save documents endpoint not available');
        return;
      }
      throw error;
    }
  },

  async deleteDocument(documentUrl: string): Promise<void> {
    try {
      await api.delete('/profile/documents', { data: { documentUrl } });
    } catch (error: any) {
      // For development, just log the attempt
      if (process.env.NODE_ENV === 'development') {
        console.warn('Document delete endpoint not available');
        return;
      }
      throw error;
    }
  },
};

// Optional TS shapes you can import in components/forms
export type LanguageOther = { name: string; level: number }; // 0-10
export type Languages = { sinhala?: number; tamil?: number; english?: number; other?: LanguageOther[] };
export type WorkingHoursSingle = { start: string; end: string };
export type WorkingHoursWeekly = { days: Array<{ day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'; ranges: Array<{ start: string; end: string }> }> };
export type WorkingHours = { mode: 'single'|'weekly'; single?: WorkingHoursSingle; weekly?: WorkingHoursWeekly };
export type Rate = { amount: number; unit: 'hour'|'day'|'week'|'month'; currency: 'LKR' };

