import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  Search,
  Filter,
  ExternalLink,
  Plus,
  CalendarCheck,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Modal,
  PageHeader,
  Pager,
  Select,
  Spinner,
  Table,
} from '../../../shared/ui/ui';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';

const STATUS_TONES = {
  identified: 'gray',
  contacted: 'amber',
  meeting_scheduled: 'blue',
  partnered: 'green',
  declined: 'red',
};

const TYPE_LABELS = {
  coaching_institute: 'Coaching Institute',
  junior_college: 'Junior College (11th/12th)',
  school: 'Senior Secondary School',
  polytechnic: 'Polytechnic Diploma',
};

const BLANK = {
  name: '',
  type: 'coaching_institute',
  city: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
  designation: '',
  estStudentsCount: '',
  notes: '',
};

export default function Partners() {
  const { can } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listPartners({
        page,
        limit: 15,
        search: search || undefined,
        city: cityFilter || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setData(res.data);
    } catch (e) {
      toastError(e);
    }
  }, [page, search, cityFilter, typeFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const savePartner = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addPartner({
        ...form,
        estStudentsCount: form.estStudentsCount ? Number(form.estStudentsCount) : 0,
      });
      toast.success('Partner organisation added.');
      setFormOpen(false);
      setForm(BLANK);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.updatePartnerStatus(id, status);
      toast.success('Outreach status updated.');
      load();
    } catch (e) {
      toastError(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="School & Coaching Partners"
        subtitle="Public directory of local 12th science coaching institutes and schools. Build strategic partnerships, organize free seminars, and collect student batches."
        action={
          can('leads:write') && (
            <Button onClick={() => setFormOpen(true)} className="flex items-center gap-1.5">
              <Plus size={16} /> Add Partner
            </Button>
          )
        }
      />

      {/* Metric Highlights */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Total Potential Centers</div>
          <div className="mt-1 text-2xl font-bold text-fg">{data?.total ?? '...'}</div>
          <p className="text-caption mt-0.5">Schools & Coaching Hubs</p>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Active Partners</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {data?.items?.filter((i) => i.status === 'partnered').length ?? 0}
          </div>
          <p className="text-caption mt-0.5">Sharing Student Batches</p>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">Meetings Scheduled</div>
          <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
            {data?.items?.filter((i) => i.status === 'meeting_scheduled').length ?? 0}
          </div>
          <p className="text-caption mt-0.5">Seminars & Workshops</p>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">Under Outreach</div>
          <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {data?.items?.filter((i) => i.status === 'contacted').length ?? 0}
          </div>
          <p className="text-caption mt-0.5">Initial Follow-ups</p>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search">
            <Input
              type="search"
              placeholder="Center or coordinator name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="City">
            <Select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Cities</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Kota">Kota</option>
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="coaching_institute">Coaching Institute</option>
              <option value="junior_college">Junior College</option>
              <option value="school">School</option>
              <option value="polytechnic">Polytechnic</option>
            </Select>
          </Field>
          <Field label="Outreach Status">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="identified">Identified (New)</option>
              <option value="contacted">Contacted</option>
              <option value="meeting_scheduled">Meeting Scheduled</option>
              <option value="partnered">Partnered (Tie-up Done)</option>
              <option value="declined">Declined</option>
            </Select>
          </Field>
        </div>

        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No partner institutes found matching your search.</Empty>
        ) : (
          <>
            <Table
              head={[
                'Institute / Center',
                'Type & Location',
                'Key Contact',
                'Students',
                'Outreach Status',
                'Action',
              ]}
            >
              {data.items.map((p) => (
                <tr key={p._id} className="hover:bg-surface-2">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-fg">{p.name}</div>
                    <div className="text-xs text-fg-muted">{p.address || p.city}</div>
                    {p.notes && <div className="mt-1 text-xs text-brand-600 dark:text-brand-300">💡 {p.notes}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-block rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg-secondary">
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                    <div className="mt-0.5 text-xs text-fg-muted">{p.city}, {p.state}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    {p.contactPerson ? (
                      <div>
                        <div className="font-medium text-fg">{p.contactPerson}</div>
                        <div className="text-xs text-fg-muted">{p.designation || 'Coordinator'}</div>
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:underline">
                            <Phone size={11} /> {p.phone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">Not specified</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-fg">~{p.estStudentsCount || 0}</span>
                    <span className="text-xs text-fg-muted"> 12th passouts</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={STATUS_TONES[p.status] || 'gray'}>
                      {p.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Select
                        size="sm"
                        value={p.status}
                        disabled={updatingId === p._id || !can('leads:write')}
                        onChange={(e) => setStatus(p._id, e.target.value)}
                        className="text-xs py-1"
                      >
                        <option value="identified">Identified</option>
                        <option value="contacted">Contacted</option>
                        <option value="meeting_scheduled">Meeting Set</option>
                        <option value="partnered">Partnered</option>
                        <option value="declined">Declined</option>
                      </Select>
                      {p.phone && (
                        <a
                          href={`https://wa.me/${p.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(p.contactPerson || '')},%20we%20would%20like%20to%20conduct%20a%20free%20admission%20guidance%20seminar%20for%20your%20students.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                          title="WhatsApp outreach"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={page} limit={15} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>

      {/* Add Partner Modal */}
      {formOpen && (
        <Modal title="Add Partner School / Coaching" onClose={() => setFormOpen(false)}>
          <form onSubmit={savePartner} className="space-y-4">
            <Field label="Institute / School Name">
              <Input
                required
                placeholder="e.g. Allen Career Institute - Kothrud"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="coaching_institute">Coaching Institute</option>
                  <option value="junior_college">Junior College</option>
                  <option value="school">Senior Secondary School</option>
                  <option value="polytechnic">Polytechnic</option>
                </Select>
              </Field>
              <Field label="City">
                <Input required placeholder="e.g. Pune" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Person">
                <Input placeholder="e.g. Rajesh Patil" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </Field>
              <Field label="Phone Number">
                <Input placeholder="+9198XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Estimated 12th Students">
                <Input type="number" placeholder="e.g. 450" value={form.estStudentsCount} onChange={(e) => setForm({ ...form, estStudentsCount: e.target.value })} />
              </Field>
              <Field label="Address / Area">
                <Input placeholder="FC Road, Pune" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>

            <Field label="Partnership Notes / Next Step">
              <Input placeholder="e.g. Contacted coordinator for Career Day session" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save Partner</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

