import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as api from '../api';
import TypeForm from '../components/TypeForm';
import useStaff from '../components/useStaff';
import { MODE_LABEL } from '../lib';

export default function AppointmentTypes() {
  const { t } = useI18n();
  const { can } = useAuth();
  const { nameOf } = useStaff();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | type
  const load = useCallback(() => api.listTypes({ includeInactive: 1 }).then(({ data }) => setItems(data.items)).catch(toastError), []);
  useEffect(() => { load(); }, [load]);
  const manage = can('appointments:manage');

  return (
    <>
      <PageHeader title={t('page.appointmentTypes', 'Appointment types')} subtitle="What students can book: length, gaps, who takes it, questions and the cancellation policy." action={manage && <Button onClick={() => setEditing('new')}>New type</Button>} />
      <Card>
        {!items ? <Spinner /> : items.length === 0 ? <Empty>No appointment types yet. Create one, then set working hours under Availability.</Empty> : (
          <Table head={['Name', 'How', 'Length', 'Who', 'Online booking', '']}>
            {items.map((t) => (
              <tr key={t._id}>
                <td className="px-3 py-2.5 font-medium">{t.name}{!t.active && <span className="ml-2"><Badge>Inactive</Badge></span>}</td>
                <td className="px-3 py-2.5">{MODE_LABEL[t.mode]}</td>
                <td className="px-3 py-2.5">{t.durationMin} min</td>
                <td className="px-3 py-2.5 text-fg-muted">{(t.counsellorIds || []).map(nameOf).join(', ') || 'Nobody yet'}{t.assignment === 'round_robin' && ' (shared equally)'}</td>
                <td className="px-3 py-2.5"><Badge tone={t.publicBookable ? 'green' : 'gray'}>{t.publicBookable ? 'On' : 'Off'}</Badge></td>
                <td className="px-3 py-2.5 text-right">{manage && <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>Edit</Button>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {editing && <TypeForm type={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />}
    </>
  );
}
