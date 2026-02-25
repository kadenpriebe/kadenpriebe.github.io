# Roadmap: Kaden Priebe Personal Website

## Phases

- [x] **Phase 1: Foundation & Design System** - Establish the technical foundation, visual identity, and responsive layout system.
- [ ] **Phase 2: Core Content Pages** - Deliver the primary content-driven pages (About, Projects, Blog, Now) with real data.
- [ ] **Phase 3: Interactive Layer & Animations** - Add personality through micro-animations, scroll effects, and sidebar widgets.
- [ ] **Phase 4: Floating Stickers & Easter Egg System** - Implement signature interactive elements and hidden surprises.
- [ ] **Phase 5: Minigame System & Leaderboard** - Build the arcade experience and competitive social layer.
- [ ] **Phase 6: Polish, Performance & Deployment** - Final optimization pass, performance auditing, and production launch.

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Completed | 2026-02-22 |
| 2. Core Content | 0/0 | Not started | - |
| 3. Interactive Layer | 0/0 | Not started | - |
| 4. Stickers & Eggs | 0/0 | Not started | - |
| 5. Minigames | 0/0 | Not started | - |
| 6. Polish & Deploy | 0/0 | Not started | - |

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: Establish the technical foundation and visual identity.
**Depends on**: Nothing
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-05, DSGN-06
**Success Criteria**:
  1. Site is deployed on a custom domain with basic "coming soon" or skeleton.
  2. Visuals match the warm palette (cream/peach/teal) and responsive breakpoints work on mobile/desktop.
  3. Navigation uses conversational names and successfully routes to placeholder pages.
**Plans**:
- [x] 01-01-PLAN.md — Foundation & Theme Setup (Next.js 15, Tailwind v4, Palette)
- [x] 01-02-PLAN.md — Structural Shell & Conversational Nav
- [x] 01-03-PLAN.md — Core Page Skeletons & Verification

### Phase 2: Core Content Pages
**Goal**: Deliver the primary content-driven pages with real data.
**Depends on**: Phase 1
**Requirements**: ABUT-01, PROJ-01, PROJ-02, PROJ-03, BLOG-01, BLOG-02, BLOG-03, NOW-01, LINK-01, LINK-02
**Success Criteria**:
  1. Visitors can read the full "About" section and browse real projects/blog posts.
  2. Blog posts render correctly from MDX with syntax highlighting.
  3. "Now" page and "Links" section are live with current information.
**Plans**: TBD

### Phase 3: Interactive Layer & Animations
**Goal**: Add personality through micro-animations, scroll effects, and sidebar widgets.
**Depends on**: Phase 2
**Requirements**: ABUT-02, ANIM-01, ANIM-02, ANIM-03, ANIM-04, WIDG-01, WIDG-02
**Success Criteria**:
  1. Pages have smooth entry/exit transitions and sections reveal on scroll.
  2. Sidebar widgets (clock/status) are functional on desktop and behave correctly on mobile.
  3. All animations respect `prefers-reduced-motion` settings.
**Plans**: TBD

### Phase 4: Floating Stickers & Easter Egg System
**Goal**: Implement signature interactive elements and hidden surprises.
**Depends on**: Phase 3
**Requirements**: STKR-01, STKR-02, STKR-03, EGGS-01, EGGS-02, EGGS-03, BLOG-04
**Success Criteria**:
  1. Floating stickers can be dragged across the page and show tooltips on hover.
  2. At least 3 Easter eggs are discoverable and trigger toast notifications or console messages.
  3. Blog subscription form uses a fun, interactive mechanic (not a standard input).
**Plans**: TBD

### Phase 5: Minigame System & Leaderboard
**Goal**: Build the arcade experience and competitive social layer.
**Depends on**: Phase 4
**Requirements**: GAME-01, GAME-02, GAME-03, LEAD-01, LEAD-02, LEAD-03, LEAD-04
**Success Criteria**:
  1. User can play a 30-second minigame and see their score.
  2. Scores can be submitted to a global leaderboard and persist across refreshes.
  3. Leaderboard implements basic anti-cheat validation on the server.
**Plans**: TBD

### Phase 6: Polish, Performance & Deployment
**Goal**: Final optimization pass, performance auditing, and production launch.
**Depends on**: Phase 5
**Requirements**: DSGN-04
**Success Criteria**:
  1. Site achieves Lighthouse scores of 90+ across all categories.
  2. LCP is under 2 seconds on a standard 4G connection.
  3. Site is fully production-ready on the custom domain with OG tags and metadata.
**Plans**: TBD
