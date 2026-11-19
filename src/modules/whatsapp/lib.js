// Pure helpers for WhatsApp templates (no React): variables look like {{1}}, {{2}}.
const VAR = /\{\{\s*(\d+)\s*\}\}/g;

/** Highest placeholder number in a template body = how many values it needs. */
export const placeholders = (body = '') => Math.max(0, ...[...body.matchAll(VAR)].map((m) => Number(m[1])));

/** Fills {{n}} with the given values; an empty value keeps the {{n}} marker so the preview shows what is missing. */
export const fill = (body = '', params = []) => body.replace(VAR, (_m, n) => params[Number(n) - 1] || `{{${n}}}`);

/** Splits a body into plain and variable segments so the UI can highlight variables: [{ text, variable: 1 | null }]. */
export const segments = (body = '', params = []) => {
  const out = [];
  let last = 0;
  for (const m of body.matchAll(VAR)) {
    if (m.index > last) out.push({ text: body.slice(last, m.index), variable: null });
    const n = Number(m[1]);
    out.push({ text: params[n - 1] || `{{${n}}}`, variable: n, filled: !!params[n - 1] });
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last), variable: null });
  return out;
};

export const STATUS_TONE = { queued: 'gray', sent: 'blue', delivered: 'green', read: 'green', failed: 'red' };

export const EVENTS = [
  { value: 'lead.created', label: 'A lead is created', filterHint: 'Channel (optional), e.g. website' },
  { value: 'lead.stage_changed', label: 'A lead moves to a stage', filterHint: 'Stage, e.g. qualified' },
  { value: 'application.status_changed', label: 'An application changes status', filterHint: 'Status, e.g. offered' },
];
export const eventLabel = (v) => EVENTS.find((e) => e.value === v)?.label || v;
