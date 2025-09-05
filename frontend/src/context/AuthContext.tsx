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
  profile: any | null;
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfile] = useState<any | null>(null);
  // Prevent StrictMode double-invocation from re-running init logic in dev
  const didInitRef = React.useRef(false);

  useEffect(() => {
    if (didInitRef.current) return; // guard against StrictMode double mount
    didInitRef.current = true;

    // Check if user is logged in on app start
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      try { setProfile(JSON.parse(storedProfile)); } catch {}
    }

    // If we have a token, hydrate profile with throttling to avoid redundant /me
    const token = authService.getToken?.();
    if (token) {
      const now = Date.now();
      const lastHydratedStr = localStorage.getItem("profile_cached_at");
      const lastHydrated = lastHydratedStr ? parseInt(lastHydratedStr, 10) : 0;
      const TTL = 30_000; // 30s, aligned with profileService default
      const shouldFetch = !storedProfile || now - lastHydrated > TTL;
      if (shouldFetch) {
        (async () => {
          try {
            const prof = await profileService.getMyProfile();
            setProfile(prof);
            localStorage.setItem("profile", JSON.stringify(prof));
            localStorage.setItem("profile_cached_at", String(Date.now()));
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
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      // Hydrate from /profile/me first, then set user ONCE to avoid flicker
      let next: User = response.user as User;
      try {
        const prof = await profileService.getMyProfile();
        setProfile(prof);
        localStorage.setItem("profile", JSON.stringify(prof));
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
        setProfile(prof);
        localStorage.setItem("profile", JSON.stringify(prof));
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

  const refreshProfile = async () => {
    try {
      const prof = await profileService.getMyProfile();
      setProfile(prof);
      localStorage.setItem("profile", JSON.stringify(prof));
      if (prof?.profilePhotoUrl) {
        setUser((prev) => {
          const base = prev || authService.getCurrentUser();
          if (!base) return prev;
          const next: User = { ...base, profileImageUrl: prof.profilePhotoUrl } as User;
          localStorage.setItem("user", JSON.stringify(next));
          return next;
        });
      }
    } catch (_) {
      // ignore refresh errors
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    updateUser,
    profile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
