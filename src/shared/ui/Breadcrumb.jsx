import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Shared presentational breadcrumb pill.
 * items: [{ label, to }]; the last item is rendered as the current page.
 */
const Breadcrumb = ({ items = [], homeTo, homeLabel = "Home", ariaLabel = "Breadcrumb", className = "" }) => (
  <nav aria-label={ariaLabel} className={`crumb-shell ${className}`}>
    <ol className="crumb-list">
      <li>
        <Link to={homeTo} aria-label={homeLabel} title={homeLabel} className="crumb-home">
          <Home size={16} aria-hidden="true" />
        </Link>
      </li>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={`${item.to || item.label}-${i}`}>
            <ChevronRight size={14} className="crumb-sep" aria-hidden="true" />
            {isLast ? (
              <span aria-current="page" title={item.label} className="crumb-current">{item.label}</span>
            ) : (
              <Link to={item.to} className="crumb-link">{item.label}</Link>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumb;
