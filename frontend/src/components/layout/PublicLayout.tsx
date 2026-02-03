// src/components/layout/PublicLayout.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import PublicPageShell from "../public/PublicPageShell";
import { PUBLIC_IMAGES } from "../public/publicImages";

export default function PublicLayout() {
  const location = useLocation();

  // Optional: different rotate speeds per page
  const rotateSeconds =
    location.pathname === "/" ? 14 : location.pathname === "/login" ? 10 : 12;

  return (
    <PublicPageShell images={PUBLIC_IMAGES} rotateSeconds={rotateSeconds}>
      <Outlet />
    </PublicPageShell>
  );
}
