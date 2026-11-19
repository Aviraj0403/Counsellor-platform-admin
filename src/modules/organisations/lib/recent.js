/** The last few organisations platform staff opened, newest first (kept in this browser only; ids are not secret). */
const KEY = 'cp.recentOrganisations';
const MAX = 8;

export const readRecent = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const rememberOrganisation = (id) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([id, ...readRecent().filter((x) => x !== id)].slice(0, MAX)));
  } catch {
    /* private mode or storage blocked: the switcher simply sorts by name */
  }
};

/** Recently opened first (in that order), then the rest by name. */
export const sortByRecent = (orgs, recent) => {
  const rank = new Map(recent.map((id, i) => [id, i]));
  return [...orgs].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Infinity;
    const rb = rank.has(b.id) ? rank.get(b.id) : Infinity;
    return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
  });
};
