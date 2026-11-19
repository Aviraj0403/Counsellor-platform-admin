import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, PageHeader } from '../../../shared/ui/ui';
import useAuth from '../hooks/useAuth';

export default function Unauthorized({ consoleOnly = false }) {
  const { acting, stopActing } = useAuth();
  const navigate = useNavigate();
  // Platform console pages (organisations, billing...) are not part of an organisation's admin: staff reach them by leaving the organisation.
  if (acting && consoleOnly) {
    const exit = async () => {
      await stopActing().catch(() => {});
      navigate('/');
    };
    return (
      <>
        <PageHeader title="This page belongs to the platform console" />
        <Card>
          <p className="text-sm text-fg-secondary">You are viewing {acting.tenantName} as platform support. Exit to the console to use platform pages such as organisations and billing.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={exit}>Exit to console</Button>
            <Link to="/" className="inline-flex h-9 items-center text-sm text-brand-600 hover:underline dark:text-brand-300">← Back to the organisation</Link>
          </div>
        </Card>
      </>
    );
  }
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
