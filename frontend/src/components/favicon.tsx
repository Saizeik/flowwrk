// Favicon.tsx
import React from "react";
import { Link } from "react-router-dom";

type Props = {
  variant?: "light" | "dark";
  subtitle?: string;
  className?: string;
  linkToHome?: boolean;
  showText?: boolean;
};

export default function Favicon({
  variant = "light",
  subtitle = "",
  className = "",
  linkToHome = true,
  showText = false,
}: Props) {
  const subText = variant === "light" ? "text-white/70" : "text-slate-500";

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/favicon.svg"
        alt="flowwrk"
        className="h-9 w-9 rounded-2xl"
        draggable={false}
      />
      {showText ? (
        <div className="leading-tight">
          <div className={`text-[11px] ${subText}`}>{subtitle}</div>
        </div>
      ) : null}
    </div>
  );

  return linkToHome ? <Link to="/">{content}</Link> : content;
}
