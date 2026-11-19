import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Field, Input, PageHeader, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import { formatINR, rupeesToPaise } from '../../../shared/lib/format';
import * as api from '../api';

const LANGS = [['en', 'English'], ['hi', 'Hindi'], ['hinglish', 'Hinglish']];

export default function BotSettings() {
  const { t } = useI18n();
  const { can } = useAuth();
  const manage = can('bots:manage');
  const [s, setS] = useState(null);
  const [words, setWords] = useState('');
  const [budget, setBudget] = useState('');
  const [busy, setBusy] = useState(false);

  const fill = (d) => {
    setS(d);
    setWords(d.handoffKeywords.join(', '));
    setBudget(String(d.monthlyBudgetPaise / 100));
  };
  useEffect(() => { api.getSettings().then(({ data }) => fill(data)).catch(toastError); }, []);
  if (!s) return <Spinner />;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const num = (k) => (e) => setS({ ...s, [k]: e.target.value === '' ? '' : Number(e.target.value) });

  const save = async (e) => {
    e.preventDefault();
    const paise = rupeesToPaise(budget || '0');
    if (Number.isNaN(paise)) return toast.error('Enter the monthly limit in rupees, for example 500.');
    setBusy(true);
    try {
      const body = {
        enabled: s.enabled, name: s.name, greeting: s.greeting, languages: s.languages, workingHoursNote: s.workingHoursNote, consentText: s.consentText,
        publicChannelEnabled: s.publicChannelEnabled, retentionDays: Number(s.retentionDays), dailyMessageCap: Number(s.dailyMessageCap), monthlyBudgetPaise: paise,
        handoffKeywords: words.split(',').map((w) => w.trim()).filter(Boolean),
        ...(s.orgSlug && { orgSlug: s.orgSlug }),
      };
      const { data } = await api.saveSettings(body);
      fill(data);
      toast.success('Assistant settings saved.');
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  const toggleLang = (code) => setS({ ...s, languages: s.languages.includes(code) ? s.languages.filter((l) => l !== code) : [...s.languages, code] });
  const copy = () => navigator.clipboard?.writeText(s.embedSnippet).then(() => toast.success('Copied.'), () => toast.error('Could not copy. Select the text and copy it.'));

  return (
    <div className="space-y-4">
      <PageHeader title={t('page.botSettings', 'Assistant settings')} subtitle="An AI assistant that answers student questions from YOUR college list, collects enquiry details, books counselling calls and hands over to your team." />
      <Card title="AI connection">
        <p className="text-sm">
          Status: {s.configured ? <Badge tone="green">AI key set on the server</Badge> : <Badge tone="red">Offline: no AI key set</Badge>} <span className="ml-2 text-fg-muted">Model: {s.model}</span>
        </p>
        <p className="mt-1 text-xs text-fg-muted">The key and the model are set by your platform contact on the server (ANTHROPIC_API_KEY, AI_MODEL). Without a key the assistant tells visitors it is offline.</p>
      </Card>
      <form onSubmit={save} className="space-y-4">
        <Card title="Assistant">
          <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" disabled={!manage} checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Switch the assistant on</label>
          <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" disabled={!manage} checked={s.publicChannelEnabled} onChange={(e) => setS({ ...s, publicChannelEnabled: e.target.checked })} /> Allow it on your website (public chat)</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Organisation address" hint="The short address your platform contact gave you. Needed for the website chat."><Input disabled={!manage} value={s.orgSlug} onChange={set('orgSlug')} maxLength={60} /></Field>
            <Field label="Assistant name"><Input disabled={!manage} value={s.name} onChange={set('name')} maxLength={60} /></Field>
          </div>
          <div className="mt-3"><Field label="Greeting shown before the first message" hint="The assistant always tells students it is an AI in its first reply."><Input disabled={!manage} value={s.greeting} onChange={set('greeting')} maxLength={400} /></Field></div>
          <div className="mt-3"><Field label="Consent line shown to students" hint="Students must accept this before chatting. Keep it clear and honest. Have a lawyer review it."><Input disabled={!manage} value={s.consentText} onChange={set('consentText')} maxLength={400} /></Field></div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm"><span className="font-medium text-fg-secondary">Languages</span>{LANGS.map(([c, l]) => <label key={c} className="flex items-center gap-1"><input type="checkbox" disabled={!manage} checked={s.languages.includes(c)} onChange={() => toggleLang(c)} />{l}</label>)}</div>
          <div className="mt-3"><Field label="Office hours note (optional)" hint="For example: Mon-Sat 10am-6pm. The assistant can mention it."><Input disabled={!manage} value={s.workingHoursNote} onChange={set('workingHoursNote')} maxLength={200} /></Field></div>
        </Card>
        <Card title="Hand over to a counsellor">
          <Field label="Extra words that hand the chat to your team" hint={`Separate with commas. Always active: ${s.defaultHandoffKeywords.join(', ')}. It also hands over when a student asks for a person, sounds upset, or may be under 18 and gives no guardian.`}><Input disabled={!manage} value={words} onChange={(e) => setWords(e.target.value)} placeholder="visa, scholarship" /></Field>
        </Card>
        <Card title="Privacy and cost limits">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Keep chats for (days)" hint="Chats are deleted after this."><Input type="number" min={1} max={365} disabled={!manage} value={s.retentionDays} onChange={num('retentionDays')} /></Field>
            <Field label="Messages per day" hint="0 = no limit. The assistant pauses when reached."><Input type="number" min={0} disabled={!manage} value={s.dailyMessageCap} onChange={num('dailyMessageCap')} /></Field>
            <Field label="Monthly AI limit (rupees)" hint={`0 = no limit. Now ${formatINR(s.monthlyBudgetPaise)}.`}><Input disabled={!manage} value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" /></Field>
          </div>
        </Card>
        {manage && <Button type="submit" loading={busy}>Save settings</Button>}
      </form>
      <Card title="Add the chat to your website">
        {s.embedSnippet ? (
          <>
            <p className="mb-2 text-sm text-fg-muted">Paste this where you want the chat to appear. It uses {s.publicUrl}. The chat shows your consent line before students write.</p>
            <textarea readOnly className="field-input h-40 w-full font-mono text-xs" value={s.embedSnippet} />
            <div className="mt-2"><Button variant="secondary" onClick={copy}>Copy</Button></div>
          </>
        ) : <p className="text-sm text-fg-muted">Enter your organisation address above and save to get the website snippet.</p>}
      </Card>
    </div>
  );
}
