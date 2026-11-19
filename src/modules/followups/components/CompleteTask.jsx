import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Field, Input, Modal } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';

/** Asks "what happened?" and marks a task done. */
export default function CompleteTask({ task, onClose, onDone }) {
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.completeTask(task._id, outcome.trim() || undefined);
      toast.success('Task completed.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Complete task" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-fg-secondary">{task.title}</p>
        <Field label="Outcome (optional)" hint="What happened? For example: spoke to parent, will visit on Friday.">
          <Input value={outcome} maxLength={500} onChange={(e) => setOutcome(e.target.value)} autoFocus />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>Mark done</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
