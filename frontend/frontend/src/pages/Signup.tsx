import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Lock, UserPlus, Github, Chrome } from "lucide-react";
import { supabase } from "../lib/supabase";



function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) return setError(error.message);

    // If email confirmations are enabled, session might be null.
    if (!data.session) {
      navigate("/login");
      return;
    }

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
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT */}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <span className="h-8 w-8 rounded-2xl bg-blue-600" />
              JobTrack
            </Link>

            <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Start tracking applications in minutes.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => oauth("google")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
                disabled={loading}
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => oauth("github")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
                disabled={loading}
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/15" />
              <div className="text-xs font-medium text-white/70">or</div>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <form onSubmit={signUp} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 focus-within:ring-2 focus-within:ring-blue-400">
                  <Mail className="h-4 w-4 text-white/60" />
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
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 focus-within:ring-2 focus-within:ring-blue-400">
                  <Lock className="h-4 w-4 text-white/60" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="mt-2 text-xs text-white/70">Use 8+ characters.</div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
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
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating..." : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-sm text-white/80">
                Already have an account?{" "}
                <Link className="font-semibold text-white hover:underline" to="/login">
                  Sign in
                </Link>
              </div>
            </form>
          </div>

          {/* RIGHT */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="text-sm font-semibold text-white">
                Clean pipeline. Clear next steps.
              </div>
              <div className="mt-2 text-sm text-white/75">
                Track stages, follow-ups, and offers — without clutter.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">
                Seattle-focused open jobs feed + pipeline tracking.
              </div>
              <div className="mt-2 text-sm text-white/75">
                Automatic refresh. One place to stay consistent.
              </div>
              <div className="mt-4 text-xs text-white/60">JobTrack • Vercel + Supabase</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
