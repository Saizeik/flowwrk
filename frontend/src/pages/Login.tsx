import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, Chrome, ArrowRight, Mail, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import BrandLogo from "../components/BrandLogo";
import Favicon from "../components/favicon";





function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setError(error.message);
    navigate("/dashboard");
  };

  const oauth = async (provider: "google" | "github") => {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <>
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <Link to="/" className="inline-flex items-center gap-2">
  <Favicon linkToHome={false} className="shrink-0" />
  <BrandLogo linkToHome={false} size="md" className="-ml-1" />
</Link>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

            <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-white/75">Sign in to continue tracking your applications.</p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => oauth("google")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                disabled={loading}
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => oauth("github")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                disabled={loading}
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-xs font-medium text-white/60">or</div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={signIn} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <Mail className="h-4 w-4 text-white/50" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white">Password</label>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <Lock className="h-4 w-4 text-white/50" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={cx(
                  "w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700",
                  loading && "opacity-70"
                )}
              >
                {loading ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-sm text-white/75">
                Don’t have an account?{" "}
                <Link className="font-semibold text-white hover:underline" to="/signup">
                  Create one
                </Link>
              </div>
            </form>
          </div>

          {/* RIGHT */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="text-sm font-semibold text-white">Your pipeline, calm and clear.</div>
              <div className="mt-2 text-sm text-white/75">
                Track stages, salary ranges, follow-ups, and offers — without clutter.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">“The first tracker that didn’t feel like a chore.”</div>
              <div className="mt-2 text-sm text-white/75">— JobTrack users</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
