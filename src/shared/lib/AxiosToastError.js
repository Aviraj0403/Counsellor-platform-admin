import toast from 'react-hot-toast';

/**
 * Turns any failed request into one readable sentence for the admin.
 * The "ref" is the API's requestId: give it to a developer and they can find that exact request in the API logs
 * (see counsellor-platform/docs/RUNBOOK.md section 4).
 */
export const errorText = (err) => {
  const e = err?.response?.data?.error;
  if (e) {
    const fields = Array.isArray(e.details) ? e.details.map((d) => `${d.field}: ${d.problem}`).join('; ') : '';
    return `${e.message}${fields ? ` (${fields})` : ''}${e.requestId ? `  [ref: ${e.requestId}]` : ''}`;
  }
  if (err?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your internet, that the API is running, and that its CORS_ORIGINS allows this site.';
  }
  if (err?.code === 'ECONNABORTED') return 'The server took too long to answer. Please try again.';
  return err?.message || 'Something went wrong.';
};

export const toastError = (err) => toast.error(errorText(err), { duration: 7000 });
