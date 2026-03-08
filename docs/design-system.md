# Tenantly Design System Specification

## 1) Overview

**Project:** Tenantly  
**Frontend stack (repo-verified):** React 19 + Vite 7 + React Router 7 + Tailwind CSS 4 (`@tailwindcss/vite`) + Clerk authentication.  
**Design philosophy:** calm, trustworthy, and task-focused UI for rental workflows; prioritize readability, strong information hierarchy, and predictable accessibility-first interactions.

> **Accessibility Note:** All patterns below target WCAG 2.1 AA as a baseline, with AAA where practical for text contrast and focus visibility.

---

## 2) Color Palette

### 2.1 Brand/Foundation Tokens

| Token | Role | HEX | HSL (from provided palette) |
|---|---|---:|---:|
| `color.primary.700` | Primary dark / main brand anchor | `#363E59` | `hsl(225 25% 27%)` |
| `color.primary.500` | Primary mid / interactive alt | `#6A79A6` | `hsl(225 25% 53%)` |
| `color.accent.400` | Accent / highlight / warm emphasis | `#D9C196` | `hsl(39 46% 71%)` |
| `color.neutral.100` | Light neutral surface/text inverse | `#D5D7F2` | `hsl(236 53% 89%)` |
| `color.neutral.900` | Deep neutral / strong contrast base | `#403C0A` | `hsl(56 72% 14%)` |

### 2.2 Semantic Tokens (extension set for statuses)

| Token | HEX | HSL | Suggested on-color |
|---|---:|---:|---|
| `color.success.600` | `#2F7D4A` | `hsl(141 45% 34%)` | `#FFFFFF` |
| `color.warning.600` | `#B7791F` | `hsl(37 71% 42%)` | `#111111` |
| `color.error.600` | `#C53030` | `hsl(0 61% 48%)` | `#FFFFFF` |
| `color.info.600` | `#2B6CB0` | `hsl(211 61% 43%)` | `#FFFFFF` |

### 2.3 Light/Dark Mode Mapping

| Context | Background | Primary text | Secondary text | Border | Interactive primary |
|---|---|---|---|---|---|
| Light | `#D5D7F2` | `#363E59` | `#6A79A6` | `#6A79A6` (30–40% opacity) | `#363E59` |
| Dark | `#363E59` / deeper surface tint | `#D5D7F2` | `#D9C196` | `#6A79A6` | `#D9C196` |

### 2.4 Contrast Checks (key pairs)

| Pair | Ratio | WCAG result |
|---|---:|---|
| `#363E59` text on `#D5D7F2` | **7.50:1** | AAA normal text |
| `#403C0A` text on `#D5D7F2` | **7.98:1** | AAA normal text |
| `#363E59` text on `#D9C196` | **6.08:1** | AA normal / AAA large |
| `#403C0A` text on `#D9C196` | **6.47:1** | AA normal / AAA large |
| `#6A79A6` text on `#D5D7F2` | **3.03:1** | Only large text/icons |

> **Accessibility Note:** Avoid normal-size body text in `#6A79A6` on `#D5D7F2`; reserve for large labels or non-critical UI.

```txt
Illustrative token naming only (not implementation):
--color-bg: #D5D7F2;
--color-fg: #363E59;
--color-accent: #D9C196;
```

---

## 3) Typography

### 3.1 Families
- **Heading (enterprise-neutral):** `"Segoe UI", "Helvetica Neue", Arial, sans-serif`
- **Body (enterprise-neutral):** `"Segoe UI", "Helvetica Neue", Arial, sans-serif`
- **Monospace:** `Consolas, "Courier New", monospace`

### 3.2 Base + Scale
- **Base size:** `16px` (`1rem`)
- **Scale ratio:** `1.25` (major third)

| Token | px | rem | Line-height | Use |
|---|---:|---:|---:|---|
| `text-xs` | 12.8 | 0.8rem | 1.4 | Metadata, helper text |
| `text-sm` | 16 | 1rem | 1.5 | Body default |
| `text-md` | 20 | 1.25rem | 1.5 | Lead/body emphasis |
| `text-lg` | 25 | 1.563rem | 1.4 | Section heads |
| `text-xl` | 31.25 | 1.953rem | 1.3 | Page headings |
| `text-2xl` | 39.06 | 2.441rem | 1.2 | Hero headings |
| `text-3xl` | 48.83 | 3.052rem | 1.15 | Marketing/major stats |

### 3.3 Heading Hierarchy
- `h1`: 2.441rem / 700
- `h2`: 1.953rem / 700
- `h3`: 1.563rem / 600
- `h4`: 1.25rem / 600
- `h5`: 1rem / 600
- `h6`: 0.8rem / 600 (uppercase optional for labels only)

> **Accessibility Note:** Keep paragraph width to ~60–75 characters and body line-height at 1.5+ for sustained reading.

---

## 4) Spacing

- **Base unit:** `4px`
- **Rule:** use spacing tokens only; no ad-hoc values in component spacing.

| Token | px | Typical usage |
|---|---:|---|
| `space-1` | 4 | Tight icon/text gap |
| `space-2` | 8 | Input internal padding increment |
| `space-3` | 12 | Dense list item gap |
| `space-4` | 16 | Default component padding |
| `space-5` | 20 | Card internal rhythm |
| `space-6` | 24 | Section intra-gap |
| `space-8` | 32 | Major block spacing |
| `space-10` | 40 | Large section padding |
| `space-12` | 48 | Page chunk separation |
| `space-16` | 64 | Hero/layout spacing |

**Layout conventions**
- Page container horizontal padding: 16px mobile, 24px tablet, 32px desktop.
- Vertical rhythm: multiples of `space-4`.
- Form controls: min height aligned to accessible targets (see responsiveness and accessibility sections).

> **Accessibility Note:** Spacing must preserve clear grouping and avoid accidental touch activation by keeping actionable elements visually and physically separated.

---

## 5) Components

### 5.1 Buttons
- **Variants:** Primary, Secondary, Tertiary, Destructive.
- **Sizes:** `sm` (40h), `md` (44h), `lg` (48h).
- **States:** default, hover, focus-visible, active, disabled, loading.
- **Focus:** 2px+ high-contrast focus ring plus 2px offset.
- **Keyboard:** `Enter`/`Space` activation; disabled is non-focusable if truly unavailable.

### 5.2 Inputs (text/select/textarea)
- **States:** default, hover, focus, invalid, disabled, readonly.
- **Sizing:** min 44px control height for touch.
- **Validation:** explicit error text linked via `aria-describedby`.
- **Labeling:** visible label required; placeholder never used as label.

### 5.3 Cards
- **Structure:** title, metadata, actions.
- **States:** default, hover elevation, focus-within highlight.
- **A11y:** if clickable as a single target, use one semantic interactive wrapper and clear label.

### 5.4 Modals/Dialogs
- **Behavior:** trap focus, restore focus on close, prevent background interaction.
- **Keyboard:** close on `Esc` unless destructive flow requires explicit confirmation.
- **Sizing:** `sm` 360px, `md` 560px, `lg` 720px max widths.

### 5.5 Navigation
- **Desktop:** horizontal top nav with clear active state.
- **Mobile:** collapsible drawer/sheet pattern with focus management.
- **A11y:** current page marked (`aria-current="page"`), skip-to-content link present.

### 5.6 Alerts
- **Types:** success, info, warning, error.
- **Structure:** icon + title + message + optional action.
- **A11y:** polite live region for status, assertive only for critical blocking issues.

### 5.7 Badges
- **Use:** concise status only (not dense content).
- **Sizes:** `sm`, `md`.
- **Contrast:** status color + text must pass AA minimum.

### 5.8 Tooltips
- **Trigger:** hover + focus.
- **Behavior:** no critical information only in tooltip.
- **A11y:** tooltip associated with trigger via accessible description pattern.

```txt
Illustrative interaction state order:
default -> hover -> active
default -> focus-visible (keyboard)
default -> disabled OR loading (terminal state)
```

> **Accessibility Note:** Every interactive component must be fully usable with keyboard-only navigation and visible focus treatment.

---

## 6) Icons

- **Style:** outline-first, consistent stroke width, optical alignment at 16/20/24 sizes.
- **Recommended library (stack-fit):** `lucide-react` (React-friendly, tree-shakable, consistent stroke iconography).
- **Sizes:** 16 (dense), 20 (default), 24 (prominent), 32 (illustrative).
- **Color:** inherit text color by default; semantic color only when meaning is reinforced by text.

**Accessibility rules**
- Decorative icons: `aria-hidden="true"`.
- Informative/action icons: accessible name on control (`aria-label` or visible text).
- Icon-only buttons: minimum 44×44 target and visible focus ring.

> **Accessibility Note:** Never rely on icon shape/color alone to communicate status; pair with text.

---

## 7) Animations & Transitions

### Motion principles
1. Purposeful (orientation, feedback, continuity).
2. Subtle (avoid distractive amplitude).
3. Performant (prefer opacity/transform).

### Timing scale
- `fast`: 120ms
- `base`: 180ms
- `slow`: 240ms
- `emphasis`: 320ms (rare)

### Easing
- Standard: `cubic-bezier(0.2, 0, 0, 1)`
- Exit: `cubic-bezier(0.4, 0, 1, 1)`

### Patterns
- Enter: fade + slight translate (4–8px).
- Exit: fade only or fade + reduced reverse translate.
- Loading: subtle pulse/skeleton, never flashing.

### Reduced motion (mandatory)
- Respect `prefers-reduced-motion: reduce`.
- Remove non-essential transforms/parallax.
- Replace animated transitions with instant or 80ms fades.

```txt
Illustrative policy:
if prefers-reduced-motion => duration <= 80ms, no scale/slide effects
```

> **Accessibility Note:** Motion must not trigger vestibular discomfort; provide reduced alternatives globally.

---

## 8) Responsiveness

### 8.1 Breakpoints (mobile-first)

| Breakpoint | Min width | Usage |
|---|---:|---|
| `sm` | 640px | Larger phones / small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide screens |

### 8.2 Layout patterns
- Use CSS Grid for page-level shells and card collections.
- Use Flexbox for one-dimensional alignment (toolbars, nav rows).
- Keep max content width around 72–80rem for reading-heavy pages.

### 8.3 Touch + responsive typography
- Minimum touch target: **44×44px**.
- Increase spacing around tap targets on mobile.
- Fluid typography allowed for headings if minimum readable floor is maintained.

### 8.4 Container query guidance
- Prefer container-aware component adaptation for cards, filters, and panels when parent width drives layout.
- Keep viewport breakpoints for page shells; container queries for reusable components.

> **Accessibility Note:** Reflow and zoom up to 200% must preserve usability without horizontal scrolling for core flows.

---

## 9) Accessibility Checklist (WCAG 2.1 AA)

- [ ] Text contrast >= 4.5:1 (normal), >= 3:1 (large text/icons/UI boundaries).
- [ ] Focus is always visible and not color-only.
- [ ] Keyboard access complete (tab, shift+tab, enter, space, esc where applicable).
- [ ] Semantic landmarks present (`header`, `nav`, `main`, `footer`).
- [ ] Forms have persistent labels, clear errors, and programmatic associations.
- [ ] Dialogs trap focus and restore it on close.
- [ ] Status updates exposed via appropriate live regions.
- [ ] `prefers-color-scheme` supported for light/dark themes.
- [ ] `prefers-reduced-motion` respected globally.
- [ ] Content remains understandable without color-only cues.

---

## Evidence Note

### Repository files inspected
- `frontend\package.json`
- `frontend\vite.config.js`
- `frontend\src\main.jsx`
- `frontend\src\App.jsx`
- `frontend\src\index.css`
- `frontend\src\components\Layout.jsx`
- `frontend\src\pages\HomePage.jsx`

### MCP / external evidence status
- **Awesome Copilot MCP:** Not available in current runtime toolset at generation time.
- **Context7 MCP (`resolve-library-id`, `get-library-docs`):** Not available in current runtime toolset at generation time.
- **Web research tooling:** Not exposed in current runtime toolset at generation time.

### Unresolved uncertainty (explicit)
1. Framework-specific recommendations (e.g., icon package preference, breakpoint naming assumptions) are based on repository conventions and common React/Tailwind practice, not direct MCP/web retrieval in this run.
2. Final implementation should validate these decisions against live Context7/Awesome Copilot sources once those tools are available.
