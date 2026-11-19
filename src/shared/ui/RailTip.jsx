import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Tooltip/flyout for the collapsed icon rail. Rendered in a portal with fixed
 * positioning so it is never clipped by the scrolling nav. Shows on hover AND focus.
 * Usage: const { bind, node } = useRailTip(collapsed); <a {...bind(label, section)} /> ... {node}
 */
export const useRailTip = (enabled) => {
  const [tip, setTip] = useState(null);
  const hide = useCallback(() => setTip(null), []);
  const bind = (label, sub) => {
    const show = (e) => {
      if (!enabled || typeof window === "undefined" || window.innerWidth < 1024) return;
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ label, sub, top: r.top + r.height / 2, left: r.right + 12 });
    };
    return { onMouseEnter: show, onFocus: show, onMouseLeave: hide, onBlur: hide };
  };
  const node = enabled && tip
    ? createPortal(
        <div role="tooltip" className="rail-tip" style={{ top: tip.top, left: tip.left }}>
          {tip.sub ? <small>{tip.sub}</small> : null}
          {tip.label}
        </div>,
        document.body,
      )
    : null;
  return { bind, node };
};
