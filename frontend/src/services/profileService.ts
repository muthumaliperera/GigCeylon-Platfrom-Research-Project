import { api } from './api';
import { User } from './authService';

// NOTE: Adjust endpoint paths to match your backend if different
// Common patterns: /users/me, /profile, /me

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
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
      return res.data as { url: string };
    }
    if (DEV_LOCAL_AVATAR) {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl };
    }
    throw new Error('AVATAR_UPLOAD_PATH is not configured');
  },
};
