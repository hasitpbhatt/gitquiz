# Quiz Portal — Design Roadmap

Prioritized by user-facing impact.  

**Complexity:** ⚡ Quick Win (days) · 🔷 Medium Effort (1-2 weeks) · 🏗️ Major Project (multi-week)

## Tier 1 — Brand & Visual Identity

- [ ] 🔷 **Logo / wordmark** — "LearnLeap" has no visual identity. Need a logo (SVG) and favicon.
- [ ] ⚡ **Color system** — Define palette beyond CSS variables. Accent, success, error, warning, neutral. Document in a design tokens file.
- [ ] ⚡ **Typography scale** — Consistent heading/body sizes, line heights, and weights beyond Tailwind defaults.
- [ ] 🔷 **Social preview / OG images** — No card renders when linking `quiz.hasit.in`. Need a default OG image and dynamic per-course OG for sharing.
- [ ] ⚡ **Empty states** — No search results, no catalog loaded, no courses matching filter — all show blank selects or empty containers.

## Tier 2 — Component System & Consistency

- [ ] ⚡ **Unified button system** — Primary, secondary, ghost, danger variants. Currently "Begin Challenge" and "Skip Module" use different styles.
- [ ] ⚡ **Card system** — Consistent border radius, shadow, padding for preview cards, achievement card, share modals.
- [ ] 🔷 **Form elements** — Select, input, toggle all share the same visual language (currently `<select>` is browser-native).
- [ ] 🔷 **Icons** — Use an icon set (Lucide, Heroicons) instead of inline Unicode characters and emoji for actions.
- [ ] ⚡ **Spinner / loading skeleton** — "Loading..." text for preview. Need a proper skeleton or spinner component.

## Tier 3 — Motion & Micro-interactions

- [ ] 🔷 **Answer feedback animation** — Current correct/wrong is instant color swap. A brief scale + checkmark/cross animation would feel more rewarding.
- [ ] ⚡ **Score pop animation** — Exists in CSS (`score-pop`) but could be punchier — particle burst or confetti on streaks.
- [ ] ⚡ **Progress bar animation** — Currently snaps to new width. Should tween.
- [ ] ⚡ **Toast animation** — Already has fade-in/slide-in but only used for notifications. Could extend to achievement unlocks, streak milestones.

## Tier 4 — Mobile & Responsive

- [ ] 🔷 **Bottom sheet for mobile filters** — Type filter buttons + search take up a lot of vertical space on mobile. Collapse into a bottom sheet or collapsible panel.
- [ ] 🔷 **Swipe gestures** — Swipe left/right to navigate questions on mobile.
- [ ] ⚡ **Touch-friendly option sizing** — Buttons need larger tap targets on small screens (already partially done but verify).
- [ ] ⚡ **Preview screen mobile layout** — Stacks text + options vertically. Could use a two-pane layout on wider screens.

## Tier 5 — Accessibility & Inclusive Design

- [ ] ⚡ **Focus indicators** — Keyboard navigation needs visible focus rings on all interactive elements.
- [ ] 🔷 **ARIA labels** — No `aria-label`, `role`, or `aria-live` regions for screen readers.
- [ ] ⚡ **Color contrast audit** — Ensure all text meets WCAG AA on both light and dark backgrounds.
- [ ] ⚡ **Reduced motion** — Respect `prefers-reduced-motion` for all animations.
- [ ] ⚡ **Font loading strategy** — Google Fonts (Inter + Great Vibes) block render. Use `font-display: swap` or preconnect.
