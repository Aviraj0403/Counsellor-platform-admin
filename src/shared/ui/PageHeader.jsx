import React from "react";
import { useContext } from "react";
import { cx } from "../lib/cx.js";
import { PageMetaContext } from "./pageMeta.js";
import { TONE_STYLES } from "./tones.js";

/**
 * Page title block. 21px semibold title, secondary description, 24px bottom margin.
 * `sticky` pins it under the top bar while the page scrolls.
 */
export default function PageHeader({ title, description, actions, icon, className = "", sticky = false }) {
  const meta = useContext(PageMetaContext);
  const Icon = icon || meta?.icon;
  const chip = icon || !meta?.tone ? "tone-brand tone-chip" : TONE_STYLES[meta.tone]?.chip || "tone-brand tone-chip";
  return (
    <div
      className={cx(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        sticky && "sticky top-0 z-20 -mx-4 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className={cx(chip, "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl")}>
            <Icon size={20} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-page-title truncate" title={typeof title === "string" ? title : undefined}>{title}</h1>
          {description && <p className="t-secondary mt-1 max-w-[68ch] text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 [&>div.flex]:flex-wrap">{actions}</div>}
    </div>
  );
}
