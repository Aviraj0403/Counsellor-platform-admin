# Counsellor Platform Admin

Admin web app for the counsellor platform. **Separate repo from the API** (`../counsellor-platform`), same as
`central-ecommerce-admin` is separate from `central-ecommerce`. It only talks to the API over HTTP, so any problem
is on one side of a visible line: see `../counsellor-platform/docs/RUNBOOK.md` section 3 ("Which side is broken?").

Stack (same as the ecommerce admin): Vite 7, React 19, Tailwind CSS 4, react-router 7, axios, JSX.

## Look and switches (same design system as `central-ecommerce-admin`)
- **Appearance switch** (palette button in the header, also on the sign-in page): 5 colour themes (Classic, Beauty, Ocean, Emerald, Slate), Light / Dark / System, Compact / Comfortable density. Remembered per browser; applied before first paint (`public/theme-init.js`).
- **Language switch**: English / हिन्दी (`src/shared/i18n`). The menu, header, appearance panel, sign-in and every page title are translated. Page bodies (table headings, form labels, long help texts) are still English and fall back to it cleanly: translate them by adding keys to `en.js` and `hi.js` (`npm run check:i18n` keeps both files in step).
- **Switch organisation** (platform staff only, header): searchable list of organisations; picking one opens its management page (modules, plan and billing, status, recent changes). Unlike "Switch project" in the ecommerce admin it does **not** open the organisation's leads or students: platform staff never browse student data. If you later want real "support access", it needs its own audited, time-limited design.
- Collapsible floating sidebar (icon rail on desktop, drawer on phones), page search in the header, breadcrumb pill, themed toasts.
- **One colour rule** (`docs/THEMING.md`, enforced by `npm run check:theme`): never hard-code a light-only colour; use `bg-surface`, `text-fg`, `border-line` and give coloured chips a `dark:` partner.
- Design-system files copied from `central-ecommerce-admin` live in `src/app/index.css` and `src/shared/ui/` (Card, Button, Badge, PageHeader, ThemePicker...). `src/shared/ui/ui.jsx` is the small kit pages import; it is built on them.

## Sign-in page image
The sign-in page is split-screen: brand panel on the left (hidden on phones), form on the right. Put your photo at `public/login-hero.jpg` (about 1600x1200, landscape, not too busy: white text sits on a dark overlay), or set `VITE_LOGIN_IMAGE` in `.env` to another path or URL. If the file is missing the panel falls back to the brand gradient with a dot pattern.

## Menu sections
Platform staff see: Overview, Organisations, Revenue and billing, Research and insights, Platform settings, Account. Organisation users see: Overview, Leads and sales, Admissions, Counselling, Finance, Marketing and channels, Developers, My organisation, Account. Set `section`, `order` and `scope` in each module's `nav`; the section order lives in `src/app/navigation.js`.

## Run
```bash
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:4100/api/v1
npm install
npm run dev              # http://localhost:5173
```
The API must be running (`npm run dev` in `../counsellor-platform`) and its `CORS_ORIGINS` must contain `http://localhost:5173`.

## How the screens decide what to show
One call, `GET /me`, returns the user, their **permissions** and (for organisations) the **modules** switched on.
- `src/app/navigation.js`: the menu, built from every module's `nav` entries. An item appears only if the user has its `perm`, its `module` is on, and the `scope` matches.
- `src/modules/auth/components/Guard.jsx`: wraps each page with the same checks and shows a friendly message instead of a broken screen.
- The API repeats every check. The UI only guides, the API is the real gate.
- Module and role lists (names, plain-language descriptions, prices, "coming soon") come from `GET /catalog/*`. Nothing is hard-coded here.

## Screens built
| Screen | Who | API |
|---|---|---|
| Sign in, My account (password, log out everywhere) | everyone | `/auth/*` |
| Home (who am I, what can I do, which features are on) | everyone | `/me`, `/catalog/*` |
| Organisations: list, create, open | Super Admin, Platform Ops | `/platform/tenants` |
| Organisation: rename, suspend, **switch modules on/off**, recent changes | same | `/platform/tenants/:id/*` |
| Platform audit | Super Admin, Ops, Finance | `/platform/audit` |
| Leads: list, filter, add, move stage | organisation roles with leads access | `/leads` |
| Team & roles: add, change role, reset password, block | Owner | `/team` |
| Activity log | Owner | `/audit` |

**Not built yet:** Excel import, student/college/application screens (their modules are "coming soon" in the API).

## Structure (module-based)
```
src/
  app/        composition only: main.jsx, router.jsx, Layout.jsx, navigation.js, modules.js (the list of modules), pages/NotFound
  shared/     reusable, no business screens: ui/ (components), api/ (Axios client, session, config), lib/ (format, error text)
  modules/    one folder per feature, all the same shape:
    <name>/
      api.js          every HTTP call of this feature
      pages/          the screens
      components/     pieces used by those screens (optional)
      module.jsx      this feature's routes and menu entries (read only by app/modules.js)
      index.js        PUBLIC API: the only thing other modules may import (optional)
```
Modules: `auth` (login, guards, account) · `catalog` (module/role lists) · `dashboard` · `organisations` · `billing` (plans, invoices, costs, overview, per-organisation billing) ·
`insights` · `audit` · `leads` · `ledger` · `team`.

Rules (checked by `npm run check:architecture`, also in CI): `shared/` imports only `shared/`; a module imports another module **only through its `index.js`**;
modules never import `app/`; no module cycles; every cross-module dependency is pinned in `scripts/check-architecture.mjs`, so adding one is a deliberate edit.

## Debugging
- Every error toast ends with `[ref: <id>]`. That is the API's request id: search it in the API logs to see exactly what happened.
- "Cannot reach the server": API down, wrong `VITE_API_BASE_URL`, or CORS (add this app's origin to the API's `CORS_ORIGINS`).
- Redirected to sign-in unexpectedly: the session was ended (password change, "log out everywhere", blocked user, suspended organisation).
- Browser DevTools -> Network -> the failing request -> Response shows `{ error: { code, message, requestId } }`.

## Add a feature (the 4 steps)
1. `src/modules/<name>/api.js`: one function per endpoint
2. `src/modules/<name>/pages/<Thing>.jsx`: use `shared/ui/ui.jsx`, show errors with `toastError`
3. `src/modules/<name>/module.jsx`: its routes (wrapped in `<Guard perm=... module=...>`) and menu entries
4. `src/app/modules.js`: one line importing it. Routes and the sidebar update by themselves.

## Known limits
- Login token is kept in `sessionStorage` (per tab, signs out when the tab closes). The ecommerce admin uses httpOnly cookies + refresh;
  that needs matching API work (refresh tokens are on the API roadmap).
- No automated UI tests yet; only lint and build run in CI.

## Deploy
Vercel (see `vercel.json`: security headers, SPA rewrite). Set `VITE_API_BASE_URL` in the Vercel project, and add the deployed
origin to the API's `CORS_ORIGINS`.

## Added: finance, research and ledger screens
| Screen | Who | API |
|---|---|---|
| Home: platform overview (MRR, invoiced, collected, costs, margin, adoption) | Super Admin, Finance | `/platform/dashboard` |
| Plans & pricing | Super Admin, Finance | `/platform/plans` |
| Organisation: Billing card (plan, negotiated prices, live charge preview, issue invoice) | same | `/platform/tenants/:id/billing|plan|pricing|invoices` |
| Invoices (mark paid / void) | same | `/platform/invoices` |
| Platform costs | same | `/platform/costs` |
| Research: lead-source conversion, usage per organisation (counts only) | Super Admin, Ops, Finance | `/platform/insights/*` |
| Ledger: trial balance, post entry, entries, reverse | Owner, Accounts (module on) | `/ledger/*` |
