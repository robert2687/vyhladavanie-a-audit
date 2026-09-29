import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { safeFetchJson } from "../utils/api";

export interface AuthUser {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  auth_provider: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const processedHash = useRef(false);

  useEffect(() => {
    const bootstrap = async () => {
      // 1) Returning from Google OAuth: exchange session_id (in URL fragment) first.
      const hash = window.location.hash || "";
      if (hash.includes("session_id=") && !processedHash.current) {
        processedHash.current = true;
        const sessionId = new URLSearchParams(hash.replace(/^#/, "")).get("session_id");
        try {
          const data = await safeFetchJson<{ success?: boolean; user?: AuthUser }>(
            "/api/auth/google/session",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionId }),
            }
          );
          if (data.user) setUser(data.user);
        } catch {
          // ignore; will fall back to /me
        } finally {
          // Clean the fragment so it isn't reused.
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }

      // 2) Verify any existing session server-side.
      try {
        const me = await safeFetchJson<AuthUser>("/api/auth/me");
        if (me && me.user_id) setUser(me);
      } catch {
        setUser((prev) => prev); // keep whatever google exchange set (or null)
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await safeFetchJson<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await safeFetchJson<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setUser(data.user);
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await safeFetchJson("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
