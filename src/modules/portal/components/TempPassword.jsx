import { Button, Modal } from '../../../shared/ui/ui';

/** Shown ONCE after an invite: the temporary password cannot be seen again. */
export default function TempPassword({ result, onClose }) {
  return (
    <Modal title="Login created" onClose={onClose}>
      <p className="text-sm">
        Share these details with <b>{result.invite.name}</b> now. The password is shown only once.
      </p>
      <dl className="mt-3 space-y-2 rounded-xl border border-line p-3 text-sm">
        <div><dt className="text-fg-muted">Email</dt><dd className="font-medium">{result.invite.email}</dd></div>
        <div><dt className="text-fg-muted">Temporary password</dt><dd className="select-all font-mono font-medium">{result.temporaryPassword}</dd></div>
      </dl>
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
