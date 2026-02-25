# Requirements: Kaden Priebe Personal Website

**Defined:** 2026-02-22
**Core Value:** When someone lands on the site, they should think "this person is fun" — personality-first, memorable, and genuinely enjoyable to explore.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Design & Foundation

- [ ] **DSGN-01**: Site uses a minimalist light palette (white background, black/dark-gray text) with clean typography, generous whitespace, and high readability, inspired by Lillian Lee and wyattsell.com
- [ ] **DSGN-02**: Site is fully responsive — all content and interactive elements work on mobile, tablet, and desktop
- [ ] **DSGN-03**: Navigation uses fun, conversational names (e.g., "who's this guy?" instead of "About") while remaining intuitive
- [ ] **DSGN-04**: Site loads with LCP under 2 seconds — static content renders first, interactive elements hydrate progressively
- [ ] **DSGN-05**: Site meets basic accessibility standards — semantic HTML, alt text, keyboard navigation, sufficient color contrast, prefers-reduced-motion support
- [ ] **DSGN-06**: Site is deployed on a custom domain

### Content — About

- [ ] **ABUT-01**: User can read a personality-forward "about" section with real photo and conversational writing voice
- [ ] **ABUT-02**: About section reveals content with scroll-triggered animations (not a wall of text)

### Content — Projects

- [ ] **PROJ-01**: User can browse a showcase of projects with title, one-liner description, visual (screenshot or icon), and link
- [ ] **PROJ-02**: Projects include stubs/placeholders for future work that signal ambition without looking empty
- [ ] **PROJ-03**: Projects can be tagged by category (research, creative, code, ML/AI) for browsing

### Content — Blog

- [ ] **BLOG-01**: User can read blog posts rendered from MDX with code syntax highlighting and readable typography
- [ ] **BLOG-02**: Blog listing page shows posts with title, date, and preview
- [ ] **BLOG-03**: Blog posts support embedded React components via MDX
- [ ] **BLOG-04**: User can subscribe to the blog via a fun, interactive email signup (e.g., scratch-off reveal, slot machine, treasure chest opening — not a boring input box)

### Content — Now Page

- [ ] **NOW-01**: User can visit a "now" page showing what Kaden is currently doing, reading, building, and studying

### Content — Contact & Socials

- [ ] **LINK-01**: User can find and click links to GitHub, YouTube, LinkedIn, email, and other platforms
- [ ] **LINK-02**: Links section has personality (not just a row of icons)

### Interactive — Floating Stickers

- [ ] **STKR-01**: Decorative stickers/icons float in page margins, clickable with tooltips on hover
- [ ] **STKR-02**: Stickers are draggable with physics-based feel (Motion drag)
- [ ] **STKR-03**: Stickers adapt on mobile — repositioned or collapsed into a discoverable tray (not obscuring content)

### Interactive — Micro-Animations

- [ ] **ANIM-01**: Pages have smooth entry/exit transitions
- [ ] **ANIM-02**: Content sections reveal with scroll-triggered animations
- [ ] **ANIM-03**: Cards and interactive elements respond to hover with delightful effects
- [ ] **ANIM-04**: Animations respect prefers-reduced-motion and don't cause jank on mobile

### Interactive — Sidebar Widgets

- [ ] **WIDG-01**: Desktop layout includes a sidebar area with 1-2 interactive widgets (e.g., quote rotator, status indicator, mini doodle pad)
- [ ] **WIDG-02**: Sidebar widgets collapse or relocate on mobile without breaking layout

### Interactive — Easter Eggs

- [ ] **EGGS-01**: Site contains at least 3 hidden Easter eggs discoverable through exploration (Konami code, click sequences, hidden pages)
- [ ] **EGGS-02**: Developers who inspect the console find fun messages
- [ ] **EGGS-03**: Easter eggs are discoverable enough that at least some visitors find them organically

### Games — Minigame

- [ ] **GAME-01**: User can play at least one 30-second micro-game embedded in the site
- [ ] **GAME-02**: Game has clear instructions, start/end states, and a score
- [ ] **GAME-03**: Game is fun and thematically connected to the site's personality

### Games — Leaderboard

- [ ] **LEAD-01**: User can submit a score with their name after playing a minigame (name persists via cookie so returning visitors are recognized)
- [ ] **LEAD-02**: User can view a global leaderboard showing top scores
- [ ] **LEAD-03**: Leaderboard persists across sessions (real Supabase backend)
- [ ] **LEAD-04**: Leaderboard has basic anti-cheat (server-side score validation, rate limiting)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Additional Games

- **GAME-10**: Multiple minigames (3+) with different mechanics
- **GAME-11**: Easter egg games hidden within the site
- **GAME-12**: Game of the month/week rotation

### Enhanced Interactive

- **INTX-01**: Custom 404 page with mini-game or personality touch
- **INTX-02**: Scroll-driven storytelling with parallax in about section
- **INTX-03**: Dynamic/generative visual elements that change each visit
- **INTX-04**: Spotify now-playing widget in sidebar (API integration)

### Content Expansion

- **CONT-01**: RSS feed for blog
- **CONT-02**: Reading time estimates on blog posts
- **CONT-03**: Project filtering and search

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D WebGL hero scene | Weeks of work for a worse bruno-simon.com. Tanks mobile performance. |
| User authentication / accounts | Massive scope creep — leaderboard uses name entry with cookie persistence instead |
| CMS / admin panel | Personal site with infrequent updates — markdown files in repo suffice |
| Comment system on blog | Moderation burden, spam, low engagement — link to socials instead |
| Complex multi-page games | A full game is a separate project — keep games to 30-second micro-experiences |
| Real-time multiplayer | WebSockets, state sync, matchmaking is startup-level engineering |
| Dark mode toggle | Warm palette IS the brand — designing twice dilutes the aesthetic |
| Infinite scroll / content feed | Not a social platform — distinct pages preserve the spatial metaphor |
| Auto-playing audio/video | Universally despised, causes immediate bounce |
| Analytics dashboard (visible) | Vanity metric — use analytics privately (Vercel Analytics) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| **DSGN-01** | Phase 1 | Pending |
| **DSGN-02** | Phase 1 | Pending |
| **DSGN-03** | Phase 1 | Pending |
| **DSGN-04** | Phase 6 | Pending |
| **DSGN-05** | Phase 1 | Pending |
| **DSGN-06** | Phase 1 | Pending |
| **ABUT-01** | Phase 2 | Pending |
| **ABUT-02** | Phase 3 | Pending |
| **PROJ-01** | Phase 2 | Pending |
| **PROJ-02** | Phase 2 | Pending |
| **PROJ-03** | Phase 2 | Pending |
| **BLOG-01** | Phase 2 | Pending |
| **BLOG-02** | Phase 2 | Pending |
| **BLOG-03** | Phase 2 | Pending |
| **BLOG-04** | Phase 4 | Pending |
| **NOW-01** | Phase 2 | Pending |
| **LINK-01** | Phase 2 | Pending |
| **LINK-02** | Phase 2 | Pending |
| **STKR-01** | Phase 4 | Pending |
| **STKR-02** | Phase 4 | Pending |
| **STKR-03** | Phase 4 | Pending |
| **ANIM-01** | Phase 3 | Pending |
| **ANIM-02** | Phase 3 | Pending |
| **ANIM-03** | Phase 3 | Pending |
| **ANIM-04** | Phase 3 | Pending |
| **WIDG-01** | Phase 3 | Pending |
| **WIDG-02** | Phase 3 | Pending |
| **EGGS-01** | Phase 4 | Pending |
| **EGGS-02** | Phase 4 | Pending |
| **EGGS-03** | Phase 4 | Pending |
| **GAME-01** | Phase 5 | Pending |
| **GAME-02** | Phase 5 | Pending |
| **GAME-03** | Phase 5 | Pending |
| **LEAD-01** | Phase 5 | Pending |
| **LEAD-02** | Phase 5 | Pending |
| **LEAD-03** | Phase 5 | Pending |
| **LEAD-04** | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation*
