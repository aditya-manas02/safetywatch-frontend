import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";

interface UserData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  roles: string[];
  hasAreaCode?: boolean;
  areaCode?: string;
  profilePicture?: string;
  isSuspended?: boolean;
  suspensionExpiresAt?: string | Date;
}

export interface RateLimitInfo {
  remaining: number;
  resetIn: string;
  total: number;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: Error | null; rateLimit?: RateLimitInfo }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; needsVerification?: boolean; requireSuperAdminOtp?: boolean; email?: string }>;
  signInWithGoogle: (idToken: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<{ error: Error | null; tempPassword?: string; rateLimit?: RateLimitInfo }>;
  verifyOtp: (email: string, otp: string) => Promise<{ error: Error | null }>;
  resendOtp: (email: string) => Promise<{ error: Error | null; rateLimit?: RateLimitInfo }>;
  verifySuperAdminOtp: (email: string, otp: string) => Promise<{ error: Error | null }>;
  resendSuperAdminOtp: (email: string) => Promise<{ error: Error | null; rateLimit?: RateLimitInfo }>;
  refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        setIsAdmin(parsed.roles?.includes("admin") || parsed.roles?.includes("superadmin"));
        setIsSuperAdmin(parsed.roles?.includes("superadmin"));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    setIsLoading(false);
  }, []);

  // ---------------------------
  // SIGN UP (Node backend)
  // ---------------------------
  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    console.log("Auth API Call [SignUp] using Base URL:", API_BASE);

    try {
      const resp = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await resp.json();
      if (!resp.ok) return {
        error: new Error(data.message || "Sign-up failed"),
        rateLimit: data.rateLimit
      };

      return { error: null, rateLimit: data.rateLimit };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // SIGN IN (Node backend)
  // ---------------------------
  const signIn = async (email: string, password: string) => {
    // Clear any existing stale state before a new attempt
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);

    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        return {
          error: new Error(data.message || "Login failed"),
          needsVerification: data.needsVerification
        };
      }

      if (data.requireSuperAdminOtp) {
        return {
          error: null,
          requireSuperAdminOtp: true,
          email: data.email
        };
      }

      // Save token + user
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setIsAdmin(data.user.roles?.includes("admin") || data.user.roles?.includes("superadmin"));
      setIsSuperAdmin(data.user.roles?.includes("superadmin"));

      // Register FCM token for push notifications (best-effort, non-blocking)
      import("@/lib/fcm").then(({ registerFcmToken }) => {
        registerFcmToken(data.token).catch(() => {});
      });

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // SIGN IN WITH GOOGLE
  // ---------------------------
  const signInWithGoogle = async (idToken: string) => {
    // Clear any existing state before a new attempt
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);

    try {
      const resp = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        return {
          error: new Error(data.message || "Google Login failed")
        };
      }

      // Save token + user
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setIsAdmin(data.user.roles?.includes("admin") || data.user.roles?.includes("superadmin"));
      setIsSuperAdmin(data.user.roles?.includes("superadmin"));

      // Register FCM token for push notifications (best-effort, non-blocking)
      import("@/lib/fcm").then(({ registerFcmToken }) => {
        registerFcmToken(data.token).catch(() => {});
      });

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // VERIFY OTP
  // ---------------------------
  const verifyOtp = async (email: string, otp: string) => {
    if (!API_BASE) {
      return { error: new Error("Server configuration error: Base API URL is missing.") };
    }

    try {
      const resp = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await resp.json();
      if (!resp.ok) return { error: new Error(data.message || "Verification failed") };

      // Save token + user
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setIsAdmin(data.user.roles?.includes("admin") || data.user.roles?.includes("superadmin"));
      setIsSuperAdmin(data.user.roles?.includes("superadmin"));

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // RESEND OTP
  // ---------------------------
  const resendOtp = async (email: string) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json();
      if (!resp.ok) return {
        error: new Error(data.message || "Failed to resend OTP"),
        rateLimit: data.rateLimit
      };

      return { error: null, rateLimit: data.rateLimit };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // VERIFY SUPERADMIN OTP
  // ---------------------------
  const verifySuperAdminOtp = async (email: string, otp: string) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/verify-superadmin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await resp.json();
      if (!resp.ok) return { error: new Error(data.message || "Verification failed") };

      // Save token + user
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setIsAdmin(data.user.roles?.includes("admin") || data.user.roles?.includes("superadmin"));
      setIsSuperAdmin(data.user.roles?.includes("superadmin"));

      return { error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // RESEND SUPERADMIN OTP
  // ---------------------------
  const resendSuperAdminOtp = async (email: string) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/resend-superadmin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json();
      if (!resp.ok) return {
        error: new Error(data.message || "Failed to resend OTP"),
        rateLimit: data.rateLimit
      };

      return { error: null, rateLimit: data.rateLimit };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // FORGOT PASSWORD
  // ---------------------------
  const forgotPassword = async (email: string) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...VERSION_HEADERS
        },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json();
      if (!resp.ok) return {
        error: new Error(data.details || data.message || "Request failed"),
        rateLimit: data.rateLimit
      };

      return { error: null, rateLimit: data.rateLimit };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      return { error };
    }
  };

  // ---------------------------
  // REFRESH USER (after area code assignment)
  // ---------------------------
  const refreshUser = async () => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        setIsAdmin(parsed.roles?.includes("admin") || parsed.roles?.includes("superadmin"));
        setIsSuperAdmin(parsed.roles?.includes("superadmin"));
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  // ---------------------------
  // SIGN OUT
  // ---------------------------
  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    // Absolute Redirection: Force full page reload to clear all React state
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        isSuperAdmin,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        forgotPassword,
        verifyOtp,
        resendOtp,
        verifySuperAdminOtp,
        resendSuperAdminOtp,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
