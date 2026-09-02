# LunchBuddy — Design System

**Aesthetic:** Soft Buddy — warm, calm, playful-but-not-loud. Between a kids' app and a considered family tool.
**Locked:** 2026-09-02
**Reference apps:** none supplied by the user — direction proposed from spectrum research (a blend of "Playful distinct" and "Warm organic" from the design-makeover skill's spectrum library)

> This is the canonical design spec for LunchBuddy. All visual work in this project should match these rules. When extending to new pages or components, read this file first.

---

## Typography

### Fonts

- **Display:** [Varela Round](https://fonts.google.com/specimen/Varela+Round) — free, full Hebrew + Latin support. Used for: page titles, section headings (`h1`, `.gate__title`, `.section h2`, `.hero-card__greeting`).
- **Body:** [Heebo](https://fonts.google.com/specimen/Heebo) — free, full Hebrew support, already the project's existing body font. Used for: everything else — UI labels, buttons, form fields, food card names.

Loaded together in `index.html` via one Google Fonts request (`family=Heebo:wght@400;500;600;700;800&family=Varela+Round&display=swap`), preloaded with an `onload` swap to avoid render-blocking.

### Deviation from the skill's default font catalogue

The skill's `reference/font-library.md` is Latin-only. This app is Hebrew RTL throughout, so both fonts were chosen from known Hebrew-supporting Google Fonts instead — **not** from the skill's standard list. Note this explicitly if re-running the skill on this project later.

### Rules

- Varela Round ships in one weight only (400) — CSS asks for higher weights (700–800) on some headings; the browser synthesizes bold. If a heading looks off, check whether reducing to `font-weight: 700` (or letting it render at its native weight) looks better than synthetic-bold.
- No separate mono font — not needed for this app.

---

## Palette

### Core tokens — dark (default)

| Token | Hex | Purpose |
|---|---|---|
| `--bg` | `#191D2E` | Page background |
| `--bg-soft` | `#202538` | Secondary background |
| `--card` | `rgba(255,255,255,0.06)` | Card fill |
| `--card-solid` | `#22273B` | Opaque card fill (modals, icon badges) |
| `--border` | `rgba(255,255,255,0.1)` | Card borders |
| `--text` | `#F2F1F7` | Primary text |
| `--text-muted` | `#A29FC4` | Secondary text |
| `--primary` | `#5FBFA3` | Accent — icons, borders, hover states, glows |
| `--primary-2` | `#4FA98C` | Accent secondary shade |
| `--accent-2` | `#F4A259` | Warm amber — streak badges, star ratings, "תבחר לי" magic button |
| `--accent-2-ink` | `#2B1C0D` | Text-on-amber |
| `--gradient` | `linear-gradient(135deg, #2A7A5F 0%, #1B5C46 100%)` | **Solid CTA fills only** (buttons, active tab pill) — deliberately darker than `--primary` so white text passes contrast (see Accessibility below) |
| `--gradient-soft` | `linear-gradient(135deg, rgba(95,191,163,0.18), rgba(79,169,140,0.18))` | Low-opacity hover tint |

### Core tokens — light (`[data-theme='light']`)

| Token | Hex | Purpose |
|---|---|---|
| `--bg` | `#FAF7F2` | Page background |
| `--bg-soft` | `#FFFFFF` | Secondary background |
| `--card` | `rgba(30,25,15,0.04)` | Card fill |
| `--card-solid` | `#FFFFFF` | Opaque card fill |
| `--border` | `rgba(30,25,15,0.1)` | Card borders |
| `--text` | `#221F2E` | Primary text |
| `--text-muted` | `#716C82` | Secondary text |
| `--primary` | `#2F8D71` | Darker sage than dark-mode — needed for contrast on light backgrounds |
| `--primary-2` | `#256F5A` | |
| `--accent-2` / `--accent-2-ink` | same as dark | Amber already has enough contrast in both themes |
| `--gradient` | `linear-gradient(135deg, #256F5A 0%, #184F3F 100%)` | Same reasoning as dark mode |

### State colours (unchanged from before the redesign — already fine)

| State | Solid | Muted bg |
|---|---|---|
| Success | `#34d399` | `rgba(52,211,153,0.14)` |
| Warning | `#fbbf24` | `rgba(251,191,36,0.14)` |
| Error | `#f87171` | — |

### Accessibility — verified, not assumed

Computed via actual `getComputedStyle` + WCAG relative-luminance formula in the running app (not eyeballed):

- `--text-muted` on `--bg`, dark: **6.60:1** (AA pass, body text)
- `--text-muted` on `--bg`, light: **4.71:1** (AA pass, body text — tight, don't darken `--bg` further without re-checking)
- White text on `--gradient`, dark mode, lighter end: **5.19:1** (AA pass)
- White text on `--gradient`, dark mode, darker end: **7.88:1**
- White text on `--gradient`, light mode: **5.99:1+**

**Important — this was a real bug caught during self-critique:** the first version of `--gradient` used lighter sage tones (`#6FCDB0 → #4FA98C`) that looked closer to `--primary`. White button text on that measured **1.9:1** — a hard fail. `--gradient` was deliberately darkened to fix it. **Do not lighten `--gradient` back toward `--primary` without re-verifying white-text contrast ≥ 4.5:1.** `--primary`/`--primary-2` themselves are NOT safe backgrounds for white text — they're used only for icons, borders, and low-opacity glows, never as a solid fill behind text.

---

## Motion

**Preset:** Quiet — existing transitions (`transform 0.15s ease`, `0.2s ease` for theme/background) were kept as-is; the redesign is a token/colour pass, not a motion pass. No new motion was introduced.

`prefers-reduced-motion` was not explicitly audited in this pass — flag for a future session if motion work is scoped.

---

## Component patterns

### Buttons

**Primary (`.btn--primary`)**
- Background: `var(--gradient)` (the CTA-safe dark sage, not `--primary`)
- Text: white, `box-shadow: 0 8px 20px rgba(79, 169, 140, 0.35)`
- Hover: `filter: brightness(1.08)`

**Magic / random-pick (`.btn--magic`)**
- Background: `var(--accent-2)` (flat, not gradient)
- Text: `var(--accent-2-ink)` (dark ink, not white — amber is too light for white text)

**Default (`.btn`)**
- Background: `var(--card)`, border `var(--border)`, hover border → `var(--primary)`

### Cards

**Food card (`.food-card`)**
- Background: `var(--card)`, border `var(--border)`, hover border → `var(--primary)` (was a hardcoded purple rgba before this redesign — now tokenized)
- Favorite (♡) and recipe (📖) icon buttons: circular `var(--card-solid)` badge, 26×26px, `var(--border-soft)` border — added in this redesign because the recipe icon (mostly-white emoji) had near-zero contrast floating directly on a light-theme card with no background of its own

**Gate / setup cards (`.gate__card`, `.setup-card`)**
- Background: `var(--card)`, `backdrop-filter: blur(20px)` — deliberate glassmorphism, kept as-is (pre-existing, works with the atmospheric glow blobs, not flagged as slop since it's a considered choice on a low-density hero screen, not a dashboard)

### Star ratings (`FoodCard.jsx`)

- Was: raw `☆` / `⭐` Unicode glyphs
- Now: `lucide-react` `Star` icon, `size={16}`, `fill={rating >= n ? 'var(--accent-2)' : 'none'}`, `color="var(--accent-2)"`
- Rule going forward: no new Unicode star/rating glyphs — use the `Star` icon for consistency

### Section headers (`ParentDashboard.jsx`)

- Was: some had emoji (🍲, 🛒), one had a `lucide` icon (`Vote`), one had nothing
- Now: all use `lucide-react` icons at `size={18}` next to the `<h2>` text — `UtensilsCrossed` (today's menu), `Heart` (family choices), `ShoppingCart` (shopping list), `Baby` (kids list), `Vote` (poll, pre-existing)
- Rule going forward: parent-dashboard section headers get a `lucide` icon, not an emoji — kid-facing screens can keep emoji (that's the intended playful register there)

---

## Anti-slop bans (project-specific)

Never use these in this project:

- The purple-to-blue gradient (`#7c5cff` / `#4facfe` / `#38e0dc` / `#06212a`) — this was the exact "distributive convergence" signature this redesign removed. If it reappears anywhere (copy-pasted from an old snippet, a new component authored without checking tokens), that's a regression.
- Inter / Roboto / Arial / system-ui as primary (fallback stack only)
- New hardcoded hex/rgba colour values in `src/index.css` outside the `:root` token blocks — always add a token or reuse an existing one
- Raw Unicode star/heart/rating glyphs — use `lucide-react` icons
- `--primary` / `--primary-2` as a solid background behind text — see Accessibility section above

---

## Scope history

- **2026-09-02:** Initial lock-in. Applied to the whole app: role gate, child setup ("who are you" picker), kid food-picking view, `/welcome` marketing page, parent dashboard (all 3 tabs — home, kids, shopping). Both dark and light theme. Not individually re-verified: weekly planner tab, recipe modal, toast notifications, poll/vote UI beyond what inherits tokens automatically.

---

## How to use this spec

- For new components: match the patterns above. Reuse existing CSS custom properties — don't hardcode colours.
- For new pages: read this file before styling.
- Before touching `--gradient` or `--primary`: re-verify white-text contrast if the change affects a button/pill that carries text — this file exists partly because that exact mistake happened once already in this project.
- To extend this design to a page not listed in Scope history: point a future Claude session at this file and say "apply this to `<page>`."
- To change the system itself: re-run the `design-makeover` skill.
