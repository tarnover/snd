# SND Vault Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Vault visual system (sage palette, dark only, hairline borders, no radius/shadows, Inter + JetBrains Mono) to the existing tarnover/send screens without changing functional behaviour, and rebrand all English-source product-name strings to strict uppercase "SND".

**Architecture:** CSS-only token layer (`app/ui/tokens.css` with CSS custom properties + utility classes) layered over the existing Tailwind build. choo templates in `app/ui/*.js` get their classes and inline markup rewritten — no framework change, no route change, no new screens. The one new JS file is a passive `statusBar.js`. Branding is a mechanical rename across 32 locale ftl files plus a handful of config/manifest sites.

**Tech stack:** choo, Tailwind (kept), Webpack 4 build, Fluent l10n, plain CSS custom properties for the new tokens.

**Spec:** `docs/superpowers/specs/2026-05-22-snd-vault-redesign-design.md`

**Branch:** `feat/snd-vault-restyle` (already created from `origin/master`).

---

## Phase A — Foundation

### Task 1: Create the token layer (`app/ui/tokens.css`)

**Files:**
- Create: `app/ui/tokens.css`

- [ ] **Step 1: Create `app/ui/tokens.css` with full content below**

```css
/* SND Vault tokens — sage palette, dark only.
   Spec: docs/superpowers/specs/2026-05-22-snd-vault-redesign-design.md */

:root {
  --snd-bg:          #0e0f0d;
  --snd-surface:     rgba(22, 24, 21, 0.05);
  --snd-card:        #181a17;
  --snd-line:        rgba(232, 230, 223, 0.06);
  --snd-text:        #e8e6df;
  --snd-mute:        #8a8c85;
  --snd-dim:         #5a5c55;
  --snd-accent:      #a8d4a8;
  --snd-accent-text: #0e0f0d;
  --snd-danger:      #d68a78;

  --snd-font-sans: 'Inter', 'Inter Tight', system-ui, sans-serif;
  --snd-font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
}

html, body {
  background: var(--snd-bg);
  color: var(--snd-text);
  font-family: var(--snd-font-sans);
  font-feature-settings: 'ss01', 'cv11';
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.005em;
}

/* Type scale */
.snd-display-xl { font-family: var(--snd-font-sans); font-size: clamp(36px, 5vw, 48px); font-weight: 500; letter-spacing: -0.02em; line-height: 1.1; }
.snd-display    { font-family: var(--snd-font-sans); font-size: clamp(26px, 3vw, 32px); font-weight: 500; letter-spacing: -0.01em; line-height: 1.15; }
.snd-body       { font-family: var(--snd-font-sans); font-size: 16px; font-weight: 400; line-height: 1.55; color: var(--snd-text); }
.snd-body-sm    { font-family: var(--snd-font-sans); font-size: 13px; font-weight: 400; line-height: 1.5; color: var(--snd-mute); }
.snd-numeric-xl { font-family: var(--snd-font-mono); font-size: 96px; font-weight: 300; letter-spacing: -0.04em; line-height: 1; }
.snd-numeric    { font-family: var(--snd-font-mono); font-size: 24px; font-weight: 500; }
.snd-code       { font-family: var(--snd-font-mono); font-size: 14px; font-weight: 400; word-break: break-all; }
.snd-code-sm    { font-family: var(--snd-font-mono); font-size: 12px; font-weight: 400; color: var(--snd-mute); }
.snd-tag        { font-family: var(--snd-font-mono); font-size: 10px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; color: var(--snd-dim); }
.snd-tick       { font-family: var(--snd-font-mono); font-size: 10px; font-weight: 400; letter-spacing: 0.1em; color: var(--snd-dim); }
.snd-caption    { font-family: var(--snd-font-mono); font-size: 11px; font-weight: 400; letter-spacing: 0.05em; color: var(--snd-dim); }

/* Buttons */
.snd-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: 400 12px var(--snd-font-mono);
  letter-spacing: 0.02em;
  padding: 10px 18px;
  border: 1px solid var(--snd-line);
  background: rgba(232, 230, 223, 0.05);
  color: var(--snd-text);
  cursor: pointer;
  text-decoration: none;
  border-radius: 0;
  transition: background-color 120ms ease;
}
.snd-btn:hover { background: rgba(232, 230, 223, 0.09); }
.snd-btn--primary { background: var(--snd-accent); color: var(--snd-accent-text); border-color: transparent; }
.snd-btn--primary:hover { background: #b8dcb8; }
.snd-btn--ghost { background: transparent; }
.snd-btn--danger { background: rgba(232, 230, 223, 0.05); color: var(--snd-danger); border-color: rgba(214, 138, 120, 0.40); }
.snd-btn--full { width: 100%; }

/* Inputs */
.snd-input {
  font: 500 22px var(--snd-font-mono);
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid var(--snd-line);
  color: var(--snd-text);
  outline: none;
  width: 100%;
  border-radius: 0;
}
.snd-input:focus { border-bottom-color: var(--snd-accent); }
.snd-input--mask { letter-spacing: 0.3em; }

/* Cards / surfaces */
.snd-card    { background: transparent; border: 1px solid var(--snd-line); padding: 24px; border-radius: 0; }
.snd-surface { background: var(--snd-surface); }
.snd-line    { border: 1px solid var(--snd-line); }

/* Hairline divider helpers */
.snd-hr        { border: 0; border-top: 1px solid var(--snd-line); margin: 24px 0; }
.snd-hr-dashed { border: 0; border-top: 1px dashed var(--snd-line); margin: 24px 0; }

/* Dropzone */
.snd-dropzone {
  border: 1.5px dashed var(--snd-line);
  background: linear-gradient(135deg, rgba(232, 230, 223, 0.03), transparent 60%);
  padding: 56px 24px;
  text-align: center;
  cursor: pointer;
  border-radius: 0;
}

/* Color helpers */
.snd-text-mute   { color: var(--snd-mute); }
.snd-text-dim    { color: var(--snd-dim); }
.snd-text-accent { color: var(--snd-accent); }
.snd-text-danger { color: var(--snd-danger); }

/* Focus ring */
:focus-visible {
  outline: 2px solid var(--snd-accent);
  outline-offset: 2px;
}

/* Square everything by default for snd-* containers */
.snd-card, .snd-btn, .snd-input, .snd-dropzone { border-radius: 0; }
```

- [ ] **Step 2: Verify the file exists and is non-empty**

Run: `wc -l app/ui/tokens.css`
Expected: at least 60 lines.

- [ ] **Step 3: Commit**

```bash
git add app/ui/tokens.css
git commit -m "feat(snd): add Vault design tokens (sage palette, type, components)"
```

---

### Task 2: Wire tokens into `app/main.css` and strip Vault-conflicting styles

**Files:**
- Modify: `app/main.css`

- [ ] **Step 1: Read the current `app/main.css`**

Run: `cat app/main.css | head -120`

Confirm these blocks are present and will be removed: `body { background-image: url('../assets/bg.svg'); … }`, the `.btn` rule with `@apply bg-primary @apply text-white @apply py-4 @apply px-6 @apply font-semibold`, the `.btn:hover` rule, and the `--violet-gradient` custom property.

- [ ] **Step 2: Edit `app/main.css`** — replace the top of the file (everything from the `@tailwind base;` line through `:not(input) { user-select: none; }`) with this block:

```css
@import './ui/tokens.css';

@tailwind base;

html {
  line-height: 1.15;
}

@tailwind components;

:not(input):not(textarea) {
  user-select: none;
}
```

(Note: the existing rule was `:not(input)` — we widen it to `:not(input):not(textarea)` because the SND inputs may be `<textarea>` for some flows. If no textareas exist anywhere, keep `:not(input)`.)

- [ ] **Step 3: Remove the `:root { --violet-gradient: … }` block in `app/main.css`**

Delete the entire block:

```css
:root {
  --violet-gradient: linear-gradient(
    -180deg,
    rgb(144 89 255 / 80%) 0%,
    rgb(144 89 255 / 40%) 100%
  );
}
```

- [ ] **Step 4: Remove the `body { background-image: url('../assets/bg.svg'); … }` rule from `app/main.css`**

Delete the entire `body { … }` block that references `bg.svg`. The body styles now come from `tokens.css`.

- [ ] **Step 5: Remove or rewrite the `.btn` and `.btn:hover` rules in `app/main.css`**

Delete:

```css
.btn { @apply bg-primary; @apply text-white; @apply cursor-pointer; @apply py-4; @apply px-6; @apply font-semibold; }
.btn:hover { @apply bg-primary_accent; }
```

Templates that still reference `class="btn"` will be migrated to `class="snd-btn snd-btn--primary"` in later tasks. To keep the build green in the interim, add a one-line compatibility alias in `app/main.css` after the `@tailwind` lines:

```css
.btn { /* legacy alias — removed once all templates migrate */
  @apply snd-btn snd-btn--primary;
}
```

(The `@apply` is acceptable here because PostCSS resolves it; if PostCSS fails on the snd-* names, swap to a plain duplicate of the snd-btn rules. Verify in Step 6.)

- [ ] **Step 6: Build to verify CSS compiles**

Run: `npm run build 2>&1 | tail -30`
Expected: webpack finishes without "Module build failed" errors related to CSS. Warnings about deprecated `@apply` usage are OK.

If the `@apply snd-btn snd-btn--primary;` line errors, replace the `.btn` block with a hand-written copy of the snd-btn + snd-btn--primary properties.

- [ ] **Step 7: Commit**

```bash
git add app/main.css
git commit -m "feat(snd): wire tokens.css; drop violet gradient, bg image, and legacy .btn styles"
```

---

### Task 3: Add JetBrains Mono font as a self-hosted asset

**Files:**
- Create: `assets/fonts/JetBrainsMono-Regular.woff2`
- Create: `assets/fonts/JetBrainsMono-Medium.woff2`
- Create: `app/jetbrains-mono.css`
- Modify: `app/main.js` (import the new CSS)
- Modify: `webpack.config.js` (font asset rule, if needed)

- [ ] **Step 1: Verify webpack already handles `.woff2` files**

Run: `grep -nE 'woff2?|file-loader|asset' webpack.config.js | head -20`
Expected: a file-loader / asset module rule for `woff2?`. If none exists, add one in Step 4. If one exists, the woff2 files copy automatically.

- [ ] **Step 2: Download JetBrains Mono woff2 files (regular and medium)**

Run:

```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/JetBrainsMono-Regular.woff2 \
  https://github.com/JetBrains/JetBrainsMono/raw/v2.304/fonts/webfonts/JetBrainsMono-Regular.woff2
curl -L -o assets/fonts/JetBrainsMono-Medium.woff2 \
  https://github.com/JetBrains/JetBrainsMono/raw/v2.304/fonts/webfonts/JetBrainsMono-Medium.woff2
```

Expected: two files, each ~30-50 KB. Run `file assets/fonts/JetBrainsMono-Regular.woff2` — output should mention "Web Open Font Format". If curl fails (offline / firewall), fall back to fetching v2.304 from npm: `npm pack jetbrains-mono` and copy from the tarball.

- [ ] **Step 3: Create `app/jetbrains-mono.css`**

```css
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/JetBrainsMono-Regular.woff2') format('woff2');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('../assets/fonts/JetBrainsMono-Medium.woff2') format('woff2');
}
```

- [ ] **Step 4: Import the font CSS from `app/main.js`**

In `app/main.js`, find the existing `import './main.css';` line and add immediately above it:

```js
import './jetbrains-mono.css';
```

- [ ] **Step 5: Build to verify the font assets emit**

Run: `npm run build 2>&1 | tail -20 && ls dist/ | grep -i jetbrains`
Expected: webpack succeeds; the JetBrains Mono woff2 files appear in `dist/` with content-hashed filenames.

If webpack does NOT have a woff2 rule, add this to `webpack.config.js` inside the `module.rules` array:

```js
{
  test: /\.woff2?$/,
  loader: 'file-loader',
  options: { name: '[name].[contenthash:8].[ext]' }
}
```

- [ ] **Step 6: Commit**

```bash
git add assets/fonts/JetBrainsMono-Regular.woff2 assets/fonts/JetBrainsMono-Medium.woff2 app/jetbrains-mono.css app/main.js
# Add webpack.config.js if you modified it
git commit -m "feat(snd): self-host JetBrains Mono (regular + medium)"
```

---

### Task 4: Update `server/layout.js` (theme-color, viewport, meta)

**Files:**
- Modify: `server/layout.js`

- [ ] **Step 1: Read `server/layout.js`**

Run: `cat server/layout.js | head -80`

Locate the `<meta name="theme-color" content="#220033" />` and `<meta name="msapplication-TileColor" content="#220033" />` lines.

- [ ] **Step 2: Replace the theme-color and TileColor values**

In `server/layout.js`, change both `content="#220033"` strings to `content="#0e0f0d"`.

- [ ] **Step 3: Verify the inter.css link line is present**

`grep -n 'inter.css' server/layout.js`
Expected: one match. No change needed — the JetBrains Mono CSS is bundled via `main.js` import, not via a separate `<link>`.

- [ ] **Step 4: Build and smoke-test the layout**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add server/layout.js
git commit -m "feat(snd): switch theme-color and tile-color to Vault bg (#0e0f0d)"
```

---

## Phase B — Brand rename to strict "SND"

### Task 5: Rename `title = Snd` to `title = SND` across all locale ftl files

**Files:**
- Modify: all files matching `public/locales/*/send.ftl` that contain `title = Snd`

- [ ] **Step 1: List affected files**

Run: `grep -l '^title = Snd$' public/locales/*/send.ftl | wc -l`
Expected: a number around 30 (one per supported locale that uses the literal "Snd").

- [ ] **Step 2: Apply the rename in-place**

Run:

```bash
grep -l '^title = Snd$' public/locales/*/send.ftl | xargs sed -i 's/^title = Snd$/title = SND/'
```

- [ ] **Step 3: Verify no `title = Snd` lines remain**

Run: `grep -rn '^title = Snd$' public/locales/`
Expected: no output (exit code 1 from grep).

Also verify the replacement landed:

`grep -rn '^title = SND$' public/locales/ | wc -l`
Expected: same number as Step 1.

- [ ] **Step 4: Handle non-Latin-script locales with their own product-name spelling**

Run: `grep -n '^title =' public/locales/*/send.ftl | grep -v 'SND'`
Expected: rows that show locales which spell the product name in their script (e.g. Arabic `فَيَرفُكس سِنْد`, Russian transliterations). For each match, replace the value with `SND` (the spec says the product name is a proper noun used uppercase in all locales).

For each such file, edit the `title = …` line to read `title = SND`.

- [ ] **Step 5: Final verification — every locale's `title` is exactly `SND`**

Run:

```bash
for f in public/locales/*/send.ftl; do
  v=$(grep '^title =' "$f" | head -1 | sed 's/^title = //')
  if [ "$v" != "SND" ]; then echo "BAD: $f → $v"; fi
done
```

Expected: no output. If any "BAD:" lines appear, fix them.

- [ ] **Step 6: Commit**

```bash
git add public/locales
git commit -m "feat(snd): rename product name to strict uppercase SND across all locales"
```

---

### Task 6: Update `server/config.js` defaults and `package.json`

**Files:**
- Modify: `server/config.js`
- Modify: `package.json`

- [ ] **Step 1: Update the `custom_title` default**

In `server/config.js`, find the `custom_title` field and change `default: 'Snd'` to `default: 'SND'`.

- [ ] **Step 2: Inspect `package.json` for brand strings**

Run: `grep -nE '"name"|"description"|"homepage"' package.json`
Expected output includes lines like `"description": "File Sharing Experiment"`.

- [ ] **Step 3: If `package.json` `description` references "Send" / "Snd", update it to SND**

If the description does NOT reference the brand, leave it. The current `"description": "File Sharing Experiment"` is generic — no change required.

- [ ] **Step 4: Build to confirm config loads**

Run: `node -e "console.log(require('./server/config.js').custom_title)"`
Expected: `SND`

- [ ] **Step 5: Commit**

```bash
git add server/config.js package.json
git commit -m "feat(snd): default custom_title to SND in server config"
```

---

### Task 7: Sweep `app/` and `server/` JS for hardcoded "Snd" / "Send" literals

**Files:**
- Modify: any file under `app/` or `server/` that contains a literal `'Snd'`, `"Snd"`, `'Send'`, or `"Send"` referring to the product

- [ ] **Step 1: Find candidate occurrences**

Run:

```bash
grep -rnE "'(Snd|Send)'|\"(Snd|Send)\"" app/ server/ \
  --include='*.js' --include='*.css' --include='*.json' \
  | grep -v node_modules
```

Expected: a list of matches. Some will be irrelevant (e.g. method names like `Send`, variable names, npm dep entries) — those are NOT product-name strings.

- [ ] **Step 2: For each genuine product-name occurrence, update it to `SND`**

A genuine match is one where the literal is rendered as user-facing text or a brand reference (e.g. `navigator.share({ title: 'Send' })`, `alt="Snd"`, comments will be skipped). For each: replace `'Snd'` → `'SND'`, `'Send'` → `'SND'`, etc.

Specifically inspect:
- `app/ui/archiveTile.js` near line 313: the `navigator.share` call uses `state.translate('-send-brand')` — leave the l10n key alone; that's resolved from the ftl files which are already updated.
- `app/ui/archiveTile.js` near line 315: `Download "${archive.name}" with Send: simple, safe file sharing` — replace `with Send:` with `with SND:`.

- [ ] **Step 3: Verify the sweep is complete**

Run:

```bash
grep -rnE "'(Snd|Send)'|\"(Snd|Send)\"|\\bSnd\\b|\\bSend\\b" app/ --include='*.js' \
  | grep -v 'node_modules' \
  | grep -v 'fileSender\|fileReceiver\|getSender\|onSend\|sender\.\|send\.js'
```

Expected: no remaining occurrences of the brand as a user-facing string. (The grep `-v` clauses exclude variable / function names that happen to contain "send".)

- [ ] **Step 4: Commit**

```bash
git add -u app/ server/
git commit -m "feat(snd): replace hardcoded Send/Snd brand literals in client code"
```

---

## Phase C — Brand mark and icon system

### Task 8: Replace `assets/icon.svg` with the 22×22 mono-S mark

**Files:**
- Modify: `assets/icon.svg`

- [ ] **Step 1: Inspect the current `assets/icon.svg`** (so we know its viewBox conventions and can match)

Run: `head -20 assets/icon.svg`

- [ ] **Step 2: Replace the full file content with the Vault brand mark**

Overwrite `assets/icon.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="22" height="22">
  <rect x="0.75" y="0.75" width="20.5" height="20.5" fill="none" stroke="#a8d4a8" stroke-width="1.5"/>
  <text x="11" y="15.6" text-anchor="middle"
        font-family="'JetBrains Mono', ui-monospace, monospace"
        font-size="13" font-weight="500" fill="#e8e6df"
        letter-spacing="0">S</text>
</svg>
```

- [ ] **Step 3: Visually confirm the SVG renders**

If a desktop browser is available: `xdg-open assets/icon.svg`. The result should be a square with thin sage outline and a centered cream "S".

If no display, skip visual confirmation — Task 9 (PNG regen) will surface rendering issues.

- [ ] **Step 4: Commit**

```bash
git add assets/icon.svg
git commit -m "feat(snd): replace icon.svg with Vault 22x22 mono-S mark"
```

---

### Task 9: Regenerate PNG icons from the new SVG

**Files:**
- Modify: `assets/android-chrome-192x192.png`, `assets/android-chrome-512x512.png`, `assets/apple-touch-icon.png`, `assets/favicon-16x16.png`, `assets/favicon-32x32.png`, `assets/icon-64x64.png`

- [ ] **Step 1: Pick a rasterizer**

Try `rsvg-convert`:
`which rsvg-convert`
If present, use it. If absent, try `inkscape --export-type=png`. If neither, fall back to ImageMagick: `convert -density 384 assets/icon.svg -resize 192x192 …`.

- [ ] **Step 2: Regenerate each PNG using rsvg-convert (preferred)**

```bash
rsvg-convert -w 16  -h 16  assets/icon.svg -o assets/favicon-16x16.png
rsvg-convert -w 32  -h 32  assets/icon.svg -o assets/favicon-32x32.png
rsvg-convert -w 64  -h 64  assets/icon.svg -o assets/icon-64x64.png
rsvg-convert -w 180 -h 180 assets/icon.svg -o assets/apple-touch-icon.png
rsvg-convert -w 192 -h 192 assets/icon.svg -o assets/android-chrome-192x192.png
rsvg-convert -w 512 -h 512 assets/icon.svg -o assets/android-chrome-512x512.png
```

Expected: each `file assets/<name>.png` reports "PNG image data, <size> x <size>".

If using ImageMagick instead, replace with:

```bash
convert -background none -density 600 assets/icon.svg -resize 16x16   assets/favicon-16x16.png
# … etc with the appropriate target size
```

- [ ] **Step 3: Verify each PNG renders**

Run: `for f in assets/*.png; do file "$f"; done | grep -E 'favicon|android|apple|icon-64'`
Expected: every line reports PNG of the correct dimensions.

- [ ] **Step 4: Build to confirm asset hashing still works**

Run: `npm run build 2>&1 | tail -10`
Expected: webpack emits `dist/<name>.<hash>.png` for each.

- [ ] **Step 5: Commit**

```bash
git add assets/*.png
git commit -m "feat(snd): regenerate PWA / favicon PNGs from new SVG mark"
```

---

### Task 10: Remove `assets/bg.svg`

**Files:**
- Delete: `assets/bg.svg`

- [ ] **Step 1: Confirm nothing else references `bg.svg`**

Run: `grep -rn 'bg.svg' app/ server/ assets/`
Expected: no matches. (The only previous reference was the `body { background-image }` rule removed in Task 2.)

- [ ] **Step 2: Delete the file**

`git rm assets/bg.svg`

- [ ] **Step 3: Build to verify nothing breaks**

`npm run build 2>&1 | tail -10`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(snd): drop assets/bg.svg (no background image in Vault)"
```

---

## Phase D — Frame chrome

### Task 11: Restyle `app/ui/header.js`

**Files:**
- Modify: `app/ui/header.js`

- [ ] **Step 1: Read the current file (lines 20-65)**

Run: `sed -n '20,65p' app/ui/header.js`

Note the current header uses an `<img>` tag for the icon and an `<svg><use>` for the wordmark.

- [ ] **Step 2: Replace the `createElement()` body with the Vault nav**

Rewrite the `createElement()` method to render:

```js
createElement() {
  const t = this.state.translate;
  const version = this.state.WEB_UI ? this.state.WEB_UI.VERSION || '' : '';
  const route = (typeof window !== 'undefined') ? window.location.pathname : '/';
  const isActive = path => (path === '/' ? route === '/' : route.startsWith(path));
  return html`
    <header class="snd-nav flex flex-row items-center justify-between w-full" role="banner">
      <a class="snd-brand flex flex-row items-center" href="/" aria-label="SND home">
        <span class="snd-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 22 22" width="22" height="22">
            <rect x="0.75" y="0.75" width="20.5" height="20.5" fill="none" stroke="var(--snd-accent)" stroke-width="1.5"/>
            <text x="11" y="15.6" text-anchor="middle" font-family="var(--snd-font-mono)" font-size="13" font-weight="500" fill="var(--snd-text)">S</text>
          </svg>
        </span>
        <span class="snd-brand-word snd-code">SND</span>
      </a>
      <nav class="snd-nav-items flex flex-row" role="navigation">
        <a class="snd-nav-item ${isActive('/') ? 'is-active' : ''}" href="/">${t('uploadPageHeader')}</a>
      </nav>
      <div class="snd-nav-status snd-code-sm">
        <span class="snd-status-dot" aria-hidden="true"></span>
        <span>e2e ● active</span>
        <span class="snd-text-dim"> · v${version || ''}</span>
        ${this.account.render()}
      </div>
    </header>
  `;
}
```

- [ ] **Step 3: Add the nav-specific styles to `app/ui/tokens.css`**

Append to `app/ui/tokens.css`:

```css
.snd-nav {
  height: 64px;
  padding: 0 32px;
  border-bottom: 1px solid var(--snd-line);
  background: var(--snd-bg);
  z-index: 20;
}
.snd-brand { gap: 12px; text-decoration: none; color: var(--snd-text); }
.snd-brand-mark { display: inline-flex; align-items: center; }
.snd-brand-word { color: var(--snd-text); letter-spacing: 0.02em; }
.snd-brand-word::before { content: ''; }

.snd-nav-items { gap: 24px; }
.snd-nav-item {
  font: 400 12px var(--snd-font-mono);
  color: var(--snd-mute);
  padding: 22px 0;
  border-bottom: 1px solid transparent;
  text-decoration: none;
}
.snd-nav-item:hover { color: var(--snd-text); }
.snd-nav-item.is-active { color: var(--snd-text); border-bottom-color: var(--snd-accent); }

.snd-nav-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--snd-mute);
}
.snd-status-dot {
  width: 6px;
  height: 6px;
  background: var(--snd-accent);
  display: inline-block;
}

@media (max-width: 768px) {
  .snd-nav { padding: 0 16px; }
  .snd-nav-items { display: none; }
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -10`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add app/ui/header.js app/ui/tokens.css
git commit -m "feat(snd): restyle header to Vault nav (brand mark + tabs + e2e status)"
```

---

### Task 12: Create `app/ui/statusBar.js` (passive bottom strip)

**Files:**
- Create: `app/ui/statusBar.js`

- [ ] **Step 1: Create the new file**

```js
const html = require('choo/html');

module.exports = function(state) {
  const t = state.translate;
  // Two informational lines, no behaviour. Strings come from existing l10n if
  // present; otherwise fall back to English defaults that match the Vault spec.
  const left = (t && t('statusBarTechnical')) || 'aes-128-gcm · pbkdf2 · zero-knowledge';
  const right = (t && t('statusBarReassurance')) || 'files encrypted in your browser';
  return html`
    <footer class="snd-statusbar" role="contentinfo" aria-label="security status">
      <span class="snd-tick snd-text-dim">${left}</span>
      <span class="snd-tick snd-text-dim">${right}</span>
    </footer>
  `;
};
```

- [ ] **Step 2: Append the status-bar CSS to `app/ui/tokens.css`**

```css
.snd-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 10px 32px;
  border-top: 1px solid var(--snd-line);
  background: var(--snd-bg);
}
@media (max-width: 768px) {
  .snd-statusbar { padding: 10px 16px; height: auto; flex-direction: column; gap: 4px; }
}
```

- [ ] **Step 3: Build to confirm the file resolves**

`npm run build 2>&1 | tail -5` — should succeed.

- [ ] **Step 4: Commit**

```bash
git add app/ui/statusBar.js app/ui/tokens.css
git commit -m "feat(snd): add passive status bar component"
```

---

### Task 13: Mount the status bar in `app/ui/body.js`

**Files:**
- Modify: `app/ui/body.js`

- [ ] **Step 1: Replace the body's render function**

Rewrite the entire `app/ui/body.js` content to:

```js
const html = require('choo/html');
const Header = require('./header');
const Footer = require('./footer');
const statusBar = require('./statusBar');

module.exports = function body(main) {
  return function(state, emit) {
    const b = html`
      <body class="snd-body-shell flex flex-col">
        ${state.cache(Header, 'header').render()}
        ${main(state, emit)}
        ${state.cache(Footer, 'footer').render()}
        ${statusBar(state)}
      </body>
    `;
    if (state.layout) {
      return state.layout(state, b);
    }
    return b;
  };
};
```

- [ ] **Step 2: Add the body-shell class to `tokens.css`**

Append:

```css
.snd-body-shell {
  min-height: 100vh;
  background: var(--snd-bg);
  color: var(--snd-text);
}
```

- [ ] **Step 3: Build to confirm**

`npm run build 2>&1 | tail -5` — should succeed.

- [ ] **Step 4: Commit**

```bash
git add app/ui/body.js app/ui/tokens.css
git commit -m "feat(snd): wire status bar into body shell"
```

---

### Task 14: Restyle `app/ui/footer.js`

**Files:**
- Modify: `app/ui/footer.js`

- [ ] **Step 1: Replace the inline class strings in the existing footer template with snd-* equivalents**

In `app/ui/footer.js`:

- The outermost `<footer>` tag: replace its class attribute with `class="snd-footer"`.
- Each `<li class="m-2">` becomes `<li class="snd-footer-item">`.
- The two `<ul>` tags: replace classes with `class="snd-footer-list"`.

Keep all internal link logic (`WEB_UI.FOOTER_DONATE_URL`, etc.) and existing `translate(...)` calls unchanged.

- [ ] **Step 2: Append footer styles to `app/ui/tokens.css`**

```css
.snd-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-top: 1px solid var(--snd-line);
  background: var(--snd-bg);
  color: var(--snd-mute);
  font: 400 11px var(--snd-font-mono);
}
.snd-footer-list { display: flex; flex-direction: row; gap: 24px; list-style: none; margin: 0; padding: 0; }
.snd-footer-item a { color: var(--snd-mute); text-decoration: none; }
.snd-footer-item a:hover { color: var(--snd-text); }
@media (max-width: 768px) {
  .snd-footer { flex-direction: column; gap: 8px; padding: 12px 16px; }
  .snd-footer-list { flex-direction: column; gap: 4px; }
}
```

- [ ] **Step 3: Build**

`npm run build 2>&1 | tail -5` — should succeed.

- [ ] **Step 4: Commit**

```bash
git add app/ui/footer.js app/ui/tokens.css
git commit -m "feat(snd): restyle footer to Vault mono-mute aesthetic"
```

---

## Phase E — Screens

### Task 15: Restyle `app/ui/home.js` (page layout)

**Files:**
- Modify: `app/ui/home.js`

- [ ] **Step 1: Replace the `<main>` and `<section>` wrappers**

In `app/ui/home.js`, the existing `return html\`<main class="main">…</main>\`` block uses Tailwind grid classes and `md:rounded-xl md:shadow-big`. Replace the outer tree with:

```js
return html`
  <main class="snd-main">
    ${state.modal && modal(state, emit)}
    <section class="snd-home-grid">
      <div class="snd-home-left">${left}</div>
      <div class="snd-home-right">${right}</div>
    </section>
  </main>
`;
```

Keep the `left`/`right` variable computation (the `state.uploading` / `archive.numFiles > 0` branches) unchanged.

- [ ] **Step 2: Append home-grid styles to `tokens.css`**

```css
.snd-main { width: 100%; flex: 1; display: flex; flex-direction: column; }
.snd-home-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  padding: 32px;
  flex: 1;
  min-height: 0;
}
.snd-home-left, .snd-home-right { min-width: 0; }
.snd-home-right { border-left: 1px solid var(--snd-line); padding-left: 32px; }

@media (max-width: 900px) {
  .snd-home-grid { grid-template-columns: 1fr; gap: 24px; padding: 24px; }
  .snd-home-right { border-left: 0; border-top: 1px solid var(--snd-line); padding-left: 0; padding-top: 24px; }
}
```

- [ ] **Step 3: Build**

`npm run build 2>&1 | tail -5` — should succeed.

- [ ] **Step 4: Commit**

```bash
git add app/ui/home.js app/ui/tokens.css
git commit -m "feat(snd): restyle home layout to 1fr/380px Vault grid"
```

---

### Task 16: Restyle `app/ui/intro.js`

**Files:**
- Modify: `app/ui/intro.js`

- [ ] **Step 1: Read the current file**

Run: `cat app/ui/intro.js`

- [ ] **Step 2: Replace the template's class attributes with snd-* equivalents**

Strip all Tailwind utility classes (`text-3xl font-bold`, `rounded-default`, `shadow-light`, etc.) and replace with snd-* classes from the token sheet (`snd-display-xl`, `snd-body`, `snd-tag`). Keep all `state.translate(...)` calls. The intent: this becomes the "right rail" content seen when the user has no archives yet. Eyebrow `NEW TRANSFER` → tag style, headline → display-xl, body copy → snd-body.

Concretely, rewrite the entire file as:

```js
const html = require('choo/html');

module.exports = function(state) {
  const t = state.translate;
  return html`
    <section class="snd-intro">
      <p class="snd-tag">NEW TRANSFER</p>
      <h1 class="snd-display-xl snd-intro-title">${t('introTitle')}</h1>
      <p class="snd-body snd-intro-body">${t('introDescription')}</p>
    </section>
  `;
};
```

- [ ] **Step 3: Add intro styles**

Append to `tokens.css`:

```css
.snd-intro { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; max-width: 480px; }
.snd-intro-title { color: var(--snd-text); }
.snd-intro-body { color: var(--snd-mute); }
```

- [ ] **Step 4: Build**

`npm run build 2>&1 | tail -5` — should succeed.

- [ ] **Step 5: Commit**

```bash
git add app/ui/intro.js app/ui/tokens.css
git commit -m "feat(snd): restyle intro section to Vault eyebrow + display"
```

---

### Task 17: Restyle `app/ui/archiveTile.js` (all variants)

This file has six exported variants: default tile, `wip`, `uploading`, `empty`, `preview`, `downloading`. All need restyling. Do them together because they share helpers (`fileInfo`, `archiveInfo`, `password`).

**Files:**
- Modify: `app/ui/archiveTile.js`

- [ ] **Step 1: Read the file to confirm structure**

Run: `wc -l app/ui/archiveTile.js && grep -n '^module.exports' app/ui/archiveTile.js`

- [ ] **Step 2: Replace class attributes throughout the file**

For every `class="..."` attribute in the file, strip Tailwind utility classes that affect:
- borders + radius (`border-default`, `rounded-default`, `rounded-lg`, `rounded-t`, `rounded-b`)
- shadows (`shadow-light`, `shadow-big`)
- card-like backgrounds (`bg-white`, `bg-grey-10`, `bg-grey-90`, `bg-yellow-40`, `bg-orange-60`)
- Tailwind text colors (`text-grey-70`, `text-grey-80`, `text-grey-40`)
- old link styling (`link-primary`)

Replace those with snd-* equivalents:
- Card containers → `snd-card`
- File metadata text → `snd-body-sm` or `snd-code-sm`
- File-name headings → `snd-numeric`
- Action links / buttons → `snd-btn`, `snd-btn--primary`, `snd-btn--ghost`
- Inline text-action links → `snd-text-accent` with `text-decoration: none`

Keep layout helpers (`flex flex-row`, `items-center`, `w-full`, `mt-2`, etc.) — those are positional and the Vault layout uses them too.

A complete diff is large. The high-level mapping table:

| Existing class fragment | Replace with |
|---|---|
| `btn rounded-lg` | `snd-btn snd-btn--primary` |
| `link-primary` | `snd-text-accent` |
| `shadow-light bg-white … rounded-default` | `snd-card` |
| `border-default rounded-default` | `snd-line` |
| `text-grey-70 dark:text-grey-40` | `snd-text-mute` |
| `text-grey-80 dark:text-grey-40` | `snd-text-mute` |
| `bg-yellow-40 text-orange-60` (notice banner) | `snd-notice` (define below) |

For the `<progress>` element, replace the empty class with `class="snd-progress"`.

For the empty-state dropzone (the big drag-and-drop card from the `.empty` export), change the outer `<send-upload-area>` element's class to `snd-dropzone`. Remove all Tailwind border / radius classes.

- [ ] **Step 3: Add archiveTile / progress / notice styles to `tokens.css`**

Append:

```css
/* Progress bar (used inline and in tiles) */
progress.snd-progress { -webkit-appearance: none; appearance: none; width: 100%; height: 1px; background: var(--snd-line); border: 0; }
progress.snd-progress::-webkit-progress-bar { background: var(--snd-line); }
progress.snd-progress::-webkit-progress-value { background: var(--snd-accent); }
progress.snd-progress::-moz-progress-bar { background: var(--snd-accent); }

/* Notice banner (replaces the yellow/orange Tailwind blocks) */
.snd-notice {
  display: block;
  padding: 12px 16px;
  border: 1px solid rgba(214, 138, 120, 0.30);
  color: var(--snd-text);
  font: 400 13px var(--snd-font-sans);
  background: rgba(214, 138, 120, 0.05);
}

/* Archive tile (list item on My Uploads) */
send-archive {
  display: block;
  border: 1px solid var(--snd-line);
  padding: 16px 20px;
  background: transparent;
}
send-archive + send-archive { margin-top: 8px; }

/* Inline file info row */
send-file { display: flex; align-items: center; padding: 12px 0; }

/* Upload area */
send-upload-area { display: block; }
```

- [ ] **Step 4: Build**

`npm run build 2>&1 | tail -10` — should succeed.

- [ ] **Step 5: Manual visual check (if dev server available)**

Run: `npm run start` (in background or another terminal). Visit `http://localhost:8080/` — confirm the dropzone has a dashed Vault border, no rounded corners, sage palette.

If no dev server can run, defer the visual check to Task 29.

- [ ] **Step 6: Commit**

```bash
git add app/ui/archiveTile.js app/ui/tokens.css
git commit -m "feat(snd): restyle archive tile variants (empty/wip/upload/preview/dl/list)"
```

---

### Task 18: Restyle `app/ui/download.js` (recipient screen)

**Files:**
- Modify: `app/ui/download.js`

- [ ] **Step 1: Replace the wrapper class attributes**

Change `<main class="main">` to `<main class="snd-main snd-main--centered">`.

Change the inner `<section>` element's class from `relative h-full w-full p-6 md:p-8 md:rounded-xl md:shadow-big` to `snd-recipient`.

In `downloading()` and `preview()`, replace `<h1 class="text-3xl font-bold mb-4">` with `<h1 class="snd-display">`, and the `<p class="w-full text-grey-80 …">` with `<p class="snd-body snd-text-mute">`.

- [ ] **Step 2: Add recipient layout styles to tokens.css**

```css
.snd-main--centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  flex: 1;
}
.snd-recipient {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.snd-recipient h1 { color: var(--snd-text); }
```

- [ ] **Step 3: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/ui/download.js app/ui/tokens.css
git commit -m "feat(snd): restyle recipient download screen to centered Vault card"
```

---

### Task 19: Restyle `app/ui/downloadPassword.js`

**Files:**
- Modify: `app/ui/downloadPassword.js`

- [ ] **Step 1: Replace the form + input markup**

Replace the entire `module.exports` body in `app/ui/downloadPassword.js` with:

```js
const html = require('choo/html');

module.exports = function(state, emit) {
  const fileInfo = state.fileInfo;
  const invalid = fileInfo.password === null;
  const t = state.translate;

  const div = html`
    <div class="snd-password-screen">
      <div class="snd-password-hero" aria-hidden="true">
        <div class="snd-password-lock">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--snd-accent)" stroke-width="1.5">
            <rect x="4" y="11" width="16" height="10"/>
            <path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/>
          </svg>
        </div>
      </div>
      <p class="snd-tag">PASSWORD-PROTECTED</p>
      <h1 class="snd-display">${t('downloadTitle')}</h1>
      <p class="snd-body-sm">${t('downloadDescription')}</p>

      <form class="snd-password-form ${invalid ? 'is-invalid' : ''}"
            onsubmit="${checkPassword}" data-no-csrf>
        <input id="autocomplete-decoy" type="password" value="lol" style="display:none"/>
        <input id="password-input"
               class="snd-input snd-input--mask"
               maxlength="4096"
               autocomplete="off"
               placeholder="${t('unlockInputPlaceholder')}"
               oninput="${inputChanged}"
               type="password"/>
        <input type="submit"
               id="password-btn"
               class="snd-btn snd-btn--primary"
               value="${t('unlockButtonLabel')}"
               title="${t('unlockButtonLabel')}"/>
      </form>

      <label id="password-error"
             class="snd-caption snd-text-danger ${invalid ? '' : 'is-hidden'}"
             for="password-input">
        ${t('passwordTryAgain')}
      </label>
    </div>
  `;

  if (!(div instanceof String)) {
    setTimeout(() => document.getElementById('password-input').focus());
  }

  function inputChanged(event) {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById('password-error').classList.add('is-hidden');
    document.querySelector('.snd-password-form').classList.remove('is-invalid');
  }

  function checkPassword(event) {
    event.stopPropagation();
    event.preventDefault();
    const el = document.getElementById('password-input');
    const password = el.value;
    if (password.length > 0) {
      document.getElementById('password-btn').disabled = true;
      const fileInfoUrl = window.location.href.replace(/\?.+#/, '#');
      state.fileInfo.url = fileInfoUrl;
      state.fileInfo.password = password;
      emit('getMetadata');
    }
    return false;
  }

  return div;
};
```

- [ ] **Step 2: Add password-screen styles to tokens.css**

```css
.snd-password-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 24px;
  text-align: center;
}
.snd-password-hero { padding-bottom: 4px; }
.snd-password-lock {
  width: 64px; height: 64px;
  border: 1.5px solid var(--snd-accent);
  display: inline-flex; align-items: center; justify-content: center;
}
.snd-password-form {
  display: flex; flex-direction: row; gap: 12px;
  width: 100%; max-width: 480px;
}
.snd-password-form .snd-input { flex: 1; }
.snd-password-form.is-invalid .snd-input { border-bottom-color: var(--snd-danger); }
.is-hidden { visibility: hidden; }
```

- [ ] **Step 3: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/ui/downloadPassword.js app/ui/tokens.css
git commit -m "feat(snd): restyle password-protected download to Vault hero card"
```

---

### Task 20: Restyle `app/ui/downloadCompleted.js`

**Files:**
- Modify: `app/ui/downloadCompleted.js`

- [ ] **Step 1: Read the current file**

Run: `cat app/ui/downloadCompleted.js`

- [ ] **Step 2: Rewrite class attributes**

Strip Tailwind cards/shadows/rounded, replace headlines with `snd-display` / `snd-display-xl`, body text with `snd-body`, file metadata with `snd-code-sm snd-text-mute`. The download-complete content is small — preserve the existing structure and replace the visual class strings only.

- [ ] **Step 3: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/ui/downloadCompleted.js
git commit -m "feat(snd): restyle download-complete screen"
```

---

### Task 21: Restyle `app/ui/error.js`, `notFound.js`, `unsupported.js`, `noStreams.js`, `blank.js`

**Files:**
- Modify: `app/ui/error.js`, `app/ui/notFound.js`, `app/ui/unsupported.js`, `app/ui/noStreams.js`, `app/ui/blank.js`

- [ ] **Step 1: For each file, replace its outer wrapper and typography classes**

In every file: replace `<h1 class="text-3xl …">` with `<h1 class="snd-display">`, `<p class="text-grey-80 …">` with `<p class="snd-body snd-text-mute">`, and wrap the body in `<main class="snd-main snd-main--centered"><section class="snd-recipient">…</section></main>`.

Buttons (e.g. "go home") → `class="snd-btn snd-btn--primary"`.

- [ ] **Step 2: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add app/ui/error.js app/ui/notFound.js app/ui/unsupported.js app/ui/noStreams.js app/ui/blank.js
git commit -m "feat(snd): restyle error / notFound / unsupported / blank screens"
```

---

### Task 22: Restyle `app/ui/expiryOptions.js` and `app/ui/selectbox.js`

**Files:**
- Modify: `app/ui/expiryOptions.js`
- Modify: `app/ui/selectbox.js`

- [ ] **Step 1: Read both files**

Run: `cat app/ui/expiryOptions.js && echo "---" && cat app/ui/selectbox.js`

- [ ] **Step 2: Restyle the outer wrapper of expiryOptions**

In `expiryOptions.js`, change the outer `<div class="px-1">` to `<div class="snd-expiry-row snd-body-sm snd-text-mute">`.

- [ ] **Step 3: Restyle `selectbox.js` to produce a Vault pill toggle**

The existing `selectbox` produces a `<select>`. Rather than reskinning a native `<select>` (which doesn't accept custom CSS for the dropdown), keep the underlying `<select>` element but apply Vault styling to it:

In `selectbox.js`, find the `<select>` element creation and add `class="snd-select"`.

Append to `tokens.css`:

```css
.snd-select {
  font: 400 12px var(--snd-font-mono);
  background: rgba(232, 230, 223, 0.05);
  color: var(--snd-text);
  border: 1px solid var(--snd-line);
  padding: 6px 10px;
  border-radius: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
}
.snd-select:focus { outline: 2px solid var(--snd-accent); outline-offset: 2px; }

.snd-expiry-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
```

(The full pill-toggle grid from the handoff is not in scope — current expiry uses a `<select>`. We restyle in place per the spec's "don't add features" rule.)

- [ ] **Step 4: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add app/ui/expiryOptions.js app/ui/selectbox.js app/ui/tokens.css
git commit -m "feat(snd): restyle expiry options and selectbox to Vault mono select"
```

---

## Phase F — Dialogs

### Task 23: Restyle `app/ui/modal.js` (base shell)

**Files:**
- Modify: `app/ui/modal.js`

- [ ] **Step 1: Replace the entire file with**

```js
const html = require('choo/html');

module.exports = function(state, emit) {
  return html`
    <send-modal class="snd-modal" role="dialog" aria-modal="true">
      <div class="snd-modal-backdrop" onclick=${close}></div>
      <div class="snd-modal-card" onclick=${stop}>
        ${state.modal(state, emit, close)}
      </div>
    </send-modal>
  `;

  function close(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    emit('closeModal');
  }
  function stop(event) { event.stopPropagation(); }
};
```

- [ ] **Step 2: Append modal styles to tokens.css**

```css
.snd-modal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.snd-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(14, 15, 13, 0.70);
}
.snd-modal-card {
  position: relative;
  z-index: 1;
  background: var(--snd-bg);
  border: 1px solid var(--snd-line);
  padding: 32px;
  max-width: 560px;
  width: 100%;
  border-radius: 0;
}
@media (max-width: 768px) {
  .snd-modal { padding: 16px; }
  .snd-modal-card { padding: 24px; }
}
```

- [ ] **Step 3: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/ui/modal.js app/ui/tokens.css
git commit -m "feat(snd): restyle modal shell to Vault hairline card"
```

---

### Task 24: Restyle `app/ui/copyDialog.js`, `okDialog.js`, `shareDialog.js`

**Files:**
- Modify: `app/ui/copyDialog.js`, `app/ui/okDialog.js`, `app/ui/shareDialog.js`

- [ ] **Step 1: For each dialog, replace its outer class attributes**

Strip background/border/shadow Tailwind classes; titles → `snd-display` (or `snd-tag` if it's an eyebrow), body → `snd-body`, buttons → `snd-btn snd-btn--primary` (primary action) and `snd-btn` (secondary) and `snd-btn snd-btn--danger` (destructive).

Preserve all `state.translate(...)` calls, all `emit(...)` handlers, and all behaviour.

- [ ] **Step 2: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add app/ui/copyDialog.js app/ui/okDialog.js app/ui/shareDialog.js
git commit -m "feat(snd): restyle copy / ok / share dialogs"
```

---

### Task 25: Restyle `app/ui/signupDialog.js`, `surveyDialog.js`, `qr.js`

**Files:**
- Modify: `app/ui/signupDialog.js`, `app/ui/surveyDialog.js`, `app/ui/qr.js`

- [ ] **Step 1: Same restyle pattern as Task 24 — class swaps only, no logic changes**

For `qr.js`: the QR canvas itself stays. Wrap it with `<div class="snd-qr-card">` and add the URL display below in `snd-code` style. Append:

```css
.snd-qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(232, 230, 223, 0.03);
  border: 1px solid var(--snd-line);
}
.snd-qr-card canvas { background: #fff; padding: 8px; }
.snd-qr-card .snd-qr-url { color: var(--snd-mute); font: 400 11px var(--snd-font-mono); word-break: break-all; text-align: center; max-width: 240px; }
```

- [ ] **Step 2: Build**

`npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add app/ui/signupDialog.js app/ui/surveyDialog.js app/ui/qr.js app/ui/tokens.css
git commit -m "feat(snd): restyle signup / survey / QR dialogs"
```

---

## Phase G — Mobile QR default on share-complete

### Task 26: Default the QR to expanded on viewports ≤768px

**Files:**
- Modify: `app/ui/archiveTile.js` (the `share-complete` / list-item render path that shows the share URL)
- Modify: `app/ui/tokens.css`

- [ ] **Step 1: Locate the share-URL render block in `archiveTile.js`**

Look for the row that contains the "copy link" / "QR" button group. The QR opening is currently routed through `emit(...)` to the modal system in `qr.js`.

- [ ] **Step 2: Add a mobile-only inline QR alongside the URL**

In the existing share-row markup, add a sibling element:

```js
const inlineQr = html`
  <div class="snd-qr-inline" data-snd-qr-url="${archive.url}">
    <canvas class="snd-qr-canvas" width="200" height="200"></canvas>
    <p class="snd-code snd-qr-url">${archive.url}</p>
  </div>
`;
```

Render `inlineQr` inside the tile, AFTER the action row. The CSS in Step 3 will show it only at ≤768px.

- [ ] **Step 3: Wire the canvas to draw on mount via a small effect**

At the bottom of the tile-render function, add:

```js
setTimeout(() => {
  const wrap = document.querySelector(`#archive-${archive.id} .snd-qr-inline`);
  if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  const url = wrap.getAttribute('data-snd-qr-url');
  if (canvas && url && window.matchMedia('(max-width: 768px)').matches) {
    // qr.js exposes a draw helper; if not, import the existing qr library used by qr.js.
    const qrlib = require('../qrcode');
    qrlib.toCanvas(canvas, url, { width: 200, margin: 0 });
  }
}, 0);
```

Note: the import path (`../qrcode`) matches the existing `app/qrcode.js`. If the existing `qr.js` dialog uses a different API, mirror its call shape exactly.

- [ ] **Step 4: Add the mobile CSS gate**

Append to `tokens.css`:

```css
.snd-qr-inline { display: none; flex-direction: column; align-items: center; gap: 10px; margin-top: 16px; }
.snd-qr-inline canvas { background: #fff; padding: 8px; border: 1px solid var(--snd-line); }
@media (max-width: 768px) {
  .snd-qr-inline { display: flex; }
}
```

- [ ] **Step 5: Build and visually verify**

`npm run build 2>&1 | tail -5`

If a browser is available, resize the window to <768px after sharing a file and confirm the QR renders.

- [ ] **Step 6: Commit**

```bash
git add app/ui/archiveTile.js app/ui/tokens.css
git commit -m "feat(snd): default share screen to expanded QR on mobile (<=768px)"
```

---

## Phase H — Verification

### Task 27: Lint suite

**Files:** none (validation only)

- [ ] **Step 1: Run CSS lint**

Run: `npm run lint:css 2>&1 | tail -30`
Expected: zero errors. If errors surface, fix them inline (typical issues: vendor prefix order, `@apply` on undefined utilities, missing semicolons).

- [ ] **Step 2: Run JS lint**

Run: `npm run lint:js 2>&1 | tail -30`
Expected: zero errors. Common false positives in the new files: unused vars in the new statusBar.js (none expected), prefer-const (fix as flagged).

- [ ] **Step 3: Commit any lint fixes**

```bash
git add -u
git commit -m "feat(snd): lint fixes"
```

(Skip the commit if nothing changed.)

---

### Task 28: Backend tests

**Files:** none

- [ ] **Step 1: Run backend tests**

Run: `npm run test:backend 2>&1 | tail -20`
Expected: all tests pass. The restyle does not touch server code beyond `server/layout.js` (theme-color) and `server/config.js` (custom_title default).

If a snapshot/integration test references the old layout, update it to match the new state and re-commit.

---

### Task 29: Acceptance grep verification

**Files:** none

- [ ] **Step 1: Verify no "Snd" or "Send" brand literals remain in English source**

Run:

```bash
grep -rnE "\\b(Snd|Send)\\b" \
  app/ server/ public/locales/en-US/ package.json \
  --include='*.js' --include='*.ftl' --include='*.json' --include='*.css' \
  | grep -v node_modules \
  | grep -v 'fileSender\|fileReceiver\|onSend\|sender\.' \
  | grep -v '"send"' # npm package name in package.json is OK to leave
```

Expected: no output, or only matches that are clearly NOT the product brand (function names, npm dep entries, etc.).

- [ ] **Step 2: Verify no border-radius declarations remain in `app/**/*.css`**

Run:

```bash
grep -rnE 'border-radius\s*:' app/ --include='*.css' \
  | grep -vE 'border-radius:\s*0\b'
```

Expected: no output. All non-zero `border-radius` declarations should have been replaced.

- [ ] **Step 3: Verify no box-shadow declarations remain in `app/**/*.css`**

Run: `grep -rnE 'box-shadow\s*:' app/ --include='*.css'`
Expected: no output (or only `box-shadow: none`).

- [ ] **Step 4: Verify no use of `assets/bg.svg`**

Run: `grep -rn 'bg.svg' app/ server/ assets/`
Expected: no output.

- [ ] **Step 5: If any acceptance check fails, fix and commit**

```bash
git add -u && git commit -m "feat(snd): acceptance-criteria fixes"
```

(Skip if nothing changed.)

---

### Task 30: Manual browser smoke test (golden paths)

**Files:** none

- [ ] **Step 1: Start the dev server**

Run: `npm run start` (this runs in foreground and serves on `http://localhost:8080`).

- [ ] **Step 2: Walk each golden path in a real browser and confirm**

In a browser at 1280×820:

1. Visit `/`. Confirm: Vault nav with brand mark, sage accent, mono "S"; dropzone with dashed hairline border; intro headline + body in Inter sans; no rounded corners; no drop shadows.
2. Drop a small file (<50 MB) onto the dropzone. Confirm upload progresses, file appears in the right rail, share URL displays, copy button works.
3. Open the share URL in a new tab. Confirm the recipient screen renders centered, with the file metadata and a primary "decrypt and download" button.
4. Trigger a password-protected upload (set a password). Confirm the password screen shows: 64×64 lock square with sage outline, `.snd-input--mask` underline, primary button.
5. Resize browser to <768px wide on the share-complete screen. Confirm the QR appears inline expanded.

- [ ] **Step 3: Document any visual regressions**

If a screen does not match the handoff, file the deviation as a follow-up commit. Do not block this PR on small visual misses — the acceptance criteria are functional + token-presence, not pixel-perfect.

- [ ] **Step 4: Stop the dev server**

Ctrl-C the `npm run start` process.

---

### Task 31: Final cleanup commit and PR

**Files:** none

- [ ] **Step 1: Confirm clean working tree**

`git status`
Expected: nothing to commit.

- [ ] **Step 2: Push branch and open PR**

```bash
git push -u origin feat/snd-vault-restyle
gh pr create --title "feat(snd): Vault visual restyle + strict SND brand rename" \
  --body "$(cat <<'EOF'
## Summary

- Applies the SND.DX.PE / Vault visual handoff (sage palette, dark only, hairline borders, no radius/shadows, Inter + JetBrains Mono) to all existing tarnover/send screens.
- Renames the product to strict uppercase **SND** across all 32 locale ftl files, server config defaults, and any hardcoded brand literals in client code.
- Replaces the icon mark + regenerates the PWA/favicon PNG set from the new SVG.
- Defaults the share-complete screen to render the QR code expanded inline on viewports ≤768px.

No functional changes. No new routes. No new dependencies (JetBrains Mono is self-hosted from the assets directory).

Spec: `docs/superpowers/specs/2026-05-22-snd-vault-redesign-design.md`
Plan: `docs/superpowers/plans/2026-05-22-snd-vault-restyle.md`

## Test plan

- [ ] `npm run lint:js` passes
- [ ] `npm run lint:css` passes
- [ ] `npm run test:backend` passes
- [ ] `grep` checks for "Snd" / "Send", `border-radius`, `box-shadow` all return empty
- [ ] Browser smoke at 1280×820: idle, upload, share-complete, recipient, password
- [ ] Browser smoke at <768px: share-complete shows QR expanded
EOF
)"
```

- [ ] **Step 3: Return the PR URL**

`gh pr view --json url --jq .url`

---

## Self-review notes (for the planner — do NOT execute)

Cross-check against the spec:
- ✅ Tokens — Task 1.
- ✅ Inter + JetBrains Mono — Tasks 3, 4.
- ✅ Six screen restyles — Tasks 15–22.
- ✅ Dialog restyle — Tasks 23–25.
- ✅ Header / status bar / footer — Tasks 11–14.
- ✅ Brand rename strict SND — Tasks 5–7.
- ✅ Icon SVG + PNG regen — Tasks 8–9.
- ✅ Background removal — Task 10.
- ✅ Mobile QR default — Task 26.
- ✅ Lint + backend tests + grep acceptance — Tasks 27–29.
- ✅ Manual smoke — Task 30.

Out-of-spec items deferred to follow-up (not in scope): encryption pipeline step list, manifest preview, palette switcher, light mode, command bar, Vim-style filter shortcut.
