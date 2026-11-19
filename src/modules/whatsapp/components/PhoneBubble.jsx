import { segments } from '../lib';

/** A message as it will look in WhatsApp: a chat bubble with the variables ({{1}}...) highlighted. */
export default function PhoneBubble({ body, params = [], time = 'now', className = '' }) {
  return (
    <div className={`rounded-2xl bg-surface-2 p-3 ring-1 ring-inset ring-line ${className}`}>
      <div
        className="tone-emerald tone-chip relative ml-auto max-w-full rounded-2xl rounded-tr-sm px-3 py-2 text-[13px] leading-relaxed"
        style={{ color: 'var(--fg)' }}
        aria-label="Message preview"
      >
        <p className="whitespace-pre-wrap break-words">
          {segments(body, params).map((s, i) =>
            s.variable ? (
              <mark key={i} className={`tone-amber tone-chip rounded px-1 font-mono text-[12px] ${s.filled ? 'font-semibold' : ''}`}>
                {s.text}
              </mark>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
        </p>
        <p className="mt-1 text-right text-[10px] text-fg-muted">{time}</p>
      </div>
    </div>
  );
}
