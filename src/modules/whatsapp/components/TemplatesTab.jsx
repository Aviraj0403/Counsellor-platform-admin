import { FileText, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { Badge, Button, Field, Input, Modal, Spinner } from '../../../shared/ui/ui';
import * as api from '../api';
import { placeholders } from '../lib';
import PhoneBubble from './PhoneBubble';

function TemplateForm({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', language: 'en', body: '', purpose: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createTemplate({ ...f, purpose: f.purpose || undefined });
      toast.success('Template saved.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="New template" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" hint="Exactly as approved in WhatsApp: lowercase letters, digits, underscores.">
          <Input value={f.name} onChange={set('name')} pattern="[a-z0-9_]+" required />
        </Field>
        <Field label="Language code">
          <Input value={f.language} onChange={set('language')} maxLength={10} required />
        </Field>
        <Field label="Message text" hint="Use {{1}}, {{2}} for values filled in when you send.">
          <textarea value={f.body} onChange={set('body')} maxLength={1024} rows={4} required className="field-input h-auto py-2" />
        </Field>
        <Field label="Purpose (optional)">
          <Input value={f.purpose} onChange={set('purpose')} maxLength={200} />
        </Field>
        {f.body && (
          <div>
            <p className="text-eyebrow mb-1">Preview</p>
            <PhoneBubble body={f.body} />
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>Save</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function TemplateCard({ tpl, manage, onToggle, onDelete }) {
  const vars = placeholders(tpl.body);
  return (
    <article className={`surface-card flex flex-col gap-3 p-4 ${tpl.active ? '' : 'opacity-80'}`}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-[13px] font-semibold text-fg" title={tpl.name}>{tpl.name}</h3>
          {tpl.purpose && <p className="text-caption truncate !text-[11px]">{tpl.purpose}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <Badge tone="gray">{tpl.language}</Badge>
          <Badge tone={tpl.active ? 'green' : 'gray'}>{tpl.active ? 'Ready to send' : 'Turned off'}</Badge>
        </div>
      </header>
      <PhoneBubble body={tpl.body} />
      <p className="text-caption !text-[11px]">{vars === 0 ? 'No values to fill in.' : `${vars} value${vars === 1 ? '' : 's'} filled in when sending.`}</p>
      {manage && (
        <footer className="mt-auto flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onToggle(tpl)}>{tpl.active ? 'Turn off' : 'Turn on'}</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(tpl)}>Delete</Button>
        </footer>
      )}
    </article>
  );
}

export default function TemplatesTab({ manage }) {
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.listTemplates().then((r) => setItems(r.data.items)).catch((e) => { toastError(e); setItems([]); }), []);
  useEffect(() => { load(); }, [load]);
  const toggle = (t) => api.updateTemplate(t._id, { active: !t.active }).then(load).catch(toastError);
  const remove = (t) => window.confirm(`Delete template ${t.name}?`) && api.deleteTemplate(t._id).then(load).catch(toastError);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">Messages can only use templates that are approved in WhatsApp Business. Add a template here after it is approved.</p>
        {manage && <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>New template</Button>}
      </div>
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center">
          <span className="tone-emerald tone-chip mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"><FileText size={20} aria-hidden="true" /></span>
          <p className="text-sm font-medium text-fg">No templates yet</p>
          <p className="text-caption mx-auto mt-1 max-w-md">
            {manage ? 'Get a message template approved in WhatsApp Business, then add it here with the same name. Once it is added you can send it and use it in automation rules.' : 'Ask your organisation owner to add an approved template.'}
          </p>
          {manage && <Button className="mt-4" size="sm" icon={Plus} onClick={() => setAdding(true)}>Add your first template</Button>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => <TemplateCard key={t._id} tpl={t} manage={manage} onToggle={toggle} onDelete={remove} />)}
        </div>
      )}
      {adding && <TemplateForm onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
}
