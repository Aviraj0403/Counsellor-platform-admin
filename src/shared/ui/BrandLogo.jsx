// theme-lint: allow-light (the FastAdmission artwork is drawn on white, so its tile stays white in every theme)
import { cx } from '../lib/cx.js';

/**
 * The FastAdmission mark (from fastadmission.in) in a white tile, optionally with the wordmark.
 *  - size   : 'sm' (32px) | 'md' (40px) | 'lg' (56px) | 'xl' (72px)
 *  - tone   : 'auto' follows the theme text colour, 'light' is for dark / photo backgrounds
 *  - full   : use the full lock-up (ribbon + book) instead of the emblem only; best from 'lg' up
 */
const TILE = { sm: 'h-8 w-8 rounded-[10px]', md: 'h-10 w-10 rounded-xl', lg: 'h-14 w-14 rounded-2xl', xl: 'h-[72px] w-[72px] rounded-[20px]' };
const WORD = { sm: 'text-[13px]', md: 'text-[15px]', lg: 'text-xl', xl: 'text-2xl' };

export function BrandMark({ size = 'md', full = false, className = '' }) {
  return (
    <span
      className={cx('relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-inset ring-black/[0.07]', TILE[size], className)}
      aria-hidden="true"
    >
      <img src={full ? '/brand-logo.png' : '/brand-mark.png'} alt="" width="256" height="256" className={cx('h-full w-full object-contain', full ? 'p-0.5' : 'p-[3px]')} draggable="false" />
    </span>
  );
}

export default function BrandLogo({ size = 'md', tone = 'auto', full = false, wordmark = true, sub = '', className = '' }) {
  const light = tone === 'light';
  return (
    <span className={cx('inline-flex min-w-0 items-center gap-3', className)}>
      <BrandMark size={size} full={full} />
      {wordmark && (
        <span className="min-w-0 leading-none">
          <span style={{ fontWeight: 800 }} className={cx('block truncate tracking-tight', WORD[size], light ? 'text-white' : 'text-fg')}>
            FAST<span className={light ? 'text-sky-300' : 'text-brand-500'}>ADMISSION</span>
          </span>
          {sub && <span className={cx('mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em]', light ? 'text-white/60' : 'text-fg-muted')}>{sub}</span>}
        </span>
      )}
    </span>
  );
}
