import React, { useMemo } from "react";
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
import Favicon from "../components/favicon";





function cx(...parts: Array<string | false | undefined>) {
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
    <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl hover:bg-white/15 transition">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-500/20 p-2 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/80">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

 

  return (
    <>
      {/* Top nav (public) */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
           
            <div className="leading-tight">
            <div className="text-[11px] text-white/70">
                Track applications. Stay sane.
              </div>
            </div>
            <Link to="/" className="inline-flex items-center gap-2">
  <Favicon linkToHome={false} className="shrink-0" />
  <BrandLogo linkToHome={false} size="md" className="-ml-1" />
</Link>
              
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
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
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-4 w-4" />
              Clean, modern pipeline tracking
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Your job search,
              <span className="text-blue-200"> organized</span>.
            </h1>

            <p className="mt-4 text-lg text-white/80">
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
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
                <div key={t} className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {t}
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-4">
              <div className="text-xs font-semibold text-white">Why this works</div>
              <div className="mt-1 text-sm text-white/80">
                You always know what to do next — apply, follow up, prep interviews —
                without drowning in tabs and spreadsheets.
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="text-sm font-semibold text-white">
              Inspired by Simplify / Huntr / Teal — but cleaner.
            </div>
            <div className="mt-2 text-sm text-white/80">
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
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <div className="text-sm text-white/70">© {new Date().getFullYear()} JobTrack</div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="text-white/80 hover:text-white" to="/login">
              Sign in
            </Link>
            <Link className="text-white/80 hover:text-white" to="/signup">
              Create account
            </Link>
          </div>
        </div>
      </div>
  
    </>
  );
}
