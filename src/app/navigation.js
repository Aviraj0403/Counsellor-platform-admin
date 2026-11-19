import { MODULES } from './modules';

/**
 * THE menu, assembled from every module's `nav` entries. An item shows only when the logged-in user passes ALL its checks:
 *   perm   -> their role has this permission
 *   module -> (organisation users) the feature is switched on for their organisation
 *   scope  -> 'platform' (our staff) or 'tenant' (a counsellor organisation)
 */
const SECTION_ORDER = ['Overview', 'Platform', 'My organisation', 'Account'];

export const NAV = SECTION_ORDER.map((section) => ({
  section,
  items: MODULES.flatMap((m) => m.nav ?? [])
    .filter((i) => i.section === section)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
})).filter((s) => s.items.length > 0);
