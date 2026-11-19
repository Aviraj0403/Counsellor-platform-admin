import { API_BASE_URL } from '../../../shared/api/apiConfig';
import { downloadLink } from '../api';

/** Asks for a short-lived signed link (audited on the server) and opens it in a new tab. */
export const openDocument = async (id) => {
  const { data } = await downloadLink(id);
  const origin = API_BASE_URL.replace(/\/api\/v1$/, '');
  window.open(`${origin}${data.url}`, '_blank', 'noopener');
};
