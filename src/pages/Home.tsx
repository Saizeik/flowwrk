import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

import BrandLogo from "../components/BrandLogo";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl",
        "transition hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-600/10 p-2 text-blue-700 ring-1 ring-blue-200/50">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Bright aurora background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        <div className="absolute -top-24 left-[-80px] h-[420px] w-[420px] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute top-16 right-[-120px] h-[420px] w-[420px] rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[20%] h-[460px] w-[460px] rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-60" />
      </div>

      {/* Top nav (public) */}
      <div className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <BrandLogo linkToHome={false} size="md" variant="lockup" />
            </Link>
            <div className="hidden sm:block leading-tight">
              <div className="text-[11px] text-slate-500">Track applications. Stay sane.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Clean, modern pipeline tracking
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Your job search,
              <span className="text-blue-700"> organized</span>.
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Track applications, salary ranges, follow-ups, and offers — with a workflow
              that stays fast and simple.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Create your account <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
              >
                Sign in
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                "Kanban + list view",
                "Salary range tracking",
                "Seattle-area open jobs feed",
                "Analytics that match your pipeline",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t}
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white/60 p-4">
              <div className="text-xs font-semibold text-slate-900">Why this works</div>
              <div className="mt-1 text-sm text-slate-600">
                You always know what to do next — apply, follow up, prep interviews —
                without drowning in tabs and spreadsheets.
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="text-sm font-semibold text-slate-900">
              Inspired by Simplify / Huntr / Teal — but cleaner.
            </div>
            <div className="mt-2 text-sm text-slate-600">
              A focused home page that matches the dashboard design you already have.
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <FeatureCard
                icon={LayoutGrid}
                title="Pipeline you can feel"
                desc="Drag cards across statuses. Keep it clean. Keep it moving."
              />
              <FeatureCard
                icon={Briefcase}
                title="Open jobs feed"
                desc="A curated list that refreshes automatically — no searching required."
              />
              <FeatureCard
                icon={BarChart3}
                title="Analytics that align"
                desc="Your charts match your statuses — no weird mismatches."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Secure by default"
                desc="Supabase Auth + OAuth options when you’re ready."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-slate-200/60 pt-6 sm:flex-row">
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} Flowwrk
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="text-slate-600 hover:text-slate-900" to="/login">
              Sign in
            </Link>
            <Link className="text-slate-600 hover:text-slate-900" to="/signup">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
