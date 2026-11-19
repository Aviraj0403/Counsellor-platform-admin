import React from "react";
import useModalA11y from "../hooks/useModalA11y.js";

/** Dialog panel with role/aria semantics, Escape-to-close, focus trap + restore and scroll lock. Render it only while open. */
export default function DialogSurface({ onClose, labelledBy, className = "", children, ...rest }) {
  const ref = useModalA11y(true, onClose);
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={`outline-none ${className}`} {...rest}>
      {children}
    </div>
  );
}
