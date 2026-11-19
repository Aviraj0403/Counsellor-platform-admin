# Theming rule (light and dark mode)

One rule keeps every admin screen looking the same in light and dark mode:

**Never hard-code a light-only colour. Use the theme tokens. Give coloured chips a `dark:` partner.**

The tokens are defined once in `src/index.css` and switch automatically with the theme (classic, beauty, ocean, emerald, slate) and with light / dark.

## Use these instead

| Instead of | Use |
|---|---|
| `bg-white`, `bg-slate-50` / `100` / `200` / `300` (also gray, zinc) | `bg-surface` (cards, panels, inputs) or `bg-surface-2` (page areas, table heads, hover rows) |
| `text-slate-900` / `800` | `text-fg` |
| `text-slate-700` / `600` | `text-fg-secondary` |
| `text-slate-500` / `400` | `text-fg-muted` |
| `border-slate-100` ... `400`, `divide-slate-*` | `border-line`, `divide-line` |
| `hover:bg-slate-50` / `100` | `hover:bg-surface-2` |

## Coloured chips, badges, banners and gradients

A pastel colour is only readable on a light page, so give it a `dark:` partner **in the same class string**:

```jsx
// status badge
<span className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">

// gradient header
<div className="bg-gradient-to-r from-orange-50 to-white dark:from-orange-500/10 dark:to-transparent">
```

Pattern: `bg-X-50 / 100` -> `dark:bg-X-500/10 / 15` · `text-X-600..900` -> `dark:text-X-300` · `border-X-100..300` -> `dark:border-X-500/30` · `from/to-X-50` or `to-white` -> `dark:from-X-500/10` / `dark:to-transparent`.

## What is allowed as is

- `text-white` on a coloured button, translucent overlays such as `bg-black/50` or `bg-white/10`, and deliberately dark surfaces (`bg-slate-900`, `bg-zinc-900` with white text).
- The round white knob of a toggle switch (`rounded-full bg-white shadow transition-transform`): it stays white in both themes. The checker allows this automatically.
- A screen that is light on purpose (the printable invoice, the login screens) opts out with a first-line comment: `// theme-lint: allow-light (reason)`.

## How the rule is enforced

```
npm run check:theme            # fails if any file uses a light-only colour without a token or dark: partner
npm run check:theme -- --all   # lists every violation with file and line
```

It runs in CI (`.github/workflows/CI-CD.yml`) next to lint and build. The baseline in `scripts/theme-baseline.json` is empty, so **no new violation is allowed anywhere**. If you ever have to accept existing violations, `-- --update` rewrites the baseline; counts may only go down.

## Quick fix for an old page

1. `npm run check:theme -- --all` shows the lines.
2. Swap the neutral classes for the tokens above and add `dark:` partners to coloured chips.
3. Open the page, switch to dark mode, and check that no panel, table head, input or popup stays white.
