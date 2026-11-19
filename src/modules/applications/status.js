import { humanize } from '../../shared/lib/format';

export const STATUSES = ['draft', 'documents_pending', 'ready_to_submit', 'submitted', 'under_review', 'offered', 'accepted', 'fee_paid', 'admitted', 'rejected', 'declined', 'withdrawn'];
export const TONE = { draft: 'gray', documents_pending: 'amber', ready_to_submit: 'blue', submitted: 'blue', under_review: 'blue', offered: 'amber', accepted: 'amber', fee_paid: 'green', admitted: 'green', rejected: 'red', declined: 'red', withdrawn: 'gray' };
export const statusLabel = (s) => humanize(s || '');
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const intakeLabel = (i) => (i ? `${MONTHS[i.month - 1]} ${i.year}` : '');
