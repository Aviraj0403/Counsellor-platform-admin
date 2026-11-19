import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../../../shared/ui/ui';

export default function Unauthorized() {
  return (
    <>
      <PageHeader title="You do not have access to this page" />
      <Card>
        <p className="text-sm text-fg-secondary">Your role does not include this action. If you need it, ask your organisation owner to change your role.</p>
        <p className="mt-3 text-sm"><Link to="/" className="text-brand-600 dark:text-brand-300 hover:underline">← Back to home</Link></p>
      </Card>
    </>
  );
}
