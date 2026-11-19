import React from "react";
import { cx } from "../lib/cx.js";



/**
 * Surface container: 16px radius, 1px hairline border, very soft shadow (see `.surface-card`).
 * `padded` applies the density-aware card padding (16px compact / 20px comfortable).
 * `interactive` adds a subtle hover lift.
 */
export function Card({ as = "div", className = "", padded = false, interactive = false, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={cx("surface-card", interactive && "surface-lift", padded && "card-pad", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Card header: 15px title, caption description, 12px gap to body. */
export function CardHeader({ title, description, actions, className = "" }) {
  return (
    <div className={cx("card-pad-x flex items-start justify-between gap-3 pb-3 pt-4", className)}>
      <div className="min-w-0">
        <h3 className="text-card-title truncate" title={typeof title === "string" ? title : undefined}>{title}</h3>
        {description && <p className="text-caption mt-1">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export default Card;
