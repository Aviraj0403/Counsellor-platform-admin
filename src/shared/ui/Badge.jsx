import React from "react";
import { cx } from "../lib/cx.js";

// Themed through `.tone-pill` (see index.css); semantic names map onto tone variables.
const tones = {
  neutral: "tone-neutral tone-pill",
  brand: "tone-brand tone-pill",
  success: "tone-emerald tone-pill",
  warning: "tone-amber tone-pill",
  danger: "tone-rose tone-pill",
  info: "tone-sky tone-pill",
};

export default function Badge({ tone = "neutral", dot = false, children, className = "" }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium leading-none", tones[tone] || tones.neutral, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--t)" }} />}
      {children}
    </span>
  );
}
