/**
 * Shared accent tones. Tone NAMES are stable (indigo, emerald, amber, rose, sky, violet,
 * orange, teal); their actual colour comes from the active colour theme via CSS variables
 * (`--tone-<name>` in src/index.css), so switching theme recolours every consumer.
 * Each class string is self-sufficient (carries its own `tone-<name>` class).
 */
export const TONE_ORDER = ["indigo", "emerald", "amber", "rose", "sky", "violet", "orange", "teal"];

const make = (n) => ({
  chip: `tone-${n} tone-chip`,
  wash: `tone-${n} tone-wash`,
  glow: `tone-${n} tone-glow`,
  border: `tone-${n} tone-border`,
  bar: `tone-${n} tone-bar`,
  text: `tone-${n} tone-text`,
  /** CSS colour usable in SVG attributes / inline styles (resolves per theme). */
  hex: `var(--tone-${n})`,
  base: `tone-${n}`,
});

export const TONE_STYLES = Object.fromEntries(TONE_ORDER.map((n) => [n, make(n)]));
Object.values(TONE_STYLES).forEach((t) => { t.disc = t.chip; });

/** Map semantic tone names (success/danger/...) onto accent tones. */
export const SEMANTIC_TONE = { brand: "indigo", success: "emerald", warning: "amber", danger: "rose", info: "sky", neutral: "indigo" };
export const resolveTone = (t, fallbackIndex = 0) =>
  TONE_STYLES[t] ? t : TONE_STYLES[SEMANTIC_TONE[t]] ? SEMANTIC_TONE[t] : TONE_ORDER[fallbackIndex % TONE_ORDER.length];

/**
 * Sidebar nav accents (themed):
 *  icon = inactive icon colour, pill = active pill, dot = section marker.
 */
export const NAV_TONE = Object.fromEntries(
  TONE_ORDER.map((n) => [n, {
    icon: `tone-${n} tone-icon`,
    pill: `tone-${n} nav-pill`,
    dot: `tone-${n} tone-dot`,
  }])
);
Object.values(NAV_TONE).forEach((t) => { t.active = t.pill; });
