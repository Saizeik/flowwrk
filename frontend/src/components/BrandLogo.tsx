// BrandLogo.tsx
import React from "react";
import { Link } from "react-router-dom";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "lockup" | "icon" | "wordmark";
  linkToHome?: boolean;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
};

const iconSizeMap = {
  sm: "h-8 w-8",     // sidebar / compact nav
  md: "h-10 w-10",   // top nav (default)
  lg: "h-14 w-14",   // auth pages / hero
};

const wordmarkSizeMap = {
  sm: "h-6",         // compact
  md: "h-8",         // nav
  lg: "h-12",        // hero / login
};


function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function BrandLogo({
  size = "md",
  variant = "lockup",
  linkToHome = true,
  className = "",
  iconClassName = "",
  wordmarkClassName = "",
}: Props) {
  const icon = (
    <img
      src="/brand/flowwrk-icon.svg"
      alt="Flowwrk"
      className={cx(iconSizeMap[size], "shrink-0", iconClassName)}
      draggable={false}
    />
  );

  const wordmark = (
    <>
      {/* Dark mode */}
      <img
        src="/brand/flowwrk-wordmark-light.svg"
        alt="Flowwrk"
        className={cx("hidden dark:block", wordmarkSizeMap[size], wordmarkClassName)}
        draggable={false}
      />
      {/* Light mode */}
      <img
        src="/brand/flowwrk-wordmark-dark.svg"
        alt="Flowwrk"
        className={cx("block dark:hidden", wordmarkSizeMap[size], wordmarkClassName)}
        draggable={false}
      />
    </>
  );

  const content =
    variant === "icon" ? (
      icon
    ) : variant === "wordmark" ? (
      wordmark
    ) : (
      <div className={cx("inline-flex items-center gap-2", className)}>
        {icon}
        {wordmark}
      </div>
    );

  return linkToHome ? <Link to="/">{content}</Link> : content;
}
