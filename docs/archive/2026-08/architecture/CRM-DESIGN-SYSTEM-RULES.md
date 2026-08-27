# CRM Design System Rules

## Typography

**Type Scale — Major Third (1.250) ratio, base 16px:**

| Scale   | Keyword    | CSS Custom Property  | Pixel Equivalent |
|---------|------------|----------------------|------------------|
| -1      | xs         | --font-size-xs       | 12px — badges, captions |
| 0       | sm         | --font-size-sm       | 13px — labels, metadata |
| 1       | base       | --font-size-base     | 14px — body text (dense UI) |
| 2       | md         | --font-size-md       | 16px — body text (comfortable) |
| 3       | lg         | --font-size-lg       | 18px — section titles |
| 4       | xl         | --font-size-xl       | 20px — page subtitles |
| 5       | 2xl        | --font-size-2xl      | 24px — page titles |
| 6       | 3xl        | --font-size-3xl      | 30px — hero headings |
| 7       | 4xl        | --font-size-4xl      | 36px — display |

**CSS Variables:**
```css
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.8125rem; /* 13px */
--font-size-base: 0.875rem; /* 14px */
--font-size-md: 1rem;      /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem;  /* 36px */
```

**Font Weight Hierarchy:**
```css
--font-weight-normal: 400;   /* body text */
--font-weight-medium: 500;   /* labels, UI text, buttons */
--font-weight-semibold: 600; /* headings, emphasis */
--font-weight-bold: 700;     /* hero headings only */
```

**Fluid Typography with clamp():**
```css
--font-size-hero: clamp(1.875rem, 1.5rem + 1.5vw, 3rem);
--font-size-title: clamp(1.25rem, 1rem + 1vw, 1.75rem);
--font-size-body: clamp(0.875rem, 0.8rem + 0.2vw, 1rem);
```

**Letter Spacing (tracking):**
```css
--tracking-tighter: -0.025em; /* headings 24px+ */
--tracking-tight: -0.015em;   /* medium headings */
--tracking-normal: 0;         /* body text */
--tracking-wide: 0.025em;     /* labels, overlines */
--tracking-wider: 0.05em;     /* all-caps labels */
```
_Rule: as size increases, tracking should decrease. Large text at 0 tracking looks loose._

**Line Height (leading):**
```css
--leading-none: 1;      /* single-line: badges, buttons */
--leading-tight: 1.25;  /* compact */
--leading-normal: 1.5;  /* body text */
--leading-relaxed: 1.75; /* prose, long-form */
--leading-block: 2;     /* blockquotes, standalone */
```
_Rule: combine size + weight + spacing for hierarchy. Never rely on size alone._

---

## Spacing and Layout

**Spacing Scale — Base unit: 4px (every value is a multiple):**

```css
--space-0: 0;
--space-px: 1px;
--space-0.5: 2px;     /* icon gaps */
--space-1: 4px;       /* micro */
--space-2: 8px;       /* tight: inline, icon+text */
--space-3: 12px;      /* compact: small components */
--space-4: 16px;      /* standard: card padding, form gaps */
--space-5: 20px;      /* comfortable: section internal */
--space-6: 24px;      /* section gaps */
--space-8: 32px;      /* major section spacing */
--space-10: 40px;     /* page section spacing */
--space-12: 48px;     /* large section breaks */
--space-16: 64px;     /* page-level spacing */
--space-20: 80px;     /* hero-level spacing */
--space-24: 96px;     /* maximum page spacing */
```

**Spacing by Context:**

| Context          | Values           | Example                                  |
|------------------|------------------|------------------------------------------|
| Micro            | 2-4px            | Icon-to-text gap, badge padding          |
| Component internal| 8-12px           | Button padding, input padding            |
| Component gap    | 12-16px          | Form field gaps, card content spacing    |
| Section internal | 16-24px          | Card padding, panel padding              |
| Section gap      | 24-32px          | Between card groups                      |
| Page section     | 48-64px          | Between major page areas                 |

**Symmetrical Padding — Never use asymmetric multi-value padding without a reason:**

```css
/* Correct */
padding: 16px;
padding: 12px 16px; /* horizontal needs more room */

/* Wrong */
padding: 24px 16px 12px 16px; /* asymmetric without reason */
```

**CSS Grid Patterns:**

_12-Column Page Grid:_
```css
.page-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: var(--space-6);
}
```

_Sidebar + Content Layout:_
```css
.app-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100dvh;
}

.app-layout-collapsed {
  grid-template-columns: 64px 1fr;
}
```

---

## Color System

**Color Space: oklch (Lightness, Chroma, Hue)**

oklch produces perceptually uniform scales — equal lightness steps look equally bright, unlike hsl.

_Building a palette:_
```css
--blue-100: oklch(0.95 0.04 250);
--blue-200: oklch(0.88 0.08 250);
--blue-300: oklch(0.78 0.12 250);
--blue-400: oklch(0.68 0.16 250);
--blue-500: oklch(0.55 0.18 250); /* primary */
--blue-600: oklch(0.48 0.16 250);
--blue-700: oklch(0.4  0.14 250);
--blue-800: oklch(0.32 0.1  250);
--blue-900: oklch(0.22 0.06 250);
```

**Neutral Scale (tinted with brand hue 260):**
```css
--neutral-50:  oklch(0.98 0.005 260);
--neutral-100: oklch(0.96 0.005 260);
--neutral-200: oklch(0.92 0.008 260);
--neutral-300: oklch(0.87 0.008 260);
--neutral-400: oklch(0.7  0.01  260);
--neutral-500: oklch(0.55 0.01  260);
--neutral-600: oklch(0.45 0.01  260);
--neutral-700: oklch(0.35 0.012 260);
--neutral-800: oklch(0.25 0.012 260);
--neutral-900: oklch(0.15 0.01  260);
--neutral-950: oklch(0.1  0.01  260);
```

**Semantic Colors:**
```css
--success:  oklch(0.65 0.18 155); /* green */
--warning:  oklch(0.8  0.15 85);  /* amber */
--destructive:oklch(0.55 0.22 25); /* red */
--info:     oklch(0.6  0.16 250); /* blue */
```

_Dark mode adjustment: reduce chroma by 15-20% and increase lightness slightly._
```css
--success-dark: oklch(0.72 0.14 155);
--destructive-dark:oklch(0.65 0.18 25);
```

**Contrast — APCA (Advanced Perceptual Contrast Algorithm) preferred over WCAG 2.x:**

| Content Type            | Minimum APCA (Lc) |
|-------------------------|-------------------|
| Large text (24px+)      | 3.0               |
| Small text (<24px)      | 4.5               |
| UI components (borders) | 1.5               |
| Icons/graphs            | 3.0               |

---

## Token Architecture

**Token Layers:**

_Primitive Tokens — raw values without context:_
```css
--color-blue-50:  oklch(0.97 0.02 250);
--color-blue-500: oklch(0.55 0.18 250);
--color-slate-900:oklch(0.15 0.01 260);
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-3: 12px;
--radius-sm: 4px;
--radius-md: 8px;
```

_Semantic Tokens — contextual meaning mapped to primitives:_
```css
--color-text-primary:   var(--color-slate-900);
--color-text-secondary: var(--color-slate-600);
--color-text-tertiary:  var(--color-slate-500);
--color-text-muted:     var(--color-slate-400);

--color-surface-base:   var(--color-slate-50);
--color-surface-raised: #ffffff;
--color-surface-overlay:#ffffff;

--color-border-default: oklch(0 0 0 / 0.08);
--color-border-subtle:  oklch(0 0 0 / 0.05);
--color-border-strong:  oklch(0 0 0 / 0.12);
--color-border-focus:   var(--color-blue-500);

--color-accent:         var(--color-blue-500);
--color-destructive:    oklch(0.55 0.22 25);
--color-warning:        oklch(0.75 0.15 85);
--color-success:        oklch(0.65 0.18 155);
```

_Component Tokens — scoped to specific components:__
```css
--button-height: 36px;
--button-padding-x: 16px;
--button-padding-y: 8px;
--button-radius: var(--radius-sm);
--button-font-size: 14px;
--button-font-weight: 500;

--input-height: 40px;
--input-bg: var(--color-surface-inset);
--input-border: var(--color-border-default);
--input-radius: var(--radius-sm);
```

**Naming Convention: --{category}-{property}-{variant}**

Categories: `color`, `space`, `radius`, `shadow`, `font`, `size`, `z`
Properties: `text`, `surface`, `border`, `accent`, `control`
Variants: `default`, `subtle`, `strong`, `hover`, `focus`, `disabled`

_Cascade Layers:_
```css
@layer tokens, reset, base, components, utilities;
```

---

## Cognitive Principles

**Hick's Law — Time to decide increases logarithmically with number of choices.**

_Application:_
- Limit visible options to 5-7 per group
- Use progressive disclosure: show advanced options on demand
- Primary action should be visually dominant, reducing decision time
- Categorize long lists into groups
- Provide smart defaults so users rarely need to choose

_Interface examples:_
- Settings: group by section, show 4-6 items per section
- Navigation: max 7 top-level items, nest others
- Form selects: group options, most common first
- Action menus: 5-7 items max, separator between groups

**Fitts's Law — Time to reach a target depends on distance and size. Large, close targets are easiest to hit.**

_Application:_
- Primary actions should be large and close to the user's current focus
- Destructive actions should be smaller and farther from primary
- Navigation targets at screen edges are effectively infinite width (use it)
- Touch targets: 44px minimum (Apple), 48px (Material Design)

_Interface examples:_
- Submit buttons: full-width on mobile, prominent size on desktop
- Cancel/Delete: smaller, secondary styling, farther from submit
- Toolbar actions: near the content they affect
- Mobile: primary CTA at thumb-reach bottom of screen

**Miller's Law — Working memory holds 7 ± 2 items.**

_Application:_
- Chunk information into groups of 5-9 items
- Break long forms into multi-step flows (3-5 steps)
- Phone numbers: grouped as (123) 456-7890
- Credit cards: display as 4-digit groups
- Paginate large result sets: 10-25 items per page

_Interface examples:_
- Dashboard: 3-4 metric cards per row
- Navigation: 5-7 primary items
- Data tables: group columns logically, hide non-essential
- Progress: show 3-5 steps, not 12

**Visual Hierarchy — F-Pattern (desktop) / Z-Pattern (mobile):**
- Headings and primary actions at top-left
- Group related controls
- Eye flow should lead to the primary action

---

## Component Patterns

**Buttons:**

_Sizing:__
```css
--button-height-sm: 28px; /* inline actions, compact UI */
--button-height-md: 36px; /* standard */
--button-height-lg: 44px; /* primary CTA, mobile */
--
--button-padding-sm: 4px 10px;
--button-padding-md: 8px 16px;
--button-padding-lg: 10px 20px;
```

_Variants:_
- **Primary:** Solid background. One per visible area. Use for the primary action.
- **Secondary:** Border or subtle background. Supporting actions.
- **Ghost:** No border or background. Icon buttons, inline actions.
- **Destructive:** Red/destructive color. Requires confirmation for irreversible actions.

_States:__
```css
.button {
  transition: all 150ms ease;
}
.button:hover {
  filter: brightness(0.92);
}
.button:active {
  transform: scale(0.98);
}
.button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.button:disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

**Forms:**

_Input Field Architecture:__
```css
.input {
  height: var(--input-height);       /* 40px */
  padding: 8px 12px;               /* vertical 8px, horizontal 12px */
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);   /* 4px */
  font-size: var(--font-size-base);  /* 14px */
  transition:
    border-color 150ms,
    box-shadow 150ms;
}

.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px oklch(0.55 0.18 250 / 0.15);
  outline: none;
}

.input-error {
  border-color: var(--color-destructive);
  box-shadow: 0 0 0 3px oklch(0.55 0.22 25 / 0.1);
}
```

_Labels:__
- Always above the field
- Font: `--label` (typically smaller than body, medium weight)
- Required indicator: colored dot (var(--color-destructive)) or asterisk (*)
- Margin-bottom: var(--space-1) (4px)

_Validation:__
- Validate inline on blur, not on keypress
- Error messages appear below the field, in `--color-destructive`
- Success state: green border + checkmark icon
- Never remove error state on page reload

---

## Accessibility Baseline

- Contrast: APCA — large text 3.0+, small text 4.5+, UI components 1.5+
- Touch targets: 44px minimum, 48px preferred
- Focus indicator: visible, 2px stroke with 2px outline-offset
- Keyboard navigation: logical tab order, focus-visible states
- Screen reader: semantic HTML, aria-live for dynamic content, descriptive link text
- Reduced motion: respect `prefers-reduced-motion`, reduce/eliminate animations
- Color: never use color alone to convey meaning (also use text label or icon)