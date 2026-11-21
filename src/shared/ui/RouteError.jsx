import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './ui';

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage =
    error?.statusText ||
    error?.message ||
    (typeof error === 'string' ? error : 'An unexpected runtime error occurred.');

  const isStaleChunk =
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('Importing a module script failed');

  return (
    <div className="flex min-h-dvh items-center justify-center bg-mesh p-4 text-fg">
      <div className="surface-card card-pad relative z-10 w-full max-w-lg border border-line p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
          {isStaleChunk ? (
            <RefreshCw size={28} className="animate-spin text-brand-500" />
          ) : (
            <AlertTriangle size={28} />
          )}
        </div>

        <h2 className="text-xl font-bold tracking-tight text-fg">
          {isStaleChunk ? 'Updating to Latest Version…' : 'Something went wrong'}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {isStaleChunk
            ? 'A new version of the platform was deployed. Reloading page assets...'
            : 'The view encountered an error while rendering. You can refresh or return to the safety of the main dashboard.'}
        </p>

        {process.env.NODE_ENV !== 'production' || !isStaleChunk ? (
          <div className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-surface-2 p-3 text-left font-mono text-xs text-rose-500 border border-line">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="primary"
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Refresh page
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2"
          >
            <Home size={16} /> Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

