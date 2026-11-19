export const humanize = (s = '') => s.replace(/[._]/g, ' ');
export const formatDate = (d) => (d ? new Date(d).toLocaleString() : '');
export const slugify = (s = '') =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
/** The API stores money as whole paise. Show rupees. */
export const formatINR = (paise) => inr.format((paise || 0) / 100);

/**
 * Rupees typed by a person ("1999", "499.50") -> whole paise, without floating-point maths.
 * Returns NaN for anything that is not a plain amount with at most 2 decimals.
 */
export const rupeesToPaise = (text) => {
  const t = String(text).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  const [r, p = ''] = t.split('.');
  return Number(r) * 100 + Number(p.padEnd(2, '0'));
};

export const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
