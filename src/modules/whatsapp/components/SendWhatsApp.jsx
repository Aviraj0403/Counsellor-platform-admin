import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Field, Input, Modal, Select } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';

const placeholders = (body) => Math.max(0, ...[...body.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1])));
const fill = (body, params) => body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n) => params[Number(n) - 1] || `{{${n}}}`);

/** "Send WhatsApp" button + dialog for a lead (pass leadId) or a student (pass studentId). Used on the lead page. */
export default function SendWhatsApp({ leadId, studentId, onSent }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [params, setParams] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.listTemplates().then((r) => setTemplates(r.data.items.filter((t) => t.active))).catch(toastError);
  }, [open]);

  const tpl = templates.find((t) => `${t.name}|${t.language}` === name);
  const pick = (v) => {
    setName(v);
    const t = templates.find((x) => `${x.name}|${x.language}` === v);
    setParams(t ? Array(placeholders(t.body)).fill('') : []);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.sendMessage({ leadId, studentId, template: tpl.name, language: tpl.language, params });
      if (res.data.duplicate) toast('The same message was already sent in the last 10 minutes.');
      else if (res.data.message.status === 'failed') toast.error(res.data.message.error || 'WhatsApp could not send this message.');
      else toast.success('WhatsApp message sent.');
      setOpen(false);
      onSent?.();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Send WhatsApp</Button>
      {open && (
        <Modal title="Send WhatsApp message" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
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
            {tpl && <p className="rounded border border-line bg-surface p-3 text-sm text-fg-secondary">{fill(tpl.body, params)}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={busy} disabled={!tpl}>Send</Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
