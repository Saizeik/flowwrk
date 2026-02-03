// BrandLogo.tsx
import React from "react";
import { Link } from "react-router-dom";

type Props = {
  size?: "sm" | "md" | "lg";
  linkToHome?: boolean;
  src?: string;
  className?: string;
};

const sizeMap = {
  sm: "h-8",
  md: "h-12",
  lg: "h-20",
};

export default function BrandLogo({
  size = "md",
  linkToHome = true,
  src = "/icon.png",
  className = "",
}: Props) {
  const img = (
    <img
      src={src}
      alt="flowwrk"
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
      draggable={false}
    />
  );

  return linkToHome ? <Link to="/">{img}</Link> : img;
}
