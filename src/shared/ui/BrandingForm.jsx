import { useState } from 'react';
import { Button, Field, Input } from './ui.jsx';
import OrgAvatar from './OrgAvatar.jsx';

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Logo URL + brand colour editor with a live preview (the same OrgAvatar the sidebar, switcher and lists use).
 * `onSave` receives only the fields that changed; an emptied field is sent as '' to clear it.
 * Used by the platform workspace (staff) and by "My organisation profile" (owner).
 */
export default function BrandingForm({ name, logoUrl = '', brandColor = '', onSave, saving = false }) {
  const [logo, setLogo] = useState(logoUrl || '');
  const [color, setColor] = useState(brandColor || '');
  const trimmed = logo.trim();
  const logoOk = trimmed === '' || /^https:\/\/\S+$/i.test(trimmed);
  const colorOk = color === '' || HEX.test(color);
  const changed = trimmed !== (logoUrl || '') || color !== (brandColor || '');

  const submit = (e) => {
    e.preventDefault();
    const body = {};
    if (trimmed !== (logoUrl || '')) body.logoUrl = trimmed || null;
    if (color !== (brandColor || '')) body.brandColor = color || null;
    onSave(body);
  };

  return (
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-start gap-2">
        <p className="text-eyebrow">Preview</p>
        <OrgAvatar name={name} logoUrl={logoOk ? trimmed : ''} brandColor={colorOk ? color : ''} size="lg" />
        <p className="text-caption max-w-[10rem]">Shown in the menu, switcher and lists. Without a logo, coloured initials are used.</p>
      </div>
      <div className="grid gap-4">
        <Field label="Logo URL" hint={logoOk ? 'A public https:// link to a square image (PNG, SVG or JPG).' : 'Use a full https:// link.'}>
          <Input type="url" inputMode="url" placeholder="https://example.com/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} aria-invalid={!logoOk} />
        </Field>
        <Field label="Brand colour" hint={colorOk ? 'Used as a small accent only. Leave empty for the default.' : 'Use a colour like #1a73e8.'}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick a brand colour"
              value={HEX.test(color) ? color : '#6366f1'}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
            />
            <Input value={color} placeholder="#1a73e8" maxLength={7} onChange={(e) => setColor(e.target.value.trim())} aria-invalid={!colorOk} className="max-w-[10rem] font-mono" />
            {color && (
              <Button variant="ghost" size="sm" onClick={() => setColor('')}>
                Clear
              </Button>
            )}
          </div>
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={saving} disabled={!changed || !logoOk || !colorOk}>
            Save branding
          </Button>
        </div>
      </div>
    </form>
  );
}
