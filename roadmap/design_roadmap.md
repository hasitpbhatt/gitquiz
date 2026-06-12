# Quiz Portal — Design Roadmap

Prioritized by user-facing impact.  

**Complexity:** ⚡ Quick Win (days) · 🔷 Medium Effort (1-2 weeks) · 🏗️ Major Project (multi-week)

## Tier 1 — Brand & Visual Identity

- [ ] 🔷 **Logo / wordmark** — "LearnLeap" has no visual identity. Need a logo (SVG) and favicon.
- [ ] ⚡ **Color system** — Define palette beyond CSS variables. Accent, success, error, warning, neutral. Document in a design tokens file.
- [ ] ⚡ **Typography scale** — Consistent heading/body sizes, line heights, and weights beyond Tailwind defaults.
- [ ] 🔷 **Social preview / OG images** — No card renders when linking `quiz.hasit.in`. Need a default OG image and dynamic per-course OG for sharing.
- [ ] ⚡ **Empty states** — No search results, no catalog loaded, no courses matching filter — all show blank selects or empty containers.
- [ ] 🔷 **Surface AI Explain as primary interaction** — Redesign post-answer flow so explanation panel appears automatically (not behind button click). Add Explore Mode toggle in catalog: soft correct/incorrect, no streak pressure, AI Explain default. 4 persona buttons should be prominently visible, not hidden behind "Ask AI."

## Tier 2 — Component System & Consistency

- [ ] ⚡ **Unified button system** — Primary, secondary, ghost, danger variants. Currently "Begin Challenge" and "Skip Module" use different styles.
- [ ] ⚡ **Card system** — Consistent border radius, shadow, padding for preview cards, achievement card, share modals.
- [ ] 🔷 **Form elements** — Select, input, toggle all share the same visual language (currently `<select>` is browser-native).
- [ ] 🔷 **Icons** — Use an icon set (Lucide, Heroicons) instead of inline Unicode characters and emoji for actions.
- [ ] ⚡ **Remove A/B/C/D letter prefixes from options** — Letter labels confound shuffling, frame experience as "test-taking," confuse users when positions change. Replace with clean buttons. Add radio-button affordances (hover/selected states).
- [ ] ⚡ **Spinner / loading skeleton** — "Loading..." text for preview. Need a proper skeleton or spinner component.

## Tier 3 — Motion & Micro-interactions

- [ ] 🔷 **Answer feedback animation** — Current correct/wrong is instant color swap. A brief scale + checkmark/cross animation would feel more rewarding.
- [ ] ⚡ **Score pop animation** — Exists in CSS (`score-pop`) but could be punchier — particle burst or confetti on streaks.
- [ ] ⚡ **Progress bar animation** — Currently snaps to new width. Should tween.
- [ ] ⚡ **Toast animation** — Already has fade-in/slide-in but only used for notifications. Could extend to achievement unlocks, streak milestones.
- [ ] ⚡ **Completion screen reflection animation** — Animate transition from last question to a reflection screen (learning velocity, review queue, related course). Staggered fade-in with "you've grown" visual metaphor instead of score/trophy pop.

## Tier 4 — Mobile & Responsive

- [ ] 🔷 **Bottom sheet for mobile filters** — Type filter buttons + search take up a lot of vertical space on mobile. Collapse into a bottom sheet or collapsible panel.
- [ ] 🔷 **Swipe gestures** — Swipe left/right to navigate questions on mobile.
- [ ] ⚡ **Touch-friendly option sizing** — Buttons need larger tap targets on small screens (already partially done but verify).
- [ ] ⚡ **Preview screen mobile layout** — Stacks text + options vertically. Could use a two-pane layout on wider screens.

## Tier 5 — Accessibility & Inclusive Design

- [ ] ⚡ **Focus indicators** — Keyboard navigation needs visible focus rings on all interactive elements.
- [ ] 🔷 **ARIA labels** — No `aria-label`, `role`, or `aria-live` regions for screen readers.
- [ ] ⚡ **Color contrast audit (WCAG AA)** — Ensure all text meets WCAG AA on both light and dark backgrounds. `#topic-title` has <4.5:1 in light mode and <5:1 in dark mode per NN Group audit.
- [ ] ⚡ **Reduced motion** — Respect `prefers-reduced-motion` for all animations.
- [ ] ⚡ **Font loading strategy** — Google Fonts (Inter + Great Vibes) block render. Use `font-display: swap` or preconnect.
- [ ] 🔷 **Screen reader audit** — Missing `aria-label`, `role`, and `aria-live` regions on dynamic content (quiz question, timer, score updates). Quiz engine updates DOM without notifying assistive technology.
