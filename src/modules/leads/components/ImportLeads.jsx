import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Field, Select, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as leadsApi from '../api';

const CHUNK = 500;
const MAX_ROWS = 20000;
const FIELDS = [
  { key: 'name', label: 'Student name', required: true, hints: ['name', 'student', 'full name'] },
  { key: 'phone', label: 'Mobile number', required: true, hints: ['phone', 'mobile', 'contact', 'whatsapp'] },
  { key: 'email', label: 'Email', hints: ['email', 'mail'] },
  { key: 'city', label: 'City', hints: ['city', 'town', 'location'] },
  { key: 'interestedCourse', label: 'Interested course', hints: ['course', 'interest', 'program'] },
];

const guessColumn = (headers, hints) => {
  const i = headers.findIndex((h) => hints.some((x) => String(h).toLowerCase().includes(x)));
  return i >= 0 ? String(i) : '';
};

/** Same cleaning as the API (+91 numbers). The API stays the judge; this only previews. */
const cleanPhone = (raw) => {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
};

const toRow = (cells, map) => Object.fromEntries(FIELDS.map((f) => [f.key, map[f.key] === '' ? '' : String(cells[Number(map[f.key])] ?? '').trim()]));

/** Import flow: pick file -> map columns -> preview + dry run -> import in chunks of 500. */
export default function ImportLeads({ canAssign, onClose, onImported }) {
  const [sheet, setSheet] = useState(null); // { fileName, headers, body }
  const [map, setMap] = useState({});
  const [consent, setConsent] = useState(false);
  const [autoAssign, setAutoAssign] = useState(false);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false, blankrows: false });
      if (grid.length < 2) throw new Error('The file needs a header row and at least one data row.');
      if (grid.length - 1 > MAX_ROWS) throw new Error(`Too many rows (max ${MAX_ROWS}). Split the file.`);
      const headers = grid[0].map((h) => String(h).trim());
      setSheet({ fileName: file.name, headers, body: grid.slice(1) });
      setMap(Object.fromEntries(FIELDS.map((f) => [f.key, guessColumn(headers, f.hints)])));
      setReport(null);
    } catch (err) {
      toastError(err);
    }
  };

  // Rows to send: mapped, with repeats of the same number inside the file removed (counted separately).
  const prepared = useMemo(() => {
    if (!sheet) return null;
    const seen = new Set();
    const rows = [];
    const problems = [];
    let repeated = 0;
    sheet.body.forEach((cells, i) => {
      const fileRow = i + 2;
      const r = toRow(cells, map);
      const phone = cleanPhone(r.phone);
      if (r.name.length < 2) return problems.push({ row: fileRow, reason: 'Name is missing.' });
      if (!phone) return problems.push({ row: fileRow, reason: 'Phone is not a valid 10-digit Indian mobile number.' });
      if (seen.has(phone)) return void repeated++;
      seen.add(phone);
      rows.push({ ...r, fileRow });
    });
    return { rows, problems, repeated };
  }, [sheet, map]);

  const mapped = FIELDS.filter((f) => f.required).every((f) => map[f.key] !== '');

  const run = async (dryRun) => {
    setBusy(dryRun ? 'dry' : 'real');
    const total = { total: 0, created: 0, duplicates: prepared.repeated, invalid: [...prepared.problems], dryRun };
    try {
      for (let i = 0; i < prepared.rows.length; i += CHUNK) {
        const chunk = prepared.rows.slice(i, i + CHUNK);
        const { data } = await leadsApi.importLeads({
          rows: chunk.map((r) => ({ name: r.name, phone: r.phone, email: r.email, city: r.city, interestedCourse: r.interestedCourse })),
          channel: 'import',
          consentGiven: true,
          autoAssign,
          dryRun,
        });
        total.total += data.total;
        total.created += data.created;
        total.duplicates += data.duplicates;
        data.invalid.forEach((x) => total.invalid.push({ row: chunk[x.row - 1].fileRow, reason: x.reason }));
        setReport({ ...total, progress: Math.min(i + CHUNK, prepared.rows.length) });
      }
      total.total += prepared.problems.length + prepared.repeated;
      setReport(total);
      if (!dryRun) {
        toast.success(`${total.created} leads imported.`);
        onImported();
      }
    } catch (err) {
      toastError(err); // earlier chunks may already be saved: running the same file again only skips them as duplicates
    } finally {
      setBusy('');
    }
  };

  const errors = report?.invalid ?? prepared?.problems ?? [];
  return (
    <Card title="Import leads from Excel or CSV" className="mb-5" action={<Button variant="secondary" size="sm" onClick={onClose}>Close</Button>}>
      <div className="space-y-4">
        <Field label="File (.xlsx, .xls or .csv)" hint="The first row must be the column headings. Leads already in your list, or repeated in the file, are skipped.">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={pick} className="block text-sm" />
        </Field>

        {sheet && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {FIELDS.map((f) => (
                <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`}>
                  <Select value={map[f.key] ?? ''} onChange={(e) => { setMap({ ...map, [f.key]: e.target.value }); setReport(null); }}>
                    <option value="">{f.required ? 'Choose a column' : 'Not in file'}</option>
                    {sheet.headers.map((h, i) => <option key={i} value={String(i)}>{h || `Column ${i + 1}`}</option>)}
                  </Select>
                </Field>
              ))}
            </div>

            {mapped && prepared && (
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge tone="blue">{sheet.body.length} rows in {sheet.fileName}</Badge>
                <Badge tone="green">{prepared.rows.length} ready</Badge>
                <Badge tone={prepared.problems.length ? 'red' : 'gray'}>{prepared.problems.length} with problems</Badge>
                <Badge>{prepared.repeated} repeated in file</Badge>
              </div>
            )}

            {mapped && prepared && (
              <Table head={['Row', 'Name', 'Phone', 'City', 'Course']}>
                {prepared.rows.slice(0, 5).map((r) => (
                  <tr key={r.fileRow}>
                    <td className="px-3 py-2 text-fg-muted">{r.fileRow}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-fg-secondary">{r.phone}</td>
                    <td className="px-3 py-2 text-fg-muted">{r.city || ','}</td>
                    <td className="px-3 py-2 text-fg-muted">{r.interestedCourse || ','}</td>
                  </tr>
                ))}
              </Table>
            )}

            {errors.length > 0 && (
              <div className="max-h-44 overflow-auto rounded-lg border border-line p-3 text-sm">
                <p className="mb-1 font-medium">Rows that will be skipped ({errors.length})</p>
                <ul className="space-y-0.5 text-fg-muted">
                  {errors.slice(0, 100).map((x, i) => <li key={i}>Row {x.row}: {x.reason}</li>)}
                  {errors.length > 100 && <li>...and {errors.length - 100} more.</li>}
                </ul>
              </div>
            )}

            {report && (
              <p className="rounded-lg border border-line p-3 text-sm" role="status">
                {report.dryRun ? 'Dry run (nothing saved): ' : 'Done: '}
                <strong>{report.created}</strong> {report.dryRun ? 'would be added' : 'added'}, <strong>{report.duplicates}</strong> already exist or repeat, <strong>{report.invalid.length}</strong> invalid.
                {busy && report.progress ? ` Working... ${report.progress}/${prepared.rows.length}` : ''}
              </p>
            )}

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 accent-indigo-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I confirm these students (or parents, if under 18) agreed to be contacted. <span className="text-fg-muted">Recorded with every imported lead.</span></span>
            </label>
            {canAssign && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-indigo-600" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} />
                Spread the new leads across counsellors (fewest open leads first)
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!mapped || !prepared?.rows.length || !!busy} loading={busy === 'dry'} onClick={() => run(true)}>Dry run</Button>
              <Button disabled={!mapped || !consent || !prepared?.rows.length || !!busy} loading={busy === 'real'} onClick={() => run(false)}>Import {prepared?.rows.length ?? 0} leads</Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
