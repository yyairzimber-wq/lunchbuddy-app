# LunchBuddy 🍽️ — UI/UX Audit

**Audited:** 2026-09-01 · **URL:** https://lunchbuddy-5fbda.web.app · **Build:** production (Firebase Hosting, Vite build already deployed — no dev-server rebuild needed)
**Tooling:** @playwright/mcp · a11y-mcp (axe-core 4.13) · lighthouse 12.8.2 (CLI fallback, see caveats)
**Primary flow walked:** landing → "משפחה חדשה" (new family) → role gate → "אני ילד/ה" (I'm a kid) → child setup (avatar + name) → kid food-picking view
**Viewports captured:** 1440×900, 768×1024, 375×812. Screenshots in `audit/screenshots/`.
**Caveats:**
- a11y-mcp opens the URL in its own unauthenticated browser context, independent of the Playwright session — it only ever saw the entry screen (family/role gate), not the food-picking view reached via in-app navigation state. The axe results below cover the gate screen only.
- Lighthouse's own MCP tool (`lighthouse-mcp`) failed with `EPERM` cleaning up its Windows temp dir (Defender holding a handle on the Chromium profile) — this is the known issue documented in this skill's `INSTALL.md`. Fell back to the `lighthouse` CLI directly; the audit itself completed fine, only the post-run cleanup errored.
- This is already the production build (Firebase Hosting), so no dev-vs-prod Lighthouse comparison was needed — the numbers below are real.

## 1. UX findings (ranked by impact)

### P1 — "פיתה עם חומוס" food card renders a broken glyph instead of its icon
- **What I saw:** The flatbread emoji (🫓, U+1FAD3) used for the "pita with hummus" card renders as an empty "tofu box" placeholder glyph instead of a pita image, on every viewport tested (`04-kidview-1440.png`, `04-kidview-768.png`, `04-kidview-375.png` — 4th row, 1st column). Confirmed via DOM inspection: the emoji character is present (`<span class="food-card__emoji">🫓</span>`), so this is a font-coverage gap, not a data bug — 🫓 is a relatively recent Unicode emoji (added 2021) that some Windows Chrome installs don't have a glyph for yet.
- **Why it matters:** This app's core conceit is that pre-literate kids pick food by picture, not text (per the README). A card that shows a broken box instead of a recognizable icon defeats the one piece of UI a non-reading user actually relies on.
- **Fix:** Swap the emoji in `src/data/foods.js:23` and `src/data/foods.js:162` for a better-supported alternative, e.g. 🥙 (stuffed flatbread, wide support since 2016) or 🫓 → simple bread/pita SVG icon if you want guaranteed rendering. Cheaper fix: audit the rest of `foods.js` for any other post-2019 emoji before this bites again on a different card.

### P2 — Desktop layout leaves half the screen empty
- **What I saw:** At 1440×900 the content column (`.screen.screen--shell`) measures exactly 720px, centered, leaving 360px of dead space on each side (confirmed via `getBoundingClientRect()`). See `04-kidview-1440.png`.
- **Why it matters:** Not broken, but LunchBuddy is explicitly a PWA meant to be used on whatever device is around, including a family desktop/laptop. Right now desktop users get a mobile layout stretched into the middle of a big monitor rather than a layout that uses the space (e.g. a wider food grid with more columns, or a two-pane parent dashboard).
- **Fix:** Raise `.screen`'s `max-width` (currently `720px` in `src/index.css:63`) for wide viewports, or add a `@media (min-width: 1024px)` rule that switches the food grid from its current column count to more columns instead of just centering the same narrow column.

### P3 — Floating bottom nav pill transiently covers content mid-scroll
- **What I saw:** `.tabbar--bottom` is `position: fixed` (`src/index.css:334`) and floats over whatever content is in its vertical band while scrolling — e.g. it briefly covers part of a food-card row or list text (`04-kidview-1440.png` mid-scroll). At true scroll-rest (top or bottom of the list) nothing is actually hidden — `.screen--shell`'s `padding-bottom: 100px` correctly reserves space at the end of the list.
- **Why it matters:** Minor — this is standard behavior for a frosted-glass floating tab bar (same pattern as most mobile apps) and doesn't hide anything permanently. Flagging only because it reads as a bug in a still screenshot.
- **Fix:** No action needed unless you want the pill to fade/shrink on scroll for extra polish (not necessary).

## 2. Accessibility violations (axe-core, WCAG 2.1 A/AA + best-practice)

Scope: entry/gate screen only (see caveat above — the kid food-picking view could not be reached by axe-mcp's isolated browser context). 12 rules passed, 75 not applicable, 1 incomplete, 2 moderate violations:

| # | Rule ID | Severity | Element | Failing detail | Suggested fix |
|---|---|---|---|---|---|
| 1 | `landmark-one-main` | Moderate | `<html lang="he" dir="rtl">` | Document has no `<main>` landmark | Wrap the routed page content in `<main>` in your root layout component so every screen (gate, child-setup, kid view, parent dashboard) has exactly one `<main>`. |
| 2 | `region` | Moderate | `.gate__logo`, `<h1>`, `<p>` (gate screen) | Content not contained by any landmark | Falls out once `<main>` wraps the gate screen's content (fix #1 above resolves this too). |

No critical or serious violations found on the audited screen. Icon-only controls I manually spot-checked in the kid view (♡ favorite, 📖 recipe, ★ rating) all carry correct `aria-label`s (`aria-label="מועדף"`, `aria-label="מתכון"`, `aria-label="דרג 1 כוכבים"` etc.) — flagging this as a pass since it's a common miss and this app got it right.

## 3. Lighthouse — mobile, throttled (production build)

| Category | Score |
|---|---|
| Performance | 88 🟢 |
| Accessibility | 100 🟢 |
| Best Practices | 100 🟢 |
| SEO | 82 🟡 |

| Metric | Value | Score |
|---|---|---|
| First Contentful Paint | 3.0 s | 🟡 0.50 |
| Largest Contentful Paint | 3.1 s | 🟡 0.74 |
| Total Blocking Time | 20 ms | 🟢 1.00 |
| Cumulative Layout Shift | 0.001 | 🟢 1.00 |
| Speed Index | 3.1 s | 🟢 0.93 |
| Time to Interactive | 3.2 s | 🟢 0.94 |

### Top 3 fixes (sequenced by payoff)

1. **Eliminate the render-blocking Google Fonts request (~1050 ms saved).** `index.html` loads `fonts.googleapis.com/css2?family=Heebo…` as a blocking `<link rel="stylesheet">`. You already have `preconnect` hints — add `rel="preload" as="style" onload="this.rel='stylesheet'"` (with a `<noscript>` fallback), or self-host the Heebo woff2 files under `public/fonts/` and drop the Google Fonts round-trip entirely. This is also what's dragging FCP to 3.0s (score 0.50), the single worst metric in the report.
2. **Reduce unused JavaScript (~410 ms saved).** Run `npx vite-bundle-visualizer` (or check the `dist/assets/*.js` sizes) to find what's shipping but unused on first paint — likely candidates given the feature set: chart library for parent stats, and any routes/screens not needed for the initial gate render that aren't code-split.
3. **Fix SEO score (82 → should be 100 for two trivial fixes):**
   - Add `<meta name="description" content="…">` to `index.html` — currently missing entirely.
   - Add a real `public/robots.txt` (e.g. `User-agent: *\nAllow: /`). Right now `/robots.txt` doesn't exist as a static file, so Firebase's catch-all rewrite (`firebase.json`: `"source": "**" → "/index.html"`) serves the SPA shell at that path instead, which Lighthouse correctly flags as invalid. Firebase Hosting serves real static files before falling back to rewrites, so simply adding the file under `public/` is enough — no `firebase.json` change needed.
