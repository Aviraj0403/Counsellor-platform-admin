import React from "react";

/**
 * Ambient backdrop: two very soft theme-coloured glows (`--glow-1/2`).
 * Themes like "slate" set them to transparent. Decorative only.
 */
export default function Ambient() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <div className="absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full blur-[120px]" style={{ background: "var(--glow-1)" }} />
      <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full blur-[130px]" style={{ background: "var(--glow-2)" }} />
    </div>
  );
}
