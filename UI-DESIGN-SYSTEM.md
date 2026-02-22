# UI-DESIGN-SYSTEM.md — EaseMail v3.0

> **Aesthetic: Linear-inspired. Dense, monochrome, one accent, instant.**
> This file is LAW for Agent 5 (UI Shell) and all subsequent UI work.
> Every component must follow these rules. No exceptions. No freestyling.

---

## DESIGN PHILOSOPHY

EaseMail looks and feels like Linear meets Superhuman. It is:

- **Dense but not cramped** — maximum information, minimum noise
- **Monochrome with one accent** — coral (#FF7F50) is the only pop of color
- **Instant** — every interaction responds in < 50ms visually
- **Keyboard-first** — mouse is supported but keyboard users are power users
- **Professionally restrained** — no gratuitous animations, no decoration, no fluff

**The test:** If you removed the logo, could a user mistake this for a Linear or Superhuman product? If yes, the UI is correct. If it looks like a shadcn template, it's wrong.

---

## SPACING SYSTEM (4px Grid)

EVERYTHING is a multiple of 4. No exceptions.

```css
:root {
  --space-0: 0px;
  --space-1: 4px;    /* tight: between icon and label */
  --space-2: 8px;    /* compact: between related items */
  --space-3: 12px;   /* standard: padding inside components */
  --space-4: 16px;   /* comfortable: between sections */
  --space-5: 20px;   /* spacious: major section gaps */
  --space-6: 24px;   /* generous: page padding */
  --space-8: 32px;   /* large: between major blocks */
  --space-10: 40px;  /* xlarge: page sections */
  --space-12: 48px;  /* xxlarge: hero spacing */
}
```

**Rules:**
- Component internal padding: `12px` (--space-3)
- Gap between items in a list: `0px` (items touch, separated by 1px border)
- Gap between sections: `16px-24px`
- Page margin: `24px`
- Sidebar width: `240px` (fixed)
- Message list width: `400px` (resizable, min 320px, max 480px)
- Reading pane: fills remaining space

**Anti-patterns (NEVER do these):**
- ❌ Random margins like 13px, 17px, 23px
- ❌ Different padding on similar components
- ❌ More than 24px padding inside a component
- ❌ Less than 4px between any elements

---

## TYPOGRAPHY

**Font Stack:**
```css
:root {
  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'SF Mono', 'Fira Code', monospace;
}
```

Install Geist from Vercel: `npm install geist`

**Type Scale (px / rem):**
```css
:root {
  --text-xs: 11px;    /* 0.6875rem — metadata, timestamps, badges */
  --text-sm: 12px;    /* 0.75rem — secondary text, sidebar items */
  --text-base: 13px;  /* 0.8125rem — body text, message preview (YES, 13px not 16px) */
  --text-md: 14px;    /* 0.875rem — message list subjects, input text */
  --text-lg: 16px;    /* 1rem — section headers, settings titles */
  --text-xl: 18px;    /* 1.125rem — page titles */
  --text-2xl: 24px;   /* 1.5rem — empty states, onboarding */
}
```

**Why 13px base?** This is the Linear/Superhuman density secret. 16px body text
is for blogs and marketing pages. App UIs that feel "dense and professional" use
13px body with 11-12px for secondary content. It fits more information on screen
without feeling unreadable.

**Font Weights:**
```css
--font-normal: 400;   /* body text, previews */
--font-medium: 500;   /* labels, nav items, buttons */
--font-semibold: 600; /* unread message subjects, section headers */
--font-bold: 700;     /* NEVER USE in the app UI (too heavy for dense layouts) */
```

**Line Heights:**
```css
--leading-tight: 1.2;    /* headings, single-line labels */
--leading-normal: 1.5;   /* body text, message preview */
--leading-relaxed: 1.625; /* long-form reading (email body only) */
```

**Anti-patterns:**
- ❌ 16px body text in the app shell (too big, feels like a blog)
- ❌ Bold (700) anywhere in the UI (use semibold 600 max)
- ❌ ALL CAPS for buttons or labels (use sentence case everywhere)
- ❌ Letter-spacing on body text
- ❌ More than 2 font sizes on a single component

---

## COLOR SYSTEM

**Core palette — monochrome with one accent:**

```css
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;     /* sidebar, subtle sections */
  --bg-tertiary: #F1F3F5;      /* hover states, input backgrounds */
  --bg-elevated: #FFFFFF;       /* cards, modals, popovers */
  --bg-selected: #FFF5F0;      /* selected message row (very subtle coral tint) */
  --bg-hover: #F8F9FA;         /* row hover */

  /* Text */
  --text-primary: #1A1A1A;     /* headings, subjects, primary content */
  --text-secondary: #6B7280;   /* sender names, metadata, timestamps */
  --text-tertiary: #9CA3AF;    /* placeholders, disabled text */
  --text-inverse: #FFFFFF;     /* text on accent backgrounds */

  /* Borders */
  --border-default: #E5E7EB;   /* dividers, input borders */
  --border-subtle: #F1F3F5;    /* very light separators */
  --border-focus: #FF7F50;     /* input focus ring */

  /* Accent (Coral — the ONLY color) */
  --accent: #FF7F50;
  --accent-hover: #FF6B3D;
  --accent-subtle: #FFF5F0;    /* backgrounds with accent context */
  --accent-text: #E5623D;      /* when accent is used as text (darker for accessibility) */

  /* Status (used SPARINGLY) */
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #EF4444;
  --status-info: #6B7280;      /* NOT blue — stays monochrome */

  /* Unread indicator */
  --unread-dot: #FF7F50;       /* coral dot for unread */
  --unread-bg: transparent;    /* unread rows: semibold text, NOT background change */
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: #0F1419;
  --bg-secondary: #1A1F2E;
  --bg-tertiary: #242B3D;
  --bg-elevated: #1E2535;
  --bg-selected: #2A1F1A;      /* dark coral tint */
  --bg-hover: #1A1F2E;

  --text-primary: #E8EAED;
  --text-secondary: #8B95A5;
  --text-tertiary: #5C6370;
  --text-inverse: #0F1419;

  --border-default: #2A3040;
  --border-subtle: #1E2535;
  --border-focus: #FF7F50;

  /* Accent stays the same in dark mode */
  --accent: #FF7F50;
  --accent-hover: #FF8F66;
  --accent-subtle: #2A1F1A;
  --accent-text: #FF9B7A;
}
```

**Color rules:**
- The UI is 95% grayscale. Coral appears ONLY for: primary buttons, focus rings, unread dots, active nav items, and the "send" button.
- Status colors (green, yellow, red) appear ONLY for actual status indicators, never for decoration.
- No blue anywhere. Blue is what makes apps look like "every other SaaS." Our info state is gray.
- No gradients in the app shell. Flat colors only. (Marketing page can have gradients.)
- Shadows are used for elevation only (modals, dropdowns), not decoration.

**Anti-patterns:**
- ❌ Blue links or blue buttons (use coral or text-primary)
- ❌ Colored badges for categories (use text labels, not colored pills)
- ❌ Background color on unread messages (use font-weight: 600 instead)
- ❌ Gradient backgrounds on any app component
- ❌ More than one accent color

---

## SHADOWS & ELEVATION

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.16);
}

[data-theme="dark"] {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.5);
}
```

**Elevation levels:**
| Level | Shadow | Use |
|-------|--------|-----|
| 0 (flat) | none | Default state, list items, sidebar |
| 1 (raised) | shadow-sm | Hovered cards, tooltips |
| 2 (floating) | shadow-md | Dropdowns, popovers, autocomplete |
| 3 (overlay) | shadow-lg | Modals, composer window |
| 4 (top) | shadow-xl | Command palette (⌘K) |

**Rule:** Shadows increase with interactivity. Static content = flat. Interactive overlays = shadowed.

---

## BORDER RADIUS

```css
:root {
  --radius-sm: 4px;   /* badges, tags, small buttons */
  --radius-md: 6px;   /* inputs, cards, buttons */
  --radius-lg: 8px;   /* modals, popovers */
  --radius-xl: 12px;  /* large cards, panels */
  --radius-full: 9999px; /* avatars, pills, dots */
}
```

**Rules:**
- Default component radius: `6px` (--radius-md)
- NEVER use different radii on the same component
- Avatars are always fully round
- Buttons: 6px
- Inputs: 6px
- Cards: 8px
- Modals: 12px

---

## ANIMATION & TRANSITIONS

```css
:root {
  --duration-instant: 0ms;     /* color changes, opacity toggles */
  --duration-fast: 100ms;      /* hover states, button press */
  --duration-normal: 150ms;    /* panel transitions, menu open */
  --duration-slow: 250ms;      /* modal open, sidebar collapse */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* for things appearing */
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);   /* for things disappearing */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* subtle bounce (SPARINGLY) */
}
```

**What gets animated (ONLY these):**
- ✅ Sidebar collapse/expand: width transition, 250ms, ease-out
- ✅ Modal/dialog open: opacity + scale(0.98→1), 150ms, ease-out
- ✅ Dropdown/popover open: opacity + translateY(-4px→0), 150ms, ease-out
- ✅ Hover state: background-color, 100ms
- ✅ Focus ring: box-shadow, 100ms
- ✅ Toast enter: translateY(100%→0), 250ms, ease-out
- ✅ Toast exit: opacity(1→0), 150ms, ease-in
- ✅ Reading pane content: opacity(0→1), 100ms (on message switch)

**What does NOT get animated:**
- ❌ Message list items (no stagger, no slide-in, they just appear)
- ❌ Folder tree items
- ❌ Navigation between folders (instant)
- ❌ Text content
- ❌ Badge counts
- ❌ Sort/filter changes
- ❌ Search results appearing

**Anti-patterns:**
- ❌ Animations longer than 250ms (feels sluggish)
- ❌ Bounce/spring on anything except rare micro-interactions
- ❌ Staggered list animations (Linear doesn't do this, it's slow)
- ❌ Page transition animations
- ❌ Loading spinners (use skeleton screens instead)

---

## COMPONENT SPECIFICATIONS

### Message List Row
```
┌─────────────────────────────────────────────────────────┐
│ [●] [Avatar] Sender Name              Yesterday 3:42 PM │
│              Subject line goes here — preview text th... │
│              [📎] [Label]                           [⚑] │
└─────────────────────────────────────────────────────────┘

Height: 72px (compact), 84px (comfortable), 96px (spacious)
Padding: 12px horizontal, 8px vertical
Unread: ● coral dot (6px) + subject font-weight: 600
Read: no dot + subject font-weight: 400
Selected: bg-selected (subtle coral tint) + left border 2px coral
Hover: bg-hover
Avatar: 28px round, sender initials if no photo
Sender: text-md (14px), font-medium (500), text-primary
Subject: text-md (14px), font-normal or semibold, text-primary, truncate 1 line
Preview: text-sm (12px), font-normal, text-secondary, truncate 1 line
Date: text-xs (11px), text-secondary, right-aligned
Attachment icon: 12px, text-tertiary
Flag: 14px, coral when flagged, text-tertiary when not
```

### Sidebar
```
┌──────────────────────┐
│ [Logo] EaseMail   [+]│  ← 48px header
│                      │
│ ▼ account@email.com  │  ← Account switcher
│   ● Active           │
│                      │
│ ───────────────────  │  ← 1px border-subtle
│ 📥 Inbox        (12) │  ← 32px row height
│ 📝 Drafts        (3) │
│ 📤 Sent Items        │
│ 🗑 Deleted            │
│ 📁 Junk Email        │
│                      │
│ FAVORITES            │  ← Section header: text-xs, text-tertiary, uppercase, letter-spacing
│ ⭐ Important          │
│ ⭐ Clients            │
│                      │
│ FOLDERS              │
│ ▶ Projects           │  ← Collapsible
│ ▶ Archive            │
│                      │
│ ───────────────────  │
│ ⚙ Settings           │  ← Bottom-pinned
│ [?] Help             │
└──────────────────────┘

Width: 240px fixed (collapsible to 48px icon-only)
Background: bg-secondary
Active item: bg-tertiary + text-primary + font-medium + left border 2px coral
Hover item: bg-tertiary
Section headers: text-xs (11px), text-tertiary, uppercase, letter-spacing: 0.05em
Folder count: text-xs, text-secondary, right-aligned
Unread count: font-semibold, text-primary (not colored, just bold)
```

### Composer
```
┌──────────────────────────────────────────────────────────┐
│ New Message                                    [_] [□] [×] │
│ ──────────────────────────────────────────────────────── │
│ From: [account@email.com          ▼]                     │
│ To:   [recipient chips...         ]                      │
│ Cc:   [                           ] (collapsed by default)│
│ ──────────────────────────────────────────────────────── │
│ Subject: [                        ]                      │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ [Rich text toolbar: B I U | • 1. | 🔗 📷 | ...]         │
│                                                          │
│ Email body here...                                       │
│                                                          │
│                                                          │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│ -- signature --                                          │
│ ──────────────────────────────────────────────────────── │
│ [📎 Attach] [🤖 AI Draft] [📋 Template]     [Send ▶]    │
└──────────────────────────────────────────────────────────┘

Position: fixed bottom-right (like Gmail/Linear), or full-screen on mobile
Size: 560px wide × 480px tall (resizable)
Shadow: shadow-lg
Border-radius: radius-lg (8px) on top corners
Send button: bg coral, text white, font-medium, radius-md
Toolbar: icon buttons, 28px square, text-secondary, hover text-primary
```

### Command Palette (⌘K)
```
┌──────────────────────────────────────────────────────────┐
│ [🔍] Search emails, contacts, commands...                │
│ ──────────────────────────────────────────────────────── │
│ RECENT                                                   │
│   📧 RE: Q4 Budget Review — from John                   │
│   📧 Meeting Notes — from Sarah                         │
│ COMMANDS                                                 │
│   ✉️  Compose new email              ⌘N                  │
│   🔍 Search all mail                 ⌘⇧F                │
│   ⚙  Open settings                  ⌘,                  │
│ CONTACTS                                                 │
│   👤 John Smith — john@company.com                       │
└──────────────────────────────────────────────────────────┘

Position: centered, 560px wide, max 60vh tall
Shadow: shadow-xl
Background: bg-elevated
Border: 1px border-default
Backdrop: black/30% overlay
Animation: opacity + scale(0.98→1), 150ms
```

---

## SKELETON SCREENS (NOT SPINNERS)

Never use loading spinners. Always use skeleton screens that match the exact layout.

```
Message list skeleton:
┌──────────────────────────────────────┐
│ [████] ████████████      ████████    │
│        █████████████████████████     │
├──────────────────────────────────────┤
│ [████] ████████████████  ████████    │
│        ██████████████████████        │
├──────────────────────────────────────┤
│ [████] ██████████        ████████    │
│        ████████████████████████████  │
└──────────────────────────────────────┘

Skeleton color: bg-tertiary with subtle pulse animation (opacity 0.5→1→0.5, 1.5s)
Shape: matches exact component layout (avatar circle, text rectangles)
Duration: show skeleton for minimum 100ms to avoid flash
```

---

## RESPONSIVE BREAKPOINTS

```css
--breakpoint-sm: 640px;   /* mobile */
--breakpoint-md: 768px;   /* tablet */
--breakpoint-lg: 1024px;  /* small desktop */
--breakpoint-xl: 1280px;  /* desktop */
--breakpoint-2xl: 1536px; /* large desktop */
```

**Layout behavior:**
| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column. Sidebar = overlay drawer. No reading pane. |
| 768-1024px | Two columns. Sidebar + message list. Reading pane = overlay. |
| > 1024px | Three columns. Sidebar + message list + reading pane. |

---

## ICON SYSTEM

Use **Lucide React** exclusively. 16px default size. 1.5px stroke width.

```tsx
import { Inbox, Send, Trash2, Star, Paperclip, Search, Settings, ChevronRight } from 'lucide-react'

// Standard size
<Inbox size={16} strokeWidth={1.5} />

// Sidebar icons
<Inbox size={18} strokeWidth={1.5} className="text-secondary" />

// Action bar icons
<Reply size={16} strokeWidth={1.5} className="text-secondary hover:text-primary" />
```

**Rules:**
- Never mix icon libraries
- Never use emoji as icons in the app shell (sidebar, toolbar, etc.)
- Icons are always text-secondary, becoming text-primary on hover/active
- Active nav icon: text-accent (coral)

---

## KEYBOARD SHORTCUT OVERLAY

When user presses `?`, show floating panel (bottom-right):

```
┌───────────────────────────────────┐
│ KEYBOARD SHORTCUTS            [×] │
│                                   │
│ Navigation                        │
│   j / k         Next / Previous   │
│   o / Enter     Open message      │
│   Escape        Close / Back      │
│                                   │
│ Actions                           │
│   r             Reply             │
│   a             Reply All         │
│   f             Forward           │
│   e             Archive           │
│   #             Delete            │
│   s             Star / Flag       │
│   u             Mark unread       │
│                                   │
│ Compose                           │
│   c             New email         │
│   ⌘ Enter       Send              │
│   ⌘ Shift D     Discard draft     │
│                                   │
│ Global                            │
│   /             Search            │
│   ⌘ K           Command palette   │
│   ?             This panel        │
└───────────────────────────────────┘
```

---

## ACCESSIBILITY (WCAG 2.1 AA COMPLIANCE)

EaseMail must be fully accessible to users with disabilities. This is both a legal requirement and the right thing to do.

### Color Contrast Requirements

**All text must meet WCAG 2.1 AA standards:**
- Normal text (< 18px): 4.5:1 minimum contrast ratio
- Large text (>= 18px): 3:1 minimum contrast ratio
- Interactive elements: 3:1 minimum contrast ratio

**Our palette (verified):**
- `text-primary` (#1A1A1A) on white (#FFFFFF) = 16.1:1 ✅
- `text-secondary` (#6B7280) on white = 5.0:1 ✅
- `text-tertiary` (#9CA3AF) on white = 3.2:1 ✅ (use only for >=18px text)
- `accent` (#FF7F50) on white = 3.4:1 ✅ (use only for interactive elements or >=18px)
- `accent-text` (#E5623D) on white = 4.6:1 ✅ (darker variant for body text)

**Dark mode (verified):**
- `text-primary` (#E8EAED) on dark-bg (#0F1419) = 14.2:1 ✅
- `text-secondary` (#8B95A5) on dark-bg = 7.1:1 ✅
- `accent` (#FF7F50) on dark-bg = 3.8:1 ✅

### Keyboard Navigation

**All interactive elements must be keyboard-accessible:**

1. **Tab order:**
   - Follows visual order (left to right, top to bottom)
   - Skip links at top: "Skip to inbox", "Skip to compose"
   - Tab through sidebar → account switcher → folder tree → message list → reading pane → compose

2. **Focus indicators:**
   - Visible 2px solid coral ring with 2px offset on ALL interactive elements
   - Never use `outline: none` without replacement
   - Focus ring visible in both light and dark modes
   ```css
   *:focus-visible {
     outline: 2px solid var(--accent);
     outline-offset: 2px;
   }
   ```

3. **Keyboard shortcuts:**
   - All shortcuts documented in Help panel (press `?`)
   - Shortcuts work WITHOUT requiring mouse (no hover-only actions)
   - Don't override browser shortcuts (no Cmd+W, Cmd+T, etc.)

4. **Focus management:**
   - When opening modal: focus first interactive element
   - When closing modal: return focus to trigger element
   - Focus trap inside modals (Esc to close)
   - Command palette (Cmd+K): trap focus, Esc to close

### Screen Reader Support

**ARIA labels required on:**

1. **Sidebar navigation:**
   ```jsx
   <nav aria-label="Main navigation">
     <button aria-label="Inbox (23 unread)">Inbox</button>
   </nav>
   ```

2. **Message list:**
   ```jsx
   <div role="list" aria-label="Email messages">
     <div role="listitem" aria-label="From John Doe, subject Meeting tomorrow, received 2 hours ago, unread">
   ```

3. **Icon buttons (no text):**
   ```jsx
   <button aria-label="Star this message">
     <StarIcon aria-hidden="true" />
   </button>
   ```

4. **Form inputs:**
   ```jsx
   <label htmlFor="search">Search messages</label>
   <input id="search" aria-describedby="search-hint" />
   <span id="search-hint">Search across all accounts</span>
   ```

5. **Status updates (live regions):**
   ```jsx
   <div aria-live="polite" aria-atomic="true">
     Message sent successfully
   </div>
   ```

6. **Loading states:**
   ```jsx
   <div aria-busy="true" aria-label="Loading messages">
     {/* Skeleton content */}
   </div>
   ```

### Motion & Animation

**Respect `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Animations that must respect this:**
- Modal slide-in transitions
- Tooltip fades
- Page transitions
- Skeleton shimmers
- Button hover effects

**NOT affected:**
- Loading spinners (but we use skeleton screens anyway)
- Smooth scrolling (already optional)

### Semantic HTML

**Use proper semantic elements:**
- `<nav>` for navigation sections
- `<main>` for main content area
- `<article>` for message content
- `<button>` for actions (NOT `<div onClick>`)
- `<a>` for navigation (NOT `<div onClick>`)
- `<form>` for forms (with proper `<label>` elements)

**Headings hierarchy:**
- `<h1>` Page title ("Inbox", "Compose", etc.)
- `<h2>` Section headings ("Filters", "Attachments")
- `<h3>` Subsection headings
- Never skip heading levels

### Focus Trap in Modals

**All modals and overlays must trap focus:**

```tsx
import { FocusTrap } from '@headlessui/react'

<FocusTrap>
  <div className="modal">
    <button onClick={onClose}>Close</button>
    {/* Modal content */}
  </div>
</FocusTrap>
```

**Rules:**
- Tab cycles through modal elements only (cannot tab to elements behind modal)
- Shift+Tab cycles backward
- Esc closes modal and returns focus to trigger

### Images & Media

**All images need alt text:**
- Avatar images: `alt="John Doe's avatar"`
- Decorative images: `alt=""` (empty, NOT missing)
- Inline email images: Use sender-provided alt text or `alt="Image from email"`

**No auto-playing media:**
- No auto-play videos
- No auto-play audio
- User must explicitly click to play

### Forms & Validation

**All form inputs must have:**
1. Associated `<label>` (visible or `aria-label`)
2. `id` attribute matching label's `for`
3. Error messages associated via `aria-describedby`
4. Required fields marked with `aria-required="true"` or `required`

**Error handling:**
```jsx
<input
  id="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
)}
```

### Touch Targets (Mobile)

**All interactive elements must be at least 44x44px:**
- Buttons: minimum 44px tall
- Checkbox/radio: 44x44px clickable area (even if visual is smaller)
- Links in text: minimum 44px tall clickable area

### Testing Checklist

Before launching any new UI component:
- [ ] Tab through entire component with keyboard only
- [ ] Test with VoiceOver (Mac) or NVDA (Windows)
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Run axe DevTools browser extension (catches 80% of issues)
- [ ] Verify color contrast with browser inspector
- [ ] Test on mobile with TalkBack (Android) or VoiceOver (iOS)

### Tools
- **axe DevTools** — Browser extension, catches most issues
- **Lighthouse** — Chrome DevTools > Lighthouse > Accessibility audit
- **WebAIM Contrast Checker** — https://webaim.org/resources/contrastchecker/
- **Screen readers:** VoiceOver (Mac), NVDA (Windows), TalkBack (Android)

---

## CRITICAL ANTI-PATTERNS — NEVER DO THESE

1. ❌ **Card-based message list** — Messages are rows in a table, not cards with shadows
2. ❌ **Colored category badges** — Use text labels, not pills with background colors
3. ❌ **Large avatars** — Max 28px in message list, 32px in message viewer header
4. ❌ **Rounded message bubbles** — This isn't a chat app. Flat rows with borders.
5. ❌ **Gradient anything** — Flat, solid colors only in the app
6. ❌ **Blue links** — Links are text-primary or accent (coral), never blue
7. ❌ **Centered text** — Left-aligned everything (except empty state messages)
8. ❌ **Marketing-style hero sections** — This is a dense productivity app
9. ❌ **Large padding/margins** — Max 24px on any internal component padding
10. ❌ **Loading spinners** — Skeleton screens only
11. ❌ **Multiple accent colors** — Coral is the ONLY color besides grayscale
12. ❌ **Bold (700 weight)** — Semibold (600) is the max weight used
13. ❌ **16px body text in app shell** — Use 13px base, 14px for emphasis
14. ❌ **Decorative illustrations** — No blob illustrations, no decorative SVGs
15. ❌ **Emoji in UI chrome** — Lucide icons only. Emoji OK in email content.

---

## TAILWIND CONFIG ADDITIONS

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.2' }],
        'sm': ['12px', { lineHeight: '1.5' }],
        'base': ['13px', { lineHeight: '1.5' }],
        'md': ['14px', { lineHeight: '1.5' }],
        'lg': ['16px', { lineHeight: '1.2' }],
        'xl': ['18px', { lineHeight: '1.2' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
      },
      colors: {
        accent: {
          DEFAULT: '#FF7F50',
          hover: '#FF6B3D',
          subtle: '#FFF5F0',
          text: '#E5623D',
        },
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
        },
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'xl': '0 8px 32px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
}
```

---

## REFERENCE SCREENSHOTS

When building the UI, Claude Code should reference these apps for visual patterns:

1. **Linear** (linear.app) — Overall layout density, sidebar structure, list design
2. **Superhuman** (superhuman.com) — Email-specific patterns, keyboard-first UX, speed
3. **Raycast** — Command palette design
4. **Vercel Dashboard** — Settings pages, clean forms
5. **Notion** — Composer/editor toolbar design

The goal is NOT to copy these apps. The goal is to achieve the same QUALITY LEVEL
while using EaseMail's own brand identity (coral accent, Geist font, ledger-style).
