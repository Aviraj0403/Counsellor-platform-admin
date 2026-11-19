import Axios from '../../shared/api/Axios';

// Organisation audit (leads, ledger) for the logged-in organisation's owner
export const orgAudit = (params) => Axios.get('/audit', { params });

// Platform audit (who created / changed / suspended organisations, modules, plans, invoices, staff): platform staff only
export const platformAudit = (params) => Axios.get('/platform/audit', { params });
