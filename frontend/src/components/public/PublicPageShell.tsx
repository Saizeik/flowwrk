// src/components/public/PublicPageShell.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  rotateSeconds?: number; // set 0 to disable rotation
  children: React.ReactNode;

  /**
   * Optional: if you still have a couple screens that use white-on-dark content
   * you can flip this. Default is LIGHT.
   */
  tone?: "light" | "dark";
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

export default function PublicPageShell({
  images,
  rotateSeconds = 12,
  tone = "light",
  children,
}: Props) {
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

  const isLight = tone === "light";

  return (
    <div className={isLight ? "min-h-screen text-slate-900" : "min-h-screen text-slate-900"}>
      {/* Background layer */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Base canvas */}
        {isLight ? (
          <>
            {/* Light foundation */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />

            {/* Aurora blobs */}
            <div className="absolute -top-24 left-[-90px] h-[460px] w-[460px] rounded-full bg-blue-500/14 blur-3xl" />
            <div className="absolute top-10 right-[-130px] h-[460px] w-[460px] rounded-full bg-violet-500/14 blur-3xl" />
            <div className="absolute bottom-[-140px] left-[20%] h-[520px] w-[520px] rounded-full bg-emerald-500/12 blur-3xl" />

            {/* Subtle grid texture */}
            <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:22px_22px]" />
          </>
        ) : (
          <>
            {/* Dark foundation (optional mode) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
            <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_40%)]" />
          </>
        )}

        {/* Right-side image (desktop) */}
        <div className="absolute inset-0 hidden lg:block">
          <div
            className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center"
            style={{
              backgroundImage: ready && bg ? `url(${bg})` : "none",

              /**
               * LIGHT MODE IMAGE TREATMENT:
               * wash it out + soften contrast so it feels airy.
               */
              filter: isLight
                ? "saturate(1.05) contrast(0.95) brightness(1.08)"
                : "saturate(1.05) contrast(1.05)",
            }}
          />

          {/* Blend the image into the left side */}
          {isLight ? (
            <>
              {/* White fade from the image into the page */}
              <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-white/10 via-white/70 to-white" />

              {/* Soft color washes on top of image */}
              <div className="absolute inset-y-0 right-0 w-[55%] [background:radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(circle_at_70%_25%,rgba(139,92,246,0.12),transparent_55%)]" />

              {/* Gentle highlight sheen */}
              <div className="absolute inset-y-0 right-0 w-[55%] opacity-70 [background:radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.75),transparent_45%)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-black/10 via-black/60 to-black" />
              <div className="absolute inset-y-0 right-0 w-[55%] [background:radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.18),transparent_55%)]" />
            </>
          )}
        </div>
      </div>

      {/* Content above background */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
