# Web-to-Mobile Design System Guide

This document captures every UI/UX pattern from `apps/web` so that `apps/mobile` can be updated to match exactly.

---

## 1. Color Palette

### Primary & Brand

| Token | Web Value | Mobile Current | Action |
|-------|-----------|----------------|--------|
| Main (accent) | `#e77d10` | `#e77d10` | No change |
| Main hover | `#e77d10` at 90% opacity | - | Add |

### Backgrounds

| Token | Web Value | Mobile Current | Action |
|-------|-----------|----------------|--------|
| Page background | `#132f54` | `#080A14` | **Change** |
| Card background | `#1B1E2B` | `#13172A` | **Change** |
| Deep dark (set rows) | `#0E1326` | `#0E1224` | **Change** |
| Bottom sheet bg | `#161827` | `#161827` | No change |
| Completed set bg | `#0F4A05` | - | Add |
| Active set bg | `#171C2F` | - | Add |

### Text Colors

| Token | Web Value | Mobile Current | Action |
|-------|-----------|----------------|--------|
| Primary text | `#FFFFFF` | `#FFFFFF` | No change |
| Secondary text | `#94a3b8` (slate-400) | `rgba(255,255,255,0.6)` | **Change to #94a3b8** |
| Muted text | `#64748b` (slate-500) | `rgba(255,255,255,0.4)` | **Change to #64748b** |
| Dim text | `#475569` (slate-600) | `rgba(255,255,255,0.35)` | **Change to #475569** |

### Semantic / Status Colors

| Token | Web Value | Mobile Current | Action |
|-------|-----------|----------------|--------|
| Success | `#10b981` (emerald-500) | `#22c55e` | **Change to #10b981** |
| Completion green | `#69FF2F` | - | Add |
| Error / Red | `#ef4444` | `#ef4444` | No change |
| Warning | `#f97316` (orange-500) | `#f59e0b` | **Change to #f97316** |
| Info / Blue | `#3b82f6` | - | Add |
| Purple | `#a855f7` | - | Add |
| Yellow | `#eab308` | - | Add |

### Transparency Overlays

| Usage | Web Value |
|-------|-----------|
| Modal overlay | `bg-black/50` with `backdrop-blur-sm` |
| Dark overlay (general) | `bg-black/30`, `bg-black/40`, `bg-black/60` |
| Light overlay on dark | `bg-white/5`, `bg-white/8`, `bg-white/10`, `bg-white/20` |
| Ring / border subtle | `ring-white/5`, `ring-white/10` |
| Main accent at low opacity | `bg-main/10`, `bg-main/20`, `bg-main/40` |

### Chart / Data Visualization Colors

| Muscle Group | Color |
|-------------|-------|
| Legs | `#e77d10` |
| Back | `#3b82f6` |
| Chest | `#ef4444` |
| Shoulders | `#a855f7` |
| Arms | `#22c55e` |
| Core | `#eab308` |
| Other | `#64748b` |

### Gradient Definitions

**Volume chart gradient:**
```
vertical: #e77d10 at 30% opacity (top) -> #e77d10 at 0% opacity (bottom)
```

**Pain chart gradient:**
```
vertical: #48c268 at 30% opacity (top) -> #48c268 at 0% opacity (bottom)
```

**Pain/intensity slider:**
```
horizontal: #10b981 (0%) -> #84cc16 (30%) -> #eab308 (50%) -> #f97316 (70%) -> #ef4444 (100%)
```

---

## 2. Typography

### Font Sizes

| Usage | Web (Tailwind) | Pixel Size |
|-------|----------------|------------|
| Hero / page title | `text-4xl` | 36px |
| Section title | `text-3xl` | 30px |
| Modal title | `text-2xl` | 24px |
| Subsection title | `text-xl` | 20px |
| Card title / exercise name | `text-lg` | 18px |
| Body text | `text-base` | 16px |
| Labels, descriptions | `text-sm` | 14px |
| Small metadata | `text-xs` | 12px |
| Micro labels | `text-[11px]` | 11px |
| Tiny text | `text-[10px]` | 10px |

### Font Weights

| Usage | Weight |
|-------|--------|
| Bold emphasis, numbers | `font-bold` (700) |
| Headers, labels | `font-semibold` (600) |
| Subheadings, buttons | `font-medium` (500) |
| Body text | `font-normal` (400) |

### Letter Spacing (Tracking)

| Usage | Value |
|-------|-------|
| Uppercase labels | `tracking-[0.2em]` (3.2px) |
| Input labels | `tracking-[0.32em]` |
| Logo text | `tracking-[0.34em]` |
| General uppercase | `tracking-wider` |
| Extra wide | `tracking-widest` |

### Text Transform

- Buttons, labels, nav items, section headers: `uppercase`
- Body text and descriptions: normal case

---

## 3. Spacing System

### Component Padding

| Component | Padding |
|-----------|---------|
| Cards | `p-4` (16px) / `p-5` (20px) / `p-6` (24px) |
| Buttons | `px-4 py-2` (16px x 8px) |
| Primary buttons | `py-3` (12px vertical), full width |
| Inputs | `px-5 py-0` (20px horizontal, 48px total height) |
| Search inputs | `px-10 py-3` (40px x 12px) |
| Section containers | `mx-2.5` (10px horizontal margin) |

### Gaps

| Context | Gap |
|---------|-----|
| Page sections | `gap-5` (20px) |
| Form fields | `space-y-5` (20px) |
| Card items in list | `space-y-3` (12px) / `space-y-2` (8px) |
| Icon + text | `gap-2` (8px) |
| Card content | `gap-3` (12px) / `gap-4` (16px) |
| Stat cards grid | `gap-3` (12px) |
| Bottom nav items | `gap-4` (16px) |

### Standard Heights

| Element | Height |
|---------|--------|
| Input fields | `h-12` (48px) |
| Primary buttons | `h-11` (44px) implied via py-3 |
| Small buttons | `h-9` (36px) |
| Icons (default) | `h-5 w-5` (20px) |
| Icons (small) | `h-4 w-4` (16px) |
| Icons (large) | `h-6 w-6` (24px) |
| Exercise thumbnails | `h-16 w-16` (64px) or `h-12 w-12` (48px) |
| Weekly activity dots | `h-8 w-8` (32px) |
| Progress bar track | `h-2` (8px) |

### Bottom Padding (for nav)

- Page content: `pb-24` (96px) to clear bottom navigation

---

## 4. Border Radius

| Element | Radius | Pixels |
|---------|--------|--------|
| Cards, buttons | `rounded-[14px]` | 14px |
| Input fields | `rounded-[18px]` | 18px |
| Bottom sheets (top) | `rounded-t-[30px]` | 30px |
| Search inputs | `rounded-lg` | 8px |
| Modals | `rounded-2xl` | 16px |
| Icon buttons | `rounded-full` | 50% |
| Bottom nav bar | `rounded-[10px]` | 10px |
| Progress bar | `rounded-full` | 50% |
| Activity dots | `rounded-full` | 50% |
| Tags/badges | `rounded-full` | 50% |

---

## 5. Component Specifications

### 5.1 Buttons

**Primary Button (CTA):**
```
- Background: #e77d10 (main)
- Text: white, 14px, font-semibold, uppercase (optional)
- Border radius: 14px
- Width: full
- Padding: 12px vertical
- Shadow: shadow-lg
- Hover: main at 90% opacity
- Focus: 2px ring, main color, 2px offset
- Disabled: 50% opacity, cursor-not-allowed
```

**Secondary Button:**
```
- Background: white at 10% opacity
- Text: white, 14px, font-medium
- Border radius: 14px
- Backdrop blur
- Hover: white at 20% opacity
```

**Ghost / Icon Button:**
```
- Background: transparent
- Text: slate-200
- Border radius: full (circular)
- Padding: 4px
- Hover: text-white
```

**Colored Variants (action sheets):**
```
- Blue:   bg-main/10,        text-main/70,      hover: bg-main/20
- Red:    bg-rose-600/10,     text-rose-300,     hover: bg-rose-600/20
- Green:  bg-emerald-600/10,  text-emerald-300,  hover: bg-emerald-600/20
- Violet: bg-violet-600/10,   text-violet-300,   hover: bg-violet-600/20
```

### 5.2 Input Fields

**Standard Input:**
```
- Height: 48px (h-12)
- Border: 1px solid white/80
- Border radius: 18px
- Background: transparent
- Text: white, 18px (text-lg), font-semibold
- Padding: 0 20px
- Focus: border changes to main, 2px ring main/40
- Placeholder: white at 25% opacity
```

**Disabled Input:**
```
- Border: 1px solid white/8
- Background: white/5
- Shows static value text
```

**Search Input:**
```
- Background: #1B1E2B at 80% opacity
- Border: 1px solid white/10
- Border radius: 8px (rounded-lg)
- Padding: 40px left (for icon), 12px vertical
- Placeholder: slate-500
- Focus: 2px ring main, border transparent
```

**Textarea (chat):**
```
- Border: 1px solid white/80
- Border radius: 18px
- Background: transparent
- Padding: 12px 16px
- Max height: 128px (max-h-32)
- Auto-resize
- Disabled: 50% opacity
```

**Input Label:**
```
- Text: 11px, font-semibold, uppercase
- Letter spacing: 0.32em
- Color: white (implied by context)
- Layout: flex column, gap-2 between label and input
```

### 5.3 Cards

**Exercise Card:**
```
- Background: #1B1E2B
- Border radius: 14px
- Padding: 12px
- Shadow: shadow-xl
- Ring: 1px white/5
- Layout: flex row, gap-20px, items-center
- Contains: image (64px), text stack, optional badge
```

**Stat Card:**
```
- Background: #1B1E2B at 80%
- Border radius: 14px
- Padding: 16px
- Ring: 1px white/5
- Hover: ring white/10
- Layout: flex column, gap-8px
- Contains: icon+label row, large value, sub-value
```

**Content Card (generic):**
```
- Background: #1B1E2B at 80%
- Border radius: 14px
- Padding: 16px
- Ring: 1px white/5
```

**Form Card (auth pages):**
```
- Background: white (#FFFFFF)
- Border radius: 14px
- Padding: 20px
- Margin: 0 10px
- Shadow: shadow-lg
- Backdrop blur
```

### 5.4 Bottom Navigation

```
- Background: #1B1E2B
- Border radius: 10px
- Layout: flex, justify-evenly, gap-16px
- Width: full, max 440px
- Position: fixed bottom

Tab button (active):
- Background: main (#e77d10)
- Text: white
- Border radius: 14px

Tab button (inactive):
- Background: #1B1E2B
- Text: slate-200
- Hover: text-white

4 tabs: Workout, Progress, History, AI
```

### 5.5 Bottom Sheets

```
- Overlay: fixed inset-0, bg-black/50
- Container: fixed bottom, max-w-440px, centered
- Sheet: bg-#161827, rounded-t-30px
- Handle: centered, h-1 w-10, rounded-full, bg-slate-700
- Min height: 300px
- Max height: 85vh
- Content: overflow-y-auto
- Close: tap overlay or press Escape
```

### 5.6 Modals / Dialogs

```
- Overlay: fixed inset-0, bg-black/50, backdrop-blur-sm
- Container: centered (flex items-center justify-center)
- Modal: rounded-2xl, bg-blue-900/40, p-16-24px, shadow-lg, backdrop-blur
- Max width: 400px (md breakpoint)
- Z-index: 50
```

### 5.7 Progress Bar

```
Track:
- Height: 8px (h-2)
- Background: gray-200
- Border radius: full

Fill:
- Height: 8px (h-2)
- Background: main (#e77d10)
- Border radius: full
- Transition: all 300ms
- Width: dynamic percentage
```

### 5.8 Badges & Indicators

**Completion Badge:**
```
- Text: 11px, font-semibold, uppercase
- Letter spacing: 0.3em
- Color: emerald-300 (#6ee7b7)
- Layout: inline-flex, items-center, gap-4px
- Dot: 4px circle, bg-emerald-300
```

**Checkmark Button (logged set):**
```
- Size: h-44px w-56px
- Border: 1px solid #69FF2F
- Background: #69FF2F
- Text color: #061404 (dark green)
- Border radius: full
```

**Unlogged Checkmark:**
```
- Border: 1px solid white/20
- Background: transparent
- Border radius: full
```

### 5.9 Exercise Set Row

```
Grid layout: grid-cols-[44px_1fr_68px_68px_52px]
Gap: 8px
Items: center aligned

Columns:
1. Set number (44px) - text-sm font-medium text-slate-200
2. Previous data (flex) - text-xs text-slate-400
3. Weight input (68px)
4. Reps input (68px)
5. Checkmark button (52px)

Row backgrounds:
- Default: #0E1326
- Active (being edited): #171C2F
- Completed: #0F4A05

Set input fields:
- Height: 36px (h-9)
- Background: transparent
- Border: 1px solid white/10
- Border radius: 8px
- Text: centered, font-medium
- Focus: ring-1 main/60
```

### 5.10 Swipe-to-Delete

```
- Swipe direction: left
- Background revealed: red (#ef4444)
- Delete icon shown at right
- Threshold: 150px to trigger delete
- Snap back if < 50% swiped
- Animation: opacity 0 + height 0 on delete
- Exercise cards have two swipe actions: Replace + Delete
- Max swipe offset: 176px (2 x 88px action width)
```

### 5.11 Chat Interface

**User Message:**
```
- Background: main (#e77d10)
- Text: white
- Alignment: right
- Max width: 80%
- Border radius: standard card radius
- Padding: standard
```

**Assistant Message:**
```
- Background: #1B1E2B at 80%
- Text: slate-100
- Alignment: left
- Max width: 80%
```

**Typing Indicator:**
```
- 3 dots, each 8px (w-2 h-2)
- Color: slate-400
- Animation: bounce with staggered delays (0ms, 150ms, 300ms)
```

**Chat Input:**
```
- Textarea with auto-height (grows to max-h-32)
- Send button: bg-main, circular, with arrow icon
- Container at bottom of screen
```

---

## 6. Layout Patterns

### Page Container

```
- Max width: 440px
- Centered: mx-auto
- Min height: 100vh (or screen height)
- Background: #132f54 (or background image)
- Content padding: mx-2.5 (10px sides)
- Content gap: gap-5 (20px)
- Bottom padding: pb-24 (96px for nav)
- Safe area insets applied
```

### Header

```
- Layout: flex, items-start, justify-between
- Left: Logo component
- Right: Action button(s) - language toggle, settings, etc.
```

### Section Header

```
- Text: text-lg font-semibold text-white
- Margin bottom: mb-3 or mb-4
```

### Two-Column Grid (stat cards, form fields)

```
- Grid: grid-cols-2
- Gap: gap-3 (12px) for stats, gap-4 (16px) for forms
```

### Vertical Lists

```
- Spacing: space-y-2 or space-y-3
- Grouped by date/category with section headers
```

---

## 7. Animations & Transitions

### Standard Transitions

| Element | Duration | Easing |
|---------|----------|--------|
| Default (hover, color) | 150ms | ease-out |
| Progress bars | 300ms | ease (via transition-all) |
| Page loading | 200ms | ease-out (fade-in) |

### Loading States

**Page Loader:**
```
- Full overlay, centered
- Spinner: rotating border animation (0.8s linear infinite)
- Border: 4px, main color + main/20 (track)
- Size: implied 40px spinner
- Fade in: 200ms
```

**Skeleton Loader (images):**
```
- Animated pulse (animate-pulse)
- Background: slate-700/60
- Covers full container until image loads
```

**Button Loading:**
```
- Spinner: animate-spin
- Size: h-5 w-5
- Replaces button text
```

**Typing dots (chat):**
```
- 3 circles, animate-bounce
- Staggered: 0ms, 150ms, 300ms delay
- Size: w-2 h-2
- Color: slate-400
```

### Interactive Feedback

```
- Hover: color change (immediate)
- Active: scale-95 (press feedback)
- Focus: 2px ring with main color
```

---

## 8. Icons

**Approach:** Custom inline SVG components

**Standard Properties:**
```
- viewBox: "0 0 24 24"
- fill: "none"
- stroke: "currentColor"
- strokeWidth: "2" or "2.5"
- strokeLinecap: "round"
- strokeLinejoin: "round"
```

**Sizes:**
- Small: 16px (h-4 w-4)
- Default: 20px (h-5 w-5)
- Large: 24px (h-6 w-6)

**Icon Set Used:**
- Eye / EyeOff (password toggle)
- ChevronLeft / ChevronRight / ChevronDown
- Play (start workout)
- Trash / Delete
- Replace (swap arrows)
- Info (circle-i)
- Settings (gear)
- ThreeDots (menu)
- Checkmark
- Feedback (message bubble)
- Search (magnifying glass)

---

## 9. Specific Page Patterns

### 9.1 Auth Pages (Login / Register)

```
Layout:
- Page background: #132f54 (or themed image)
- Centered card: white background, rounded-14px, shadow-lg, p-20px
- Form: space-y-5

Elements:
- FormHeader: title (text-2xl font-semibold text-main) + subtitle (text-sm text-slate-600)
- FormField: label (11px uppercase tracking-0.32em) + input (h-12 rounded-18px)
- PasswordInput: input + eye toggle button
- SubmitButton: full-width, bg-main, py-3, rounded-14px
- Divider: "or" text with lines
- AuthSwitchLink: bottom text + link in main color
```

### 9.2 Home Screen

```
Layout:
- Logo top-left + language selector top-right
- Welcome text: text-4xl font-semibold
- Plan cards: exercise cards list
- "Start Workout" button: primary CTA
- "My Plan" section with exercise count

Exercise Card (in plan):
- Thumbnail 64px
- Name + metadata
- Completion status badge (if done)
```

### 9.3 Workout Screen (Active)

```
Header:
- Back button + workout title + timer
- Close button

Exercise Section:
- Exercise name (text-lg font-semibold)
- Exercise image (large)
- Info button (exercise details)

Sets Table:
- 5-column grid
- Column headers: SET, PREVIOUS, KG, REPS, checkmark icon
- Set rows with inputs
- "Add Set" button at bottom

Controls:
- "Replace Exercise" button
- "Next Exercise" / "Finish Workout" button
- Rest timer (auto-popup between sets)
```

### 9.4 Progress Screen

```
Layout:
- Header: "Progress" title
- Stats grid: 2x2 cards
  - Total workouts
  - Total volume
  - Avg duration
  - Streak

Charts section:
- Volume over time (area chart)
- Muscle group distribution (pie chart)
- Weekly frequency (bar chart)

Exercise list:
- Each exercise with progress indicator
- Tap to see detailed exercise progress
```

### 9.5 History Screen

```
Layout:
- Header: "History" title
- Search input with icon
- Grouped by date
- Each entry: workout name + date + duration + exercise count
- Tap to expand details
- Swipe to delete
```

### 9.6 AI Chat Screen

```
Layout:
- Header: "AI Coach" title
- Messages area: scrollable, flex-col
- Messages: bubbles (user right, AI left)
- Input area: fixed bottom, textarea + send button

Empty State:
- Suggestion chips/prompts
- Welcome message
```

### 9.7 Settings Screen

```
Layout:
- Header: "Settings" title
- Sections with labels
- Row items: label + value/toggle
- Background: cards with rounded-14px
- Destructive actions at bottom (logout, delete account in red)
```

---

## 10. Z-Index Layers

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base content | 0 | Normal page content |
| Elevated cards | 10 | Cards with relative positioning |
| Bottom navigation | 30 | Fixed nav bar |
| Bottom sheets | 40-50 | Action sheets, modals |
| Overlays | 50 | Modal backdrops |
| Page loader | 50 | Loading overlay |
| Top-level modals | 60-70 | Critical modals |

---

## 11. Mobile-Specific Adaptation Notes

### What translates directly:
- Color values (all hex colors, opacity values)
- Font sizes and weights
- Spacing values (padding, margin, gap)
- Border radius values
- Icon SVGs (same component pattern)
- Component structure and hierarchy

### What needs React Native adaptation:
- `backdrop-blur` -> may need `expo-blur` or skip on Android
- `shadow-xl` -> React Native shadow properties (iOS) or elevation (Android)
- `ring-1 ring-white/5` -> borderWidth + borderColor
- `hover:` states -> `Pressable` with pressed state
- CSS Grid (`grid-cols-...`) -> nested `flex` layouts
- `position: fixed` -> use React Navigation headers / absolute positioning
- `overflow-y-auto` with scrollbar-hide -> `ScrollView` with `showsVerticalScrollIndicator={false}`
- `transition-all` -> `Animated` API or `react-native-reanimated`
- `backdrop-blur-sm` on overlays -> `BlurView` from `expo-blur`
- `createPortal` for modals -> React Native `Modal` component or overlay
- CSS gradients -> `expo-linear-gradient`
- Recharts -> `react-native-chart-kit` or `victory-native` or `react-native-svg-charts`
- `max-w-[440px]` -> not needed (mobile is naturally narrow)
- `cursor-pointer` -> not applicable
- `safe-area-inset-*` -> `react-native-safe-area-context`
- Swipe gestures -> `react-native-gesture-handler` (already likely in use)

### NativeWind class mapping:
Most Tailwind classes work directly in NativeWind. Key exceptions:
- `ring-*` -> use `border-*` equivalent
- `shadow-*` -> NativeWind supports limited shadow classes
- `backdrop-blur` -> not supported, use native blur components
- `tracking-[0.32em]` -> `letterSpacing` style prop
- `bg-gradient-*` -> not supported, use LinearGradient component

---

## 12. Mobile `colors.ts` Update

Replace `apps/mobile/src/theme/colors.ts` with these values to match web:

```typescript
export const colors = {
  main: "#e77d10",

  background: {
    primary: "#132f54",    // was #080A14
    secondary: "#0E1326",  // was #0E1224
    tertiary: "#1B1E2B",   // same
  },

  card: {
    primary: "#1B1E2B",    // was #13172A - match web card bg
    secondary: "#161827",  // same
    tertiary: "#1F2232",   // keep
  },

  text: {
    primary: "#FFFFFF",
    secondary: "#94a3b8",       // was rgba white 60%
    tertiary: "#64748b",        // was rgba white 40%
    muted: "#475569",           // was rgba white 35%
  },

  border: {
    primary: "rgba(255, 255, 255, 0.1)",   // same
    secondary: "rgba(255, 255, 255, 0.05)", // same
    input: "rgba(255, 255, 255, 0.8)",      // same
  },

  status: {
    success: "#10b981",    // was #22c55e
    error: "#ef4444",      // same
    warning: "#f97316",    // was #f59e0b
    info: "#3b82f6",       // new
  },

  completion: "#69FF2F",   // new - logged set checkmark

  set: {
    default: "#0E1326",
    active: "#171C2F",
    completed: "#0F4A05",
  },

  chart: {
    legs: "#e77d10",
    back: "#3b82f6",
    chest: "#ef4444",
    shoulders: "#a855f7",
    arms: "#22c55e",
    core: "#eab308",
    other: "#64748b",
  },

  overlay: "rgba(0, 0, 0, 0.5)",  // was 0.4
};
```

---

## 13. Mobile `tailwind.config.js` Update

Extend the mobile Tailwind config to include all web colors:

```javascript
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        main: "#e77d10",
        background: {
          primary: "#132f54",
          secondary: "#0E1326",
          tertiary: "#1B1E2B",
        },
        card: {
          primary: "#1B1E2B",
          secondary: "#161827",
          tertiary: "#1F2232",
        },
      },
      borderRadius: {
        card: "14px",
        input: "18px",
        sheet: "30px",
      },
    },
  },
  plugins: [],
};
```

---

## 14. Checklist: Screen-by-Screen Changes

Use this checklist when updating each mobile screen:

- [ ] **Background color**: Change from `#080A14` to `#132f54`
- [ ] **Card backgrounds**: Change from `#13172A` to `#1B1E2B`
- [ ] **Text colors**: Use `#94a3b8` for secondary, `#64748b` for muted
- [ ] **Border radius**: Cards 14px, inputs 18px, sheets 30px top
- [ ] **Button styling**: Primary bg-main rounded-14px, secondary bg-white/10
- [ ] **Input styling**: h-48px, border white/80, rounded-18px, focus ring main
- [ ] **Spacing**: Match exact padding/gap values from section 3
- [ ] **Typography**: Match font sizes, weights, and tracking from section 2
- [ ] **Icons**: Ensure SVG icons match web set (stroke-2, 24px viewBox)
- [ ] **Bottom nav**: bg-#1B1E2B, active tab bg-main, 4 tabs
- [ ] **Bottom sheets**: bg-#161827, rounded-t-30px, handle bar
- [ ] **Exercise sets**: 5-column layout, colored row backgrounds
- [ ] **Progress indicators**: h-2 track, main fill, rounded-full
- [ ] **Completion states**: #69FF2F checkmark, #0F4A05 completed row bg
- [ ] **Shadows**: Apply elevation/shadow equivalent for cards
- [ ] **Animations**: Pulse skeletons, bounce typing dots, spin loaders
