"use client";

import { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "error" | "warning" | "info";
  children: ReactNode;
}

export default function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-success-light text-green-800",
    error: "bg-error-light text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-info-light text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
