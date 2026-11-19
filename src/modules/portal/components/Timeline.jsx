import { formatDate, humanize } from '../../../shared/lib/format';

/** Status history as a simple vertical timeline. */
export default function Timeline({ history = [] }) {
  if (history.length === 0) return <p className="text-sm text-fg-muted">No changes yet.</p>;
  return (
    <ol className="space-y-2 border-l border-line pl-4 text-sm">
      {history.map((h, i) => (
        <li key={i}>
          <span className="font-medium capitalize">{humanize(h.to)}</span>
          <span className="ml-2 text-fg-muted">{formatDate(h.at)}</span>
        </li>
      ))}
    </ol>
  );
}
