# Ripples — Product & Interaction Specification

**Status:** Design approved, implementation pending  
**Visual direction:** Soft Gradient (Design D)  
**Parent experience:** Quiet Workspace + Widgets  
**Responsive target:** Desktop, tablet and mobile from the first implementation

## 1. Product intent

Ripples is a calm, visual habit tracker. Each habit is represented by an individual soft-gradient bubble. Habits belong to user-defined categories; a category owns its color palette, while each habit owns its schedule and completion history.

The interface should communicate momentum and consistency without turning daily habits into a competitive game. Avoid harsh neon, heavy glass effects, dense tables and noisy celebration animations.

## 2. Information architecture

The Ripples area contains four primary regions:

1. **Header** — page title, short supporting line, current date and primary “New ripple” action.
2. **Progress summary** — active habits, current best/active streak and completion rate for the selected period.
3. **Flow canvas** — chronological diagonal arrangement of habit bubbles, newest habit first.
4. **Supporting controls** — category filters, period selector, category manager and habit detail panel.

The initial release should use local mock data behind a small data-access boundary. Persistence and backend integration can be added later without changing the presentation components.

## 3. Component architecture

### RipplesPage
Page-level composition and orchestration. Owns selected period, category filter, selected habit, and create/edit dialog state. It should not contain bubble rendering or domain calculations.

### RippleHeader
Displays title, subtitle, date context and the primary create action. On narrow screens the action becomes a full-width or compact icon-plus-label control without causing horizontal overflow.

### RippleStats
Displays:
- Active habits
- Current streak (best current streak across active habits for the initial release)
- Completion rate for the selected period

Stats must derive from habit completion records, not separately maintained counters.

### RippleToolbar
Contains category filtering, period selection and category management. On mobile, filters wrap or move into a compact sheet; controls must remain touch-friendly.

### RippleFlow
Owns the responsive layout and chronological placement. It receives already sorted habits and renders RippleBubble items. The layout must remain understandable without animation and must not rely on absolute positioning that causes overlap.

### RippleBubble
A single habit visualization. Shows a short habit name, optional icon, completion state and accessible text. Category color drives a restrained multi-stop gradient. Bubble sizes may vary within a narrow range based on emphasis, but size must not encode an ambiguous metric.

### RippleDetail
A side panel on desktop and a bottom sheet/full-screen dialog on mobile. Shows habit description, category, schedule, streak, recent completion history and edit actions.

### RippleCreateDialog
Creates a habit with name, optional description, category, schedule/frequency and optional icon. Category is required; if no category exists, guide the user to create one inline.

### RippleCategoryManager
Creates, renames, recolors and archives categories. A category color is selected from curated accessible palettes; custom color input can be added later. Existing habits retain their category association when a category is renamed or recolored.

### RippleCompletionControl
A dedicated, keyboard-accessible action for marking a habit complete or undoing today's completion. Completion state must not be communicated by color alone.

## 4. Domain model

Use stable IDs and keep category identity separate from category presentation.

TypeScript shape:

- RippleCategory: id, name, color, archivedAt, createdAt, updatedAt
- RippleHabit: id, name, description, categoryId, icon, schedule, createdAt, archivedAt
- RippleCompletion: id, habitId, completedOn (local YYYY-MM-DD date), completedAt (ISO timestamp)

Schedule kinds: daily, weekdays, weekly, custom. Custom schedules store weekdays as numbers 0–6 (Sunday–Saturday).

Completion records are appendable history. Enforce one completion per habit per local calendar date. Undoing a completion removes or marks that day's record according to the eventual persistence strategy; do not silently alter older dates.

## 5. Ordering and diagonal flow

The newest habit always starts at the upper-left. Sort by createdAt descending, with a stable ID tie-breaker. The visual flow then places successive items diagonally down and right.

Recommended first implementation:
- Use CSS Grid with responsive column counts.
- Assign each item a small deterministic column/row offset derived from its sorted index.
- Keep DOM order identical to chronological order for keyboard and screen-reader navigation.
- Use CSS transforms or grid row/column placement only for visual offset; never reorder the DOM.
- On mobile, switch to a single-column vertical stream with a subtle alternating horizontal offset.
- If the layout becomes too sparse at a given width, reduce the offset before reducing bubble readability.

The flow must never depend on random positions. The same habits should render in the same positions after refresh.

## 6. Soft Gradient visual system

### Bubble surface
- Category color is the source hue.
- Use a soft two- or three-stop gradient with a lighter highlight and a deeper edge tone.
- Add a subtle inner highlight and restrained shadow for depth.
- Avoid bright outlines, strong blur and excessive transparency.
- Keep text contrast accessible; use a dark or light text treatment based on measured palette contrast, not assumptions about the category hue.
- Provide a visible completion mark (check icon plus state label in accessible text).

### States
- **Default:** calm gradient, subtle depth.
- **Hover/focus:** slight lift and a small increase in highlight; visible keyboard focus ring.
- **Completed today:** gentle inner glow and check indicator.
- **Overdue/missed:** do not turn the entire bubble red; show a restrained secondary indicator only where schedule logic confirms it is due.
- **Selected:** clearer border/ring and expanded detail context.
- **Archived:** removed from active flow; accessible from history/category management.

### Motion
- New bubble: short opacity + scale entrance.
- Completion: brief light pulse, then settle into completed state.
- Hover: 150–220ms transform/shadow transition.
- Respect prefers-reduced-motion; state changes must remain understandable with motion disabled.
- No continuous floating animation and no blocking intro sequence.

## 7. Interaction contracts

| User action | Expected result |
|---|---|
| Select a bubble | Opens habit detail |
| Complete a habit | Creates today's completion and updates stats immediately |
| Undo today's completion | Removes today's completion state and recalculates stats |
| Create a habit | Adds it to the top-left of the flow after save |
| Create a category | Makes it available in the habit form and filters |
| Recolor a category | Updates all bubbles in that category consistently |
| Rename a category | Updates labels without changing habit identity |
| Filter by category | Shows only matching habits; ordering remains newest first |
| Change period | Recalculates completion rate and history summary |
| Archive a habit | Removes it from active flow but preserves completion history |

All destructive actions (archive/delete) require clear confirmation or an undo affordance. Avoid permanent deletion in the first iteration.

## 8. Responsive behavior

### Desktop (wide)
- Header and stats in a compact top section.
- Diagonal multi-column flow with generous whitespace.
- Detail panel may open on the right without squeezing the flow below a usable width.

### Tablet
- Fewer flow columns and smaller offsets.
- Stats may wrap into two rows.
- Detail view becomes an overlay if the content area is constrained.

### Mobile
- Single-column chronological stream with gentle alternating offsets.
- Stats use compact two-column or horizontally scroll-free cards.
- Toolbar wraps or opens a sheet.
- Create/edit forms use a full-width dialog or bottom sheet.
- Bubble hit targets and controls are at least 44px.
- No horizontal page overflow at 320px viewport width.

## 9. Accessibility and quality requirements

- Semantic headings and buttons; no clickable non-interactive div elements.
- Keyboard navigation follows newest-to-oldest DOM order.
- Visible focus styles in both themes.
- Completion status announced in accessible names/labels.
- Never rely on category color alone to convey meaning.
- Respect reduced-motion preference.
- Validate contrast for text on every supported category palette.
- Test at 320px, 375px, 768px, 1024px and wide desktop widths.
- Test long habit names, empty categories, no habits, many habits and narrow screens.
- Unit-test date boundaries and streak calculations in the user's local timezone.

## 10. Delivery plan

### Phase 1 — Foundation
- Add domain types and pure date/streak/completion selectors.
- Add deterministic newest-first sorting.
- Add category palette tokens and theme-aware bubble styles.

### Phase 2 — Read-only visual experience
- Build RipplesPage, header, stats, toolbar, flow and bubble components.
- Add responsive diagonal layout and mobile vertical stream.
- Use representative mock data and empty/loading states.

### Phase 3 — Interactions
- Add habit detail, create/edit flow, category manager and completion/undo.
- Add filters and period selection.
- Add reduced-motion and keyboard/accessibility QA.

### Phase 4 — Persistence
- Replace mock repository with the chosen persistence/API implementation.
- Preserve stable IDs and completion history.
- Add error/loading/retry states and data migration strategy.

## 11. Explicitly out of scope for the first visual milestone

- Social sharing, leaderboards or public profiles.
- AI-generated habit recommendations.
- Complex analytics dashboards.
- Drag-and-drop manual positioning.
- Arbitrary freeform bubble placement.
- Sound effects or persistent animated effects.

The first milestone is complete only when the responsive read-only experience is implemented and reviewed at desktop, tablet and mobile sizes. The full feature is complete only after interactions, persistence, accessibility and date/streak tests pass.
