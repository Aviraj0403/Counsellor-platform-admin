import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';
import ImportColleges from '../components/ImportColleges';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { rupeesToPaise } from '../../../shared/lib/format';

const LIMIT = 25;
const TYPES = ['university', 'college', 'institute', 'school'];
const LEVELS = ['diploma', 'ug', 'pg', 'phd', 'certificate'];
const BLANK = { name: '', type: 'college', city: '', state: '', website: '' };

export default function Colleges() {
  const { can } = useAuth();
  const [filters, setFilters] = useState({ search: '', city: '', type: '', level: '', course: '', feeMin: '', feeMax: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setPage(1); setFilters({ ...filters, [k]: e.target.value }); };

  const load = useCallback(async () => {
    try {
      const params = { page, limit: LIMIT };
      for (const k of ['search', 'city', 'type', 'level', 'course']) if (filters[k]) params[k] = filters[k];
      const min = filters.feeMin && rupeesToPaise(filters.feeMin);
      const max = filters.feeMax && rupeesToPaise(filters.feeMax);
      if (min && !Number.isNaN(min)) params.feeMinPaise = min;
      if (max && !Number.isNaN(max)) params.feeMaxPaise = max;
      const { data: d } = await api.listColleges(params);
      setData(d);
    } catch (e) {
      toastError(e);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await api.createCollege(body);
      toast.success('College added.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const write = can('colleges:write');

  return (
    <>
      <PageHeader
        title="Colleges"
        subtitle="Your college directory with courses, fees, intakes and eligibility."
        action={
          <div className="flex gap-2">
            <Link to="/colleges/shortlist"><Button variant="secondary">Shortlist tool</Button></Link>
            {write && !importing && <Button variant="secondary" onClick={() => setImporting(true)}>Import from Excel / CSV</Button>}
            {write && !form && <Button onClick={() => setForm(BLANK)}>+ Add college</Button>}
          </div>
        }
      />

      {importing && <ImportColleges onClose={() => setImporting(false)} onImported={load} />}

      {form && (
        <Card title="New college" className="mb-5">
          <form onSubmit={add} className="grid gap-4 md:grid-cols-3">
            <Field label="Name"><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="City"><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="Website" hint="Starts with https://"><Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busy}>Add college</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input className="col-span-2 md:col-span-1" placeholder="Search name" value={filters.search} onChange={set('search')} aria-label="Search name" />
          <Input placeholder="City" value={filters.city} onChange={set('city')} aria-label="City" />
          <Select value={filters.type} onChange={set('type')} aria-label="Type">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={filters.level} onChange={set('level')} aria-label="Course level">
            <option value="">Any course level</option>
            {LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input placeholder="Course name" value={filters.course} onChange={set('course')} aria-label="Course name" />
          <Input placeholder="Min yearly fee (Rs)" inputMode="decimal" value={filters.feeMin} onChange={set('feeMin')} aria-label="Minimum fee" />
          <Input placeholder="Max yearly fee (Rs)" inputMode="decimal" value={filters.feeMax} onChange={set('feeMax')} aria-label="Maximum fee" />
        </div>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No colleges found.</Empty>
        ) : (
          <>
            <Table head={['College', 'Type', 'City', 'State', 'Status']}>
              {data.items.map((c) => (
                <tr key={c._id}>
                  <td className="px-3 py-2.5 font-medium"><Link className="underline" to={`/colleges/${c._id}`}>{c.name}</Link></td>
                  <td className="px-3 py-2.5 text-fg-muted capitalize">{c.type}</td>
                  <td className="px-3 py-2.5 text-fg-secondary">{c.city || ','}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{c.state || ','}</td>
                  <td className="px-3 py-2.5"><Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'active' : 'inactive'}</Badge></td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
