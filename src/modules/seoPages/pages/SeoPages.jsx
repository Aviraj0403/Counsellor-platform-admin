import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';

const BLANK = { metaTitle: '', metaDescription: '', heroText: '', faqs: [], published: true };

export default function SeoPages() {
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null); // { row, form }
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.listPages();
      setRows(data.items);
    } catch (e) {
      toastError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (row) => setEdit({ row, form: { ...BLANK, ...(row.override ?? {}), faqs: (row.override?.faqs ?? []).map((f) => ({ q: f.q, a: f.a })) } });
  const setForm = (patch) => setEdit({ ...edit, form: { ...edit.form, ...patch } });
  const setFaq = (i, patch) => setForm({ faqs: edit.form.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { metaTitle, metaDescription, heroText, published } = edit.form;
      const faqs = edit.form.faqs.filter((f) => f.q.trim() && f.a.trim());
      await api.savePage(edit.row.collegeId, { metaTitle, metaDescription, heroText, faqs, published });
      toast.success('Page saved.');
      setEdit(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    try {
      await api.deletePage(edit.row.collegeId);
      toast.success('Back to the automatic page.');
      setEdit(null);
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const showPreview = async (row) => {
    try {
      const { data } = await api.previewPage(row.slug);
      setPreview({ name: row.name, html: data.html });
    } catch (err) {
      toastError(err);
    }
  };

  if (!rows) return <Spinner />;

  return (
    <div className="space-y-4">
      <PageHeader title="College pages (SEO)" subtitle="Optional title, description, intro text and FAQs for each college page. Colleges without changes get an automatic page." />
      {rows.length === 0 ? (
        <Empty>Add colleges first, then their public pages appear here.</Empty>
      ) : (
        <Table head={['College', 'Page', 'Public link', '']}>
          {rows.map((r) => (
            <tr key={r.collegeId}>
              <td>{r.name}<div className="text-xs text-fg-muted">{r.city}</div></td>
              <td>
                {r.override ? <Badge tone={r.override.published ? 'green' : 'gray'}>{r.override.published ? 'Customised' : 'Hidden'}</Badge> : <Badge>Automatic</Badge>}
              </td>
              <td>{r.publicUrl ? <a className="text-accent underline" href={r.publicUrl} target="_blank" rel="noreferrer">Open</a> : <span className="text-xs text-fg-muted">Set your address in Public website</span>}</td>
              <td className="space-x-2 text-right">
                <Button variant="secondary" onClick={() => showPreview(r)}>Preview</Button>
                <Button onClick={() => open(r)}>Edit</Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {edit && (
        <Card title={`Edit page: ${edit.row.name}`}>
          <form onSubmit={save} className="space-y-3">
            <Field label="Page title" hint="Shown in search results. Leave empty for an automatic title."><Input value={edit.form.metaTitle} onChange={(e) => setForm({ metaTitle: e.target.value })} maxLength={120} /></Field>
            <Field label="Meta description" hint="About 150 characters."><Input value={edit.form.metaDescription} onChange={(e) => setForm({ metaDescription: e.target.value })} maxLength={300} /></Field>
            <Field label="Intro line under the heading"><Input value={edit.form.heroText} onChange={(e) => setForm({ heroText: e.target.value })} maxLength={500} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.form.published} onChange={(e) => setForm({ published: e.target.checked })} />
              Published (untick to hide this page from the public site)
            </label>
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg-secondary">Frequently asked questions</p>
              {edit.form.faqs.map((f, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
                  <Input placeholder="Question" value={f.q} onChange={(e) => setFaq(i, { q: e.target.value })} maxLength={300} />
                  <textarea className="field-input" rows={3} placeholder="Answer" value={f.a} onChange={(e) => setFaq(i, { a: e.target.value })} maxLength={2000} />
                  <div><Button type="button" variant="secondary" onClick={() => setForm({ faqs: edit.form.faqs.filter((_, j) => j !== i) })}>Remove</Button></div>
                </div>
              ))}
              {edit.form.faqs.length < 30 && <Button type="button" variant="secondary" onClick={() => setForm({ faqs: [...edit.form.faqs, { q: '', a: '' }] })}>Add a question</Button>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save page'}</Button>
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
              {edit.row.override && <Button type="button" variant="secondary" onClick={reset}>Reset to automatic</Button>}
            </div>
          </form>
        </Card>
      )}

      {preview && (
        <Card title={`Preview: ${preview.name}`} action={<Button variant="secondary" onClick={() => setPreview(null)}>Close preview</Button>}>
          <iframe title={`Preview of ${preview.name}`} sandbox="" srcDoc={preview.html} className="h-[32rem] w-full rounded-xl border border-line bg-surface" />
        </Card>
      )}
    </div>
  );
}
