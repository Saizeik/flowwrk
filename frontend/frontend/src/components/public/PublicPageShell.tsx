// src/components/public/PublicPageShell.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  rotateSeconds?: number; // set 0 to disable rotation
  children: React.ReactNode;
};

function pickRandom(items: string[], avoid?: string) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];

  let next = items[Math.floor(Math.random() * items.length)];
  if (avoid && next === avoid) {
    next = items[(items.indexOf(next) + 1) % items.length];
  }
  return next;
}

function preload(src: string) {
  return new Promise<void>((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export default function PublicPageShell({ images, rotateSeconds = 12, children }: Props) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);

  const [bg, setBg] = useState<string>(() => pickRandom(safeImages));
  const [ready, setReady] = useState(false);

  // Prevent interval overlap + stale closures
  const bgRef = useRef(bg);
  useEffect(() => {
    bgRef.current = bg;
  }, [bg]);

  // Preload initial bg
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const first = pickRandom(safeImages);
      await preload(first);
      if (cancelled) return;
      setBg(first);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [safeImages]);

  // Rotate bg
  useEffect(() => {
    if (!rotateSeconds || rotateSeconds <= 0) return;
    if (!safeImages.length) return;

    const id = window.setInterval(async () => {
      const next = pickRandom(safeImages, bgRef.current);
      await preload(next);
      setBg(next);
      setReady(true);
    }, rotateSeconds * 1000);

    return () => window.clearInterval(id);
  }, [rotateSeconds, safeImages]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background layer (NO negative z-index) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />

        {/* Right-side image (desktop) */}
        <div className="absolute inset-0 hidden lg:block">
          <div
            className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center"
            style={{
              backgroundImage: ready && bg ? `url(${bg})` : "none",
              filter: "saturate(1.05) contrast(1.05)",
            }}
          />

          {/* Blend it into the left side */}
          <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-black/10 via-black/60 to-black" />
          <div className="absolute inset-y-0 right-0 w-[55%] [background:radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.18),transparent_55%)]" />
        </div>

        {/* Soft sheen/noise */}
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_40%)]" />
      </div>

      {/* Content always above background */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
