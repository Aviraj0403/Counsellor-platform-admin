import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../../../shared/ui/ui';
import { useCatalog } from '../../catalog';
import { SUPPORT_EMAIL } from '../../../shared/api/apiConfig';

export default function ModuleOff({ module }) {
  const catalog = useCatalog();
  const def = catalog?.modules.find((m) => m.key === module);
  return (
    <>
      <PageHeader title={`${def?.label || 'This feature'} is not switched on`} />
      <Card>
        <p className="text-sm text-fg-secondary">{def?.whatItDoes}</p>
        <p className="mt-3 text-sm text-fg-secondary">
          This feature is not part of your organisation’s plan yet.{' '}
          {SUPPORT_EMAIL ? <>Contact <a className="text-brand-600 dark:text-brand-300 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> to switch it on.</> : 'Contact support to switch it on.'}
        </p>
        <p className="mt-3 text-sm"><Link to="/" className="text-brand-600 dark:text-brand-300 hover:underline">← Back to home</Link></p>
      </Card>
    </>
  );
}
