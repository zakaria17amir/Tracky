import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api, { getToken, setToken } from "../lib/api";
import type { User } from "../types";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (next: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, resolve the current user.
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<User>("/user");
        if (active) setUser(data);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const { data } = await api.post<{ user: User; token: string }>("/login", {
      email,
      password,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload: RegisterPayload): Promise<User> {
    const { data } = await api.post<{ user: User; token: string }>(
      "/register",
      payload,
    );
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout(): Promise<void> {
    try {
      await api.post("/logout");
    } catch {
      // Ignore network errors on logout; clear local state regardless.
    }
    setToken(null);
    setUser(null);
  }

  function updateUser(next: User): void {
    setUser(next);
  }

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
