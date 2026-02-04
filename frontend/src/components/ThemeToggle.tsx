// src/components/ThemeToggle.tsx
import React from "react";
import { getThemeMode, setThemeMode, ThemeMode } from "../lib/theme";

export default function ThemeToggle() {
  const [mode, setMode] = React.useState<ThemeMode>("system");

  React.useEffect(() => {
    setMode(getThemeMode());
  }, []);

  function change(next: ThemeMode) {
    setMode(next);
    setThemeMode(next);
  }

  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 dark:border-slate-800 dark:bg-slate-900/30">
      {(["system", "light", "dark"] as ThemeMode[]).map((m) => (
        <button
          key={m}
          onClick={() => change(m)}
          className={[
            "px-3 py-1.5 text-xs font-semibold capitalize rounded-lg transition",
            mode === m
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          ].join(" ")}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
