import { Loader2 } from 'lucide-react';
import { useId } from 'react';
import { cx } from '../lib/cx.js';
import BaseBadge from './Badge';
import BaseButton from './Button';
import { Card as BaseCard, CardHeader } from './Card';
import DialogSurface from './DialogSurface';
import BasePageHeader from './PageHeader';

/**
 * The screen kit every page uses. Built on the shared design system (theme tokens, tone chips, surface cards), so a
 * page written against these names follows the colour theme, light/dark mode and density automatically.
 */

export const Button = BaseButton;

export function Card({ title, action, children, className = '' }) {
  return (
    <BaseCard as="section" className={className}>
      {(title || action) && <CardHeader title={title} actions={action} className="border-b border-line" />}
      <div className="card-pad">{children}</div>
    </BaseCard>
  );
}

// Page code says gray/green/red/amber/blue; the design system speaks neutral/success/danger/warning/info.
const BADGE_TONE = { gray: 'neutral', green: 'success', red: 'danger', amber: 'warning', blue: 'info' };
export function Badge({ tone = 'gray', children }) {
  return <BaseBadge tone={BADGE_TONE[tone] || 'neutral'}>{children}</BaseBadge>;
}

export function PageHeader({ title, subtitle, action }) {
  return <BasePageHeader title={title} description={subtitle} actions={action} />;
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-fg-muted" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">{children}</p>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="label-gap block font-medium text-fg-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-fg-muted">{hint}</span>}
    </label>
  );
}

export const Input = ({ className, ...props }) => <input {...props} className={cx('field-input', className)} />;
export const Select = ({ children, className, ...props }) => (
  <select {...props} className={cx('field-input', className)}>
    {children}
  </select>
);

export function Modal({ title, onClose, children }) {
  const id = useId();
  return (
    <div className="shell-scrim fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogSurface onClose={onClose} labelledBy={id} className="surface-pop sa-pop card-pad w-full max-w-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id={id} className="text-card-title">
            {title}
          </h3>
          <button type="button" onClick={onClose} className="snav-icon-btn !h-8 !min-w-8" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </DialogSurface>
    </div>
  );
}

export function Table({ head, children }) {
  return (
    <div className="table-scroll-wrapper scrollbar-thin">
      <table className="modern-table">
        {Array.isArray(head) && head.length > 0 && (
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={typeof h === 'string' ? h : i}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Pager({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="text-caption mt-4 flex items-center justify-between">
      <span>
        {total} total · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
