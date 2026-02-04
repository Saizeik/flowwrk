// /providers/authprovider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type OAuthProvider = "google" | "github" | "linkedin_oidc";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getSiteUrl() {
  // For Vite + Vercel, you can optionally set VITE_PUBLIC_SITE_URL
  // Example: http://localhost:3000  (local)
  //          https://yourdomain.com (prod)
  const envUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  return envUrl || window.location.origin;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      session,
      loading,

      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },

      async signUpWithPassword(email, password) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },

      async signInWithProvider(provider) {
        const siteUrl = getSiteUrl();
        const redirectTo = `${siteUrl}/auth/callback`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            // optional: ask user to pick account each time
            // queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
          },
        });

        if (error) throw error;
        console.log("OAuth redirectTo =", redirectTo);
      },
      

      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    };
  }, [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
