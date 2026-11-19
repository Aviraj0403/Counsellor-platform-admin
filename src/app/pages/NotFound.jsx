import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/ui/ui';
import { useI18n } from '../../shared/i18n/languageContext.js';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('page.notFound', 'Page not found')} />
      <Link to="/" className="text-sm text-brand-600 dark:text-brand-300 hover:underline">← Back to home</Link>
    </>
  );
}
