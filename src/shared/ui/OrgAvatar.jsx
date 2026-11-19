import { useState } from 'react';
import { cx } from '../lib/cx.js';
import { TONE_ORDER } from './tones.js';

const SIZES = {
  xs: 'h-5 w-5 rounded-md text-[9px]',
  sm: 'h-8 w-8 rounded-lg text-[11px]',
  md: 'h-10 w-10 rounded-xl text-sm',
  lg: 'h-14 w-14 rounded-2xl text-lg',
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Up to two initials from an organisation name. */
const initialsOf = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
  return letters.toUpperCase();
};

// Same name -> same accent tone everywhere, so an organisation without a logo is still recognisable.
const toneFor = (name = '') => {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONE_ORDER[h % TONE_ORDER.length];
};

// Readable text on an arbitrary brand colour: pick black or white by relative luminance.
const inkFor = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0f172a' : '#ffffff';
};

/**
 * An organisation's logo. Shows `logoUrl` when it loads; when it is empty or fails to load (broken link, blocked host)
 * it falls back to coloured initials (the organisation's brand colour when set, otherwise a stable theme tone).
 * The fallback is decided per URL, so fixing the URL shows the logo again without a reload.
 */
export default function OrgAvatar({ name = '', logoUrl = '', brandColor = '', size = 'md', className = '' }) {
  const [failed, setFailed] = useState('');
  const showImage = !!logoUrl && failed !== logoUrl;
  const brand = HEX.test(brandColor || '') ? brandColor : '';
  const base = cx('inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold leading-none ring-1 ring-inset ring-line', SIZES[size] || SIZES.md, className);

  if (showImage) {
    return (
      <span className={cx(base, 'bg-surface')} data-org-avatar="logo">
        <img src={logoUrl} alt={name ? `${name} logo` : 'Organisation logo'} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(logoUrl)} className="h-full w-full object-contain" />
      </span>
    );
  }
  if (brand) {
    return (
      <span className={base} style={{ backgroundColor: brand, color: inkFor(brand) }} role="img" aria-label={name || 'Organisation'} data-org-avatar="initials">
        {initialsOf(name)}
      </span>
    );
  }
  return (
    <span className={cx(base, `tone-${toneFor(name)} tone-chip`)} role="img" aria-label={name || 'Organisation'} data-org-avatar="initials">
      {initialsOf(name)}
    </span>
  );
}
