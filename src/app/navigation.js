import { MODULES } from './modules';

/**
 * THE menu, assembled from every module's `nav` entries. An item shows only when the logged-in user passes ALL its checks:
 *   perm   -> their role has this permission
 *   module -> (organisation users) the feature is switched on for their organisation
 *   scope  -> 'platform' (our staff) or 'tenant' (a counsellor organisation)
 * Every item except Home and Account carries a scope, so a platform person never sees organisation screens (leads, students...)
 * and an organisation user never sees platform screens. The two audiences simply use different sections of this one list.
 *
 * Platform staff:  Overview, Organisations, Revenue and billing, Research and insights, Platform settings, Account
 * Organisations:   Overview, Leads and sales, Admissions, Counselling, Finance, Marketing and channels, Developers, My organisation, Account
 */
export const SECTION_ORDER = [
  'Overview',
  // platform staff
  'Organisations',
  'Revenue and billing',
  'Research and insights',
  'Platform settings',
  // organisation users
  'Leads and sales',
  'Admissions',
  'Counselling',
  'Finance',
  'Marketing and channels',
  'Developers',
  'My organisation',
  'Account',
];

// Placement fixes for entries whose module file is owned elsewhere. Prefer editing the module's own `nav` entry.
const PLACEMENT = {
  '/integrations/meta': { section: 'Marketing and channels', order: 20 },
};

export const NAV = SECTION_ORDER.map((section) => ({
  section,
  items: MODULES.flatMap((m) => m.nav ?? [])
    .map((i) => ({ ...i, ...(PLACEMENT[i.to] || {}) }))
    .filter((i) => i.section === section)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
})).filter((s) => s.items.length > 0);
