# SND · Vault Visual Redesign — Design Spec

**Date:** 2026-05-22
**Branch:** `feat/snd-vault-restyle`
**Handoff source:** `/home/jascha/Downloads/SND.DX.PE.zip` → `design_handoff_vault_send_redesign/`

## Goal

Apply the **Vault** visual system from the handoff to the existing tarnover/send screens, with no functional changes. Rebrand all surfaced text from "Send" / "Snd" to strict uppercase **"SND"**.

## Non-goals (explicit)

The handoff describes a richer experience than current tarnover/send. None of the following are in scope here — they are future work, not part of this restyle:

- No encryption-pipeline step list (`00 read file → 05 mint share token`).
- No manifest-preview button or screen.
- No palette switcher (sage / amber / violet). Sage only.
- No light-mode toggle. Dark only.
- No command bar, no `/` Vim-style filter shortcut.
- No new copy beyond the brand rename.
- No new dialog or screen types. Dialogs are restyled in place.

## Constraints

- Keep the choo framework. No React introduction.
- Keep all existing routes and templates intact: `app/ui/home.js`, `app/ui/download.js`, `app/ui/downloadPassword.js`, `app/ui/downloadCompleted.js`, `app/ui/archiveTile.js`, `app/ui/header.js`, `app/ui/footer.js`, `app/ui/copyDialog.js`, `app/ui/okDialog.js`, `app/ui/shareDialog.js`, `app/ui/qr.js`, `app/ui/modal.js`, `app/ui/error.js`, `app/ui/notFound.js`, `app/ui/unsupported.js`, `app/ui/intro.js`.
- Tailwind stays in the build chain. New tokens are CSS custom properties layered alongside Tailwind utilities. We do not migrate to or away from Tailwind.
- Inter is already loaded via `/inter.css`. Add JetBrains Mono via the same mechanism (self-hosted CSS, not Google Fonts CDN — preserves CSP and offline behaviour).

## Visual system

### Palette — sage, dark only

CSS custom properties on `:root`. No mode switch.

```css
:root {
  --snd-bg:          #0e0f0d;
  --snd-surface:     rgba(22,24,21,0.05);   /* 5% text over bg, used inside dropzones / code blocks */
  --snd-card:        #181a17;
  --snd-line:        rgba(232,230,223,0.06); /* 1px hairlines, all borders */
  --snd-text:        #e8e6df;
  --snd-mute:        #8a8c85;
  --snd-dim:         #5a5c55;
  --snd-accent:      #a8d4a8;
  --snd-accent-text: #0e0f0d;
  --snd-danger:      #d68a78;
}
```

### Typography

```css
:root {
  --snd-font-sans: 'Inter', 'Inter Tight', system-ui, sans-serif;
  --snd-font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
}
```

Inter loaded with feature settings `"ss01","cv11"` and tight tracking (`-0.005em` body, `-0.02em` display). Tabular numerals enabled (`font-variant-numeric: tabular-nums`).

Scale (CSS classes, applied via existing `class=` attributes in choo templates):

| Class | Family | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `.snd-display-xl` | sans | clamp(36px,5vw,48px) | 500 | -0.02em | Hero headlines |
| `.snd-display` | sans | clamp(26px,3vw,32px) | 500 | -0.01em | Screen titles |
| `.snd-body` | sans | 16px | 400 | -0.005em | Prose |
| `.snd-body-sm` | sans | 13px | 400 | -0.005em | Secondary copy |
| `.snd-numeric-xl` | mono | 96px | 300 | -0.04em | Big upload-% |
| `.snd-numeric` | mono | 24px | 500 | 0 | File names, key values |
| `.snd-code` | mono | 14px | 400 | 0 | URLs, hashes, share IDs |
| `.snd-code-sm` | mono | 12px | 400 | 0 | File meta |
| `.snd-tag` | mono | 10px | 400 | 0.08em (uppercase) | Section labels |
| `.snd-tick` | mono | 10px | 400 | 0.1em | Status-bar tags |
| `.snd-caption` | mono | 11px | 400 | 0.05em | `> derived in 186ms` style notes |

### Borders, radius, shadows

- All borders **1px solid `var(--snd-line)`**.
- **No `border-radius` anywhere** (drop the existing rounded buttons, rounded cards, rounded modal corners).
- **No drop shadows.** Elevation is conveyed via hairlines and surface tint shifts only.
- Dashed border (1.5px dashed `var(--snd-line)`) is reserved for: the dropzone, and section-header underlines under tag labels.

### Buttons

Map existing `.btn` (currently `@apply bg-primary text-white py-4 px-6 font-semibold`) to:

```css
.snd-btn {
  font: 400 12px var(--snd-font-mono);
  letter-spacing: 0.02em;
  padding: 10px 18px;
  border: 1px solid var(--snd-line);
  background: rgba(232,230,223,0.05);
  color: var(--snd-text);
  cursor: pointer;
}
.snd-btn--primary { background: var(--snd-accent); color: var(--snd-accent-text); border-color: transparent; }
.snd-btn--ghost   { background: transparent; }
.snd-btn--danger  { background: rgba(232,230,223,0.05); color: var(--snd-danger); border-color: rgba(214,138,120,0.40); }
.snd-btn--full    { width: 100%; }
.snd-btn:hover    { /* +4% lightness on background */ }
```

Lowercase labels (do not uppercase). The button is the only place we use `letter-spacing: 0.02em` on monospace at body size.

### Inputs

Replace bordered/rounded inputs with underline-on-focus:

```css
.snd-input {
  font: 500 22px var(--snd-font-mono);
  letter-spacing: 0; /* 0.3em only for masked password input */
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid var(--snd-line);
  color: var(--snd-text);
  outline: none;
}
.snd-input:focus { border-bottom-color: var(--snd-accent); }
```

### Focus rings

Replace browser default + existing dotted outlines:

```css
:focus-visible {
  outline: 2px solid var(--snd-accent);
  outline-offset: 2px;
}
```

## Screen mapping (handoff → existing)

| Handoff screen | Existing template | Restyle notes |
|---|---|---|
| 01 Upload — idle | `app/ui/home.js` + `app/ui/intro.js` | Apply 2-column layout (`1fr 380px`), Vault dropzone, `Sect` numbered headers around existing expiry / dl-limit / password controls (`expiryOptions.js`, `selectbox.js`). Keep all behaviour; just swap the chrome. |
| 02 Upload — in progress | Existing in-progress state in `home.js` / `archiveTile.js` | Restyle the progress bar and stats. Big-numeric % uses `.snd-numeric-xl`. **Step list is out of scope** — the existing single progress bar stays, just restyled. |
| 03 Upload complete | `app/ui/shareDialog.js` (modal) or `home.js` post-upload | Restyle the share URL display as the Vault code-block, with `mute`/`text`/`accent` phases on the URL. Right-rail `<Field>` rows render via a small CSS-only helper (label + value spans). |
| 04 Recipient download | `app/ui/download.js` | Apply the centered card layout, the 72×72 lock square, the 3-column Field grid (expires / downloads left / encrypted). The primary action button label changes per i18n key, not hardcoded. |
| 05 Password download | `app/ui/downloadPassword.js` | Centered hero stack with the 64×64 lock square. Replace existing password input styling with the `.snd-input` underline + letter-spacing approach. Attempts counter and error flash on wrong password. |
| 06 My uploads | `app/ui/archiveTile.js` (the tile list) | Convert tile-list to 6-column grid table per handoff. Header row in `.snd-tag` style. Expired rows at `opacity: 0.45`. Inline `copy · edit · del` actions. |

### Header / footer / status bar

- `app/ui/header.js` → Vault nav: left brand mark + "SND" wordmark, center nav items (active item with `border-bottom: 1px solid var(--snd-accent)`), right status indicator (`● active · v3.4.27`). Existing l10n keys for nav stay.
- Add a status-bar component (`app/ui/statusBar.js`, ~30 LOC) rendered as the body's last child — left side technical claim, right side reassurance. **One new file, no new logic.** This is a passive informational strip; it does not introduce a new feature.
- `app/ui/footer.js` — restyle to mono 11px `dim`; keep existing sponsor link / source link semantics from the recent PR #9 rework.

### Mobile QR default on the share-complete screen

On viewports `≤768px` (mobile breakpoint), the share-complete screen (`shareDialog.js` / post-upload state) defaults to showing the QR code expanded, with the URL row below it as the secondary affordance. On desktop (`>768px`), the URL is primary and the QR is opened via the existing button. No new logic — only a CSS-driven default state and a small JS guard so that on mount at a mobile width the QR canvas renders eagerly instead of lazily.

`app/ui/qr.js` already produces the QR canvas; this is a presentation change, not a new component.

### Dialogs (`modal.js`, `copyDialog.js`, `okDialog.js`, `shareDialog.js`, `qr.js`, `signupDialog.js`, `surveyDialog.js`)

Restyle to Vault: hairline-bordered card centered on a dimmed backdrop. No rounded corners. Dialog title in `.snd-display`, body in `.snd-body`. Action row at the bottom uses `.snd-btn` variants. Dismiss "×" becomes a mono character in `var(--snd-mute)`. Backdrop is `rgba(14,15,13,0.7)` over the page (no blur).

### Logo / brand mark

22×22 inline SVG: square outlined in `var(--snd-accent)` with a centered mono "S". One source location used in:

- Header (`app/ui/header.js`).
- Favicon SVG (`assets/icon.svg`) — replace existing icon with the new mark.
- Webmanifest icon set — regenerate from the SVG (PNG sizes 192/512/touch/16/32 stay at their existing paths; only the source changes).

## Brand rename (strict "SND")

All English-source occurrences of "Send" / "Snd" / "send·vault" / similar update to **"SND"** (uppercase). This includes:

- `server/config.js` — `custom_title` default `'Snd'` → `'SND'`; `custom_description` default already in English.
- `public/locales/en-US/send.ftl` — `title = Snd` → `title = SND`; any prose like "Snd" in headlines/buttons updated.
- All other `public/locales/*/send.ftl` files — replace literal `title = Snd` with `title = SND`. Non-English prose strings (e.g., the Arabic transliteration) are out of scope; they continue to fall back to English `title` via Fluent if the locale's value is empty, otherwise stay as-is. **The product display name is a proper noun; uppercase in all locales.**
- `<title>` is driven by `state.title` from the locale's `title` key, so updating the ftl files covers it.
- `package.json` `description` — update if it references "Snd"/"Send" branding.
- Anywhere a `Snd` literal exists in JSX/HTML/JS — rename.

Locale grep verification step belongs in the implementation plan, not here.

## File-level change inventory

**New files:**
- `app/ui/tokens.css` — CSS custom properties + utility classes from the Visual System section.
- `app/ui/statusBar.js` — passive status-bar strip.
- `assets/snd-mark.svg` — 22×22 brand mark (inline in `header.js` is fine too — the plan picks one; do not ship both).

**Modified files (existing logic preserved):**
- `app/main.css` — drop the rounded `.btn`, the violet gradient, the bg.svg `body` rule. Import `tokens.css` at the top.
- `app/ui/home.js`, `download.js`, `downloadPassword.js`, `downloadCompleted.js`, `archiveTile.js`, `header.js`, `footer.js`, `intro.js`, `error.js`, `notFound.js`, `unsupported.js`, `expiryOptions.js`, `selectbox.js`, `modal.js`, `copyDialog.js`, `okDialog.js`, `shareDialog.js`, `qr.js`, `signupDialog.js`, `surveyDialog.js`, `body.js` — class-name and structural markup edits only.
- `server/layout.js` — add JetBrains Mono `<link>` next to the existing inter.css link. Update default `<meta name="theme-color">` from `#220033` to `#0e0f0d`.
- `server/config.js` — `custom_title` default.
- `public/locales/*/send.ftl` — `title` value (32 files; mechanical replace).
- `assets/icon.svg` — replace with new brand mark.
- `assets/bg.svg` — delete (no background image in Vault).
- `assets/android-chrome-192x192.png`, `assets/android-chrome-512x512.png`, `assets/apple-touch-icon.png`, `assets/favicon-16x16.png`, `assets/favicon-32x32.png`, `assets/icon-64x64.png` — regenerate from the new `assets/icon.svg` so PWA install and tab icons match the new mark.
- `package.json` — description field if branded.

**Removed files:**
- `assets/bg.svg`.

## Acceptance criteria

1. Every existing route renders without console errors and preserves its full functional behaviour (upload, encrypt, share, download, password gate, archive list, dialogs).
2. The six handoff screens are visually recognisable in the running app at 1280×820, matching tokens (palette, type, borders, no radius, no shadows).
3. Below 900px viewport: home stacks columns, archive table collapses to a stacked list per row, dialogs clamp padding.
4. At ≤768px (mobile), the share-complete screen renders the QR code expanded by default, with the URL below it. At >768px the URL is primary and the QR opens via the existing button.
5. No occurrence of "Snd" or "Send" as a literal product name in any English-source string — confirmed by `grep -ri '\b\(Snd\|Send\)\b'` across `app/`, `server/`, `public/locales/en-US/`, `package.json`.
6. No `border-radius` declaration in `app/**/*.css` other than `0` (or none).
7. No drop-shadow declaration in `app/**/*.css`.
8. `npm run lint:css` and `npm run lint:js` pass.
9. Backend tests still pass (`npm run test:backend`).
10. Tab icon, PWA install icon, and apple-touch-icon match the new brand mark (manual visual check + file diff against the regenerated PNGs).

## Open questions deferred to implementation plan

- The exact path and webpack copy/asset rule for the self-hosted JetBrains Mono `.woff2` file (the strategic decision is self-hosted to keep CSP intact and avoid CDN dependency at runtime — the plan picks the path and the loader rule).
- Exact responsive breakpoints — handoff only states "≤900px stack" and this spec adds a "≤768px mobile" rule for the QR default. Plan should enumerate the full breakpoint ladder (likely 768 / 900 / 1280) and confirm what each one toggles.

## Out-of-tree dependencies

None. No new runtime npm deps. JetBrains Mono is added as a font file (build-time asset) only.
