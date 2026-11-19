import { Search, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { Button, Field, Input, Select, Spinner } from '../../../shared/ui/ui';
import * as api from '../api';
import { placeholders } from '../lib';
import PhoneBubble from './PhoneBubble';

/** Send a template to one lead or student. Messages go out from the shared platform number; only approved templates can be used. */
export default function ComposeTab({ onSent }) {
  const [templates, setTemplates] = useState(null);
  const [name, setName] = useState('');
  const [params, setParams] = useState([]);
  const [kind, setKind] = useState('lead');
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listTemplates().then((r) => setTemplates(r.data.items.filter((t) => t.active))).catch((e) => { toastError(e); setTemplates([]); });
  }, []);

  useEffect(() => {
    if (picked || q.trim().length < 2) {
      setFound([]);
      return undefined;
    }
    let live = true;
    const h = setTimeout(() => {
      (kind === 'lead' ? api.searchLeads : api.searchStudents)(q.trim())
        .then(({ data }) => live && setFound(data.items || []))
        .catch(() => live && setFound([])); // no permission to list people, or nothing found: no suggestions
    }, 300);
    return () => {
      live = false;
      clearTimeout(h);
    };
  }, [q, kind, picked]);

  const tpl = (templates || []).find((t) => `${t.name}|${t.language}` === name);
  const pick = (v) => {
    setName(v);
    const t = (templates || []).find((x) => `${x.name}|${x.language}` === v);
    setParams(t ? Array(placeholders(t.body)).fill('') : []);
  };
  const ready = !!tpl && !!picked && params.every((p) => p.trim());

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.sendMessage({ [kind === 'lead' ? 'leadId' : 'studentId']: picked._id, template: tpl.name, language: tpl.language, params });
      if (res.data.duplicate) toast('The same message was already sent in the last 10 minutes.');
      else if (res.data.message.status === 'failed') toast.error(res.data.message.error || 'WhatsApp could not send this message.');
      else toast.success('WhatsApp message sent.');
      setPicked(null);
      setQ('');
      onSent?.();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!templates) return <Spinner />;
  if (templates.length === 0) {
    return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-fg-muted">No template is ready to send. Add and turn on an approved template in the Templates tab first.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <Field label="Send to">
            <Select value={kind} onChange={(e) => { setKind(e.target.value); setPicked(null); setQ(''); }}>
              <option value="lead">A lead</option>
              <option value="student">A student</option>
            </Select>
          </Field>
          <Field label={kind === 'lead' ? 'Find the lead' : 'Find the student'} hint="Type at least 2 letters of the name or phone. The person must have agreed to be contacted.">
            {picked ? (
              <div className="flex h-10 items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 text-sm">
                <span className="truncate">{picked.name} <span className="text-fg-muted">{picked.phone}</span></span>
                <button type="button" onClick={() => setPicked(null)} aria-label="Choose someone else" className="cursor-pointer text-fg-muted hover:text-fg"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or phone" className="pl-8" />
                {found.length > 0 && (
                  <ul className="surface-pop absolute z-20 mt-1 max-h-56 w-full overflow-y-auto p-1" role="listbox">
                    {found.map((p) => (
                      <li key={p._id} role="option" aria-selected="false">
                        <button type="button" onClick={() => setPicked(p)} className="flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] hover:bg-surface-2">
                          <span className="truncate font-medium text-fg">{p.name}</span>
                          <span className="text-caption shrink-0">{p.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>
        </div>
        <Field label="Template" hint="Only templates approved in WhatsApp can be sent.">
          <Select value={name} onChange={(e) => pick(e.target.value)} required>
            <option value="">Choose a template</option>
            {templates.map((t) => <option key={t._id} value={`${t.name}|${t.language}`}>{t.name} ({t.language})</option>)}
          </Select>
        </Field>
        {tpl && params.map((p, i) => (
          <Field key={i} label={`Value for {{${i + 1}}}`}>
            <Input value={p} maxLength={200} required onChange={(e) => setParams(params.map((x, j) => (j === i ? e.target.value : x)))} />
          </Field>
        ))}
        <Button type="submit" icon={Send} loading={busy} disabled={!ready}>Send message</Button>
      </div>
      <aside aria-label="Live preview">
        <p className="text-eyebrow mb-2">Live preview</p>
        {tpl ? <PhoneBubble body={tpl.body} params={params} /> : <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">Choose a template to see how the message will look.</p>}
        {picked && <p className="text-caption mt-2">To: {picked.name}, {picked.phone}</p>}
      </aside>
    </form>
  );
}
