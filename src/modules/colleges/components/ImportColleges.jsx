import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Button, Card, Field, Select, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';

const CHUNK = 200;
const MAX_ROWS = 5000;
const FIELDS = [
  { key: 'name', label: 'College name', required: true, hints: ['college', 'name', 'institute', 'university'] },
  { key: 'city', label: 'City', required: true, hints: ['city', 'town', 'location'] },
  { key: 'state', label: 'State', hints: ['state'] },
  { key: 'type', label: 'Type', hints: ['type'] },
  { key: 'website', label: 'Website', hints: ['website', 'url', 'site'] },
  { key: 'courseName', label: 'Course name', hints: ['course', 'program', 'degree'] },
  { key: 'level', label: 'Level (ug, pg...)', hints: ['level'] },
  { key: 'stream', label: 'Stream', hints: ['stream', 'branch'] },
  { key: 'durationMonths', label: 'Duration (months)', hints: ['duration', 'months'] },
  { key: 'annualFeeRupees', label: 'Yearly fee (rupees)', hints: ['fee', 'tuition'] },
];

const guess = (headers, hints) => {
  const i = headers.findIndex((h) => hints.some((x) => String(h).toLowerCase().includes(x)));
  return i >= 0 ? String(i) : '';
};
const toRow = (cells, map) => Object.fromEntries(FIELDS.map((f) => [f.key, map[f.key] === '' ? '' : String(cells[Number(map[f.key])] ?? '').trim()]));

/** Pick file -> map columns -> preview -> import in chunks. The API validates every row and reports the bad ones. */
export default function ImportColleges({ onClose, onImported }) {
  const [sheet, setSheet] = useState(null);
  const [map, setMap] = useState({});
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false, blankrows: false });
      if (grid.length < 2) throw new Error('The file needs a header row and at least one data row.');
      if (grid.length - 1 > MAX_ROWS) throw new Error(`Too many rows (max ${MAX_ROWS}). Split the file.`);
      const headers = grid[0].map((h) => String(h).trim());
      setSheet({ fileName: file.name, headers, body: grid.slice(1) });
      setMap(Object.fromEntries(FIELDS.map((f) => [f.key, guess(headers, f.hints)])));
      setReport(null);
    } catch (err) {
      toastError(err);
    }
  };

  const rows = useMemo(() => (sheet ? sheet.body.map((c) => toRow(c, map)) : []), [sheet, map]);
  const mapped = FIELDS.filter((f) => f.required).every((f) => map[f.key] !== '');

  const run = async () => {
    setBusy(true);
    const total = { total: 0, collegesCreated: 0, collegesUpdated: 0, coursesCreated: 0, coursesUpdated: 0, invalid: [] };
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { data } = await api.importColleges(rows.slice(i, i + CHUNK));
        for (const k of ['total', 'collegesCreated', 'collegesUpdated', 'coursesCreated', 'coursesUpdated']) total[k] += data[k];
        total.invalid.push(...data.invalid.map((x) => ({ row: x.row + i + 1, reason: x.reason }))); // +1: header row
      }
      setReport(total);
      toast.success('Import finished.');
      onImported?.();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Import colleges and courses" className="mb-5" action={<Button variant="secondary" size="sm" onClick={onClose}>Close</Button>}>
      <p className="mb-3 text-sm text-fg-muted">One row per course (repeat the college on each row). Colleges are matched by name and city, so importing the same file again updates instead of duplicating.</p>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={pick} aria-label="Choose file" className="text-sm" />
      {sheet && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`}>
                <Select value={map[f.key] ?? ''} onChange={(e) => setMap({ ...map, [f.key]: e.target.value })}>
                  <option value="">(not in file)</option>
                  {sheet.headers.map((h, i) => <option key={i} value={String(i)}>{h || `Column ${i + 1}`}</option>)}
                </Select>
              </Field>
            ))}
          </div>
          <p className="text-sm">{sheet.fileName}: {rows.length} rows</p>
          {mapped && (
            <Table head={['College', 'City', 'Course', 'Level', 'Fee (Rs)']}>
              {rows.slice(0, 5).map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{r.name}</td><td className="px-3 py-2">{r.city}</td><td className="px-3 py-2">{r.courseName}</td><td className="px-3 py-2">{r.level}</td><td className="px-3 py-2">{r.annualFeeRupees}</td>
                </tr>
              ))}
            </Table>
          )}
          <Button loading={busy} disabled={!mapped || !rows.length} onClick={run}>Import {rows.length} rows</Button>
        </div>
      )}
      {report && (
        <div className="mt-4 text-sm">
          <p>Colleges: {report.collegesCreated} new, {report.collegesUpdated} updated. Courses: {report.coursesCreated} new, {report.coursesUpdated} updated. Skipped: {report.invalid.length}.</p>
          {report.invalid.length > 0 && (
            <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 text-fg-muted">
              {report.invalid.slice(0, 100).map((x) => <li key={x.row}>File row {x.row}: {x.reason}</li>)}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
