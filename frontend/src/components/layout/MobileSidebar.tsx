import React, { useEffect } from "react";
import Sidebar from "./Sidebar";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  // Lock body scroll when drawer is open (mobile polish)
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={
        "fixed inset-0 z-50 lg:hidden " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className={
          "absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity " +
          (open ? "opacity-100" : "opacity-0")
        }
        aria-label="Close sidebar backdrop"
        tabIndex={open ? 0 : -1}
      />

      {/* Drawer */}
      <div
        className={
          "absolute inset-y-0 left-0 w-72 max-w-[85vw] transform bg-white shadow-xl transition-transform duration-200 ease-out " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
        role="dialog"
        aria-modal="true"
      >
        {/* ✅ Close drawer after navigation */}
        <Sidebar variant="drawer" onClose={onClose} onNavigate={onClose} />
      </div>
    </div>
  );
}
