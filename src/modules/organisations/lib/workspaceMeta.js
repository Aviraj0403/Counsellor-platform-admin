import { BarChart3, BookOpen, Bot, Building2, CalendarClock, FileText, FolderLock, GraduationCap, Landmark, ListChecks, Megaphone, MessageCircle, Percent, Search, UserCheck, Users, UsersRound, Webhook, Puzzle } from 'lucide-react';

/** Module key -> icon. Unknown keys fall back to a puzzle piece so a new module never breaks the screen. */
const ICONS = {
  leads: Users,
  team: UsersRound,
  followups: ListChecks,
  ledger: BookOpen,
  commissions: Percent,
  students: GraduationCap,
  colleges: Landmark,
  applications: FileText,
  documents: FolderLock,
  reports: BarChart3,
  whatsapp: MessageCircle,
  metaAds: Megaphone,
  seoPages: Search,
  publicApi: Webhook,
  studentPortal: UserCheck,
  collegePortal: Building2,
  appointments: CalendarClock,
  aiBot: Bot,
};
export const iconFor = (key) => ICONS[key] || Puzzle;

export const GROUPS = { crm: 'CRM', admissions: 'Admissions', finance: 'Finance', marketing: 'Marketing', channels: 'Channels', platform: 'Platform' };

/** Modules that connect this organisation to something outside the product. */
export const INTEGRATION_KEYS = ['whatsapp', 'metaAds', 'publicApi', 'seoPages', 'aiBot', 'appointments'];

export const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'modules', label: 'Modules' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'billing', label: 'Billing' },
  { key: 'team', label: 'Team' },
  { key: 'activity', label: 'Activity' },
];
export const TAB_KEYS = TABS.map((t) => t.key);

/** What the badge on a module card says, from the API's config object. Pure: easy to reason about. */
export const statusOf = (m) => {
  if (!m.enabled) return { tone: 'gray', label: m.requested && m.dependsOnUnmet?.length ? 'Waiting for another module' : 'Off' };
  const c = m.config;
  if (!c) return { tone: 'gray', label: 'On' };
  if (c.health === 'attention') return { tone: 'amber', label: 'Needs attention' };
  if (c.configured === null && c.health === 'off') return { tone: 'gray', label: 'Status not reported yet' };
  if (c.configured === null) return { tone: 'green', label: 'On' };
  return { tone: 'green', label: 'Working' };
};

export const formatValue = (v) => (v === true ? 'Yes' : v === false ? 'No' : v === null || v === undefined ? '-' : String(v));
