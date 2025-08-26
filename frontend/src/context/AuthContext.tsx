import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, authService } from "../services/authService";
import { profileService } from "../services/profileService";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (next: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // If we have a token, sync avatar from /profile/me to ensure profileImageUrl is present after re-login
    const token = authService.getToken?.();
    if (token) {
      (async () => {
        try {
          const prof = await profileService.getMyProfile();
          if (prof?.profilePhotoUrl) {
            setUser((prev) => {
              const base = prev || authService.getCurrentUser();
              if (!base) return prev; // nothing to merge
              const next: User = { ...base, profileImageUrl: prof.profilePhotoUrl } as User;
              localStorage.setItem("user", JSON.stringify(next));
              return next;
            });
          }
        } catch (_) {
          // ignore
        }
      })();
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      // Hydrate from /profile/me first, then set user ONCE to avoid flicker
      let next: User = response.user as User;
      try {
        const prof = await profileService.getMyProfile();
        if (prof?.profilePhotoUrl) {
          next = { ...next, profileImageUrl: prof.profilePhotoUrl } as User;
        }
      } catch (_) {
        // ignore fetch errors; proceed with base user
      }
      setUser(next);
      localStorage.setItem("user", JSON.stringify(next));
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      // Hydrate from /profile/me first, then set user ONCE to avoid flicker
      let next: User = response.user as User;
      try {
        const prof = await profileService.getMyProfile();
        if (prof?.profilePhotoUrl) {
          next = { ...next, profileImageUrl: prof.profilePhotoUrl } as User;
        }
      } catch (_) {
        // ignore fetch errors; proceed with base user
      }
      setUser(next);
      localStorage.setItem("user", JSON.stringify(next));
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    return new Promise((resolve) => {
      setUser(null);
      localStorage.removeItem("token");
      authService.logout();
      setTimeout(() => {
        resolve();
      }, 0);
    });
  };

  const updateUser = (next: User) => {
    setUser(next);
    localStorage.setItem("user", JSON.stringify(next));
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
