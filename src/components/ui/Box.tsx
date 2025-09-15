"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "slate" | "brand" | "accent" | "success" | "warning" | "danger";
type Variant = "solid" | "soft" | "outline";

export type BoxProps = {
  as?: "div" | "section" | "article";
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: Tone;
  variant?: Variant;
  padded?: boolean;
  outlined?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

const toneBase: Record<Tone, { ring: string; bgSoft: string; bgSolid: string; text: string; border: string }> = {
  slate:  { ring: "ring-slate-300",  bgSoft: "bg-slate-50",   bgSolid: "bg-slate-900 text-white",  text: "text-slate-900",  border: "border-slate-200" },
  brand:  { ring: "ring-emerald-300",bgSoft: "bg-emerald-50", bgSolid: "bg-emerald-600 text-white",text: "text-emerald-900",border: "border-emerald-200" },
  accent: { ring: "ring-sky-300",    bgSoft: "bg-sky-50",     bgSolid: "bg-sky-600 text-white",    text: "text-sky-900",    border: "border-sky-200" },
  success:{ ring: "ring-green-300",  bgSoft: "bg-green-50",   bgSolid: "bg-green-600 text-white",  text: "text-green-900",  border: "border-green-200" },
  warning:{ ring: "ring-amber-300",  bgSoft: "bg-amber-50",   bgSolid: "bg-amber-600 text-white",  text: "text-amber-900",  border: "border-amber-200" },
  danger: { ring: "ring-rose-300",   bgSoft: "bg-rose-50",    bgSolid: "bg-rose-600 text-white",   text: "text-rose-900",   border: "border-rose-200" },
};

export default function Box({
  as = "section",
  title,
  subtitle,
  actions,
  children,
  footer,
  className,
  tone = "slate",
  variant = "soft",
  padded = true,
  outlined = true,
  collapsible = false,
  defaultOpen = false,
}: BoxProps) {
  const Tag = as;
  const [open, setOpen] = useState(defaultOpen);
  const t = toneBase[tone];

  const container = cn(
    "rounded-2xl shadow-sm transition",
    outlined && "border " + t.border,
    variant === "soft" && "bg-white",
    variant === "solid" && t.bgSolid,
    className,
  );

  const header = cn("flex items-start justify-between gap-4", variant === "solid" ? "" : t.text);
  const body = cn(padded ? "p-6" : "", variant === "solid" ? "" : "text-slate-700");
  const buttonStyle = cn(
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-slate-600",
    t.border
  );

  return (
    <Tag className={container} role="group" aria-label={typeof title === "string" ? title : undefined}>
      {(title || actions || subtitle || collapsible) && (
        <div className={cn("px-6 pt-5", variant === "solid" ? "" : t.text)}>
          <div className={header}>
            <div className="min-w-0">
              {title && <h3 className={cn("text-lg font-semibold", variant === "solid" ? "" : t.text)}>{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              {collapsible && (
                <button
                  type="button"
                  className={buttonStyle}
                  aria-expanded={open}
                  onClick={() => setOpen(v => !v)}
                >
                  {open ? "" : "+"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!collapsible && <div className={body}>{children}</div>}
      {collapsible && open && <div className={body}>{children}</div>}
      {footer && <div className="px-6 pb-5 pt-3 border-t border-slate-100">{footer}</div>}
    </Tag>
  );
}
