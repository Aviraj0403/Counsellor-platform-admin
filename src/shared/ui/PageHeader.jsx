import React from "react";
import { cx } from "../lib/cx.js";

/**
 * Page title block. 21px semibold title, secondary description, 24px bottom margin.
 * `sticky` pins it under the top bar while the page scrolls.
 */
export default function PageHeader({ title, description, actions, icon: Icon, className = "", sticky = false }) {
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
          <span className="tone-brand tone-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-page-title truncate" title={typeof title === "string" ? title : undefined}>{title}</h1>
          {description && <p className="t-secondary mt-1 max-w-[68ch] text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
