# Project Research Summary

**Project:** Kaden Priebe -- Personal Website
**Domain:** Interactive, personality-driven personal portfolio website with minigames
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is an interactive personal portfolio website for a Cornell student, combining traditional portfolio content (about, projects, blog) with personality-driven interactive elements (floating stickers, minigames with leaderboard, Easter eggs, micro-animations). The domain has well-established patterns through Next.js 15 with App Router, but the combination of high interactivity with strong performance requirements creates specific architectural challenges.

The recommended approach is **server-first rendering with client component islands**: build the site as Server Components by default (for fast initial loads and SEO), then layer on carefully isolated interactive Client Components. Use Next.js 15 + React 19 for the framework, Tailwind CSS v4 for the warm aesthetic (cream/peach/soft cyan palette), Motion (Framer Motion) for animations, and Supabase for the leaderboard backend. The architecture prioritizes progressive enhancement: the site should communicate Kaden's personality through content and design even before JavaScript loads.

The primary risks are (1) over-engineering interactivity at the expense of actual content, (2) turning the entire site into a client bundle and destroying performance, and (3) launching a leaderboard vulnerable to score manipulation. These are mitigated by: establishing a content-first milestone gate, creating strict Server/Client component boundaries from day one, and implementing server-side score validation with rate limiting.

## Key Findings

### Recommended Stack

The stack centers on Next.js 15 with App Router as the foundation, providing SSR/SSG, file-based routing, API routes for the leaderboard, and first-class Vercel deployment. React 19 (ships with Next.js 15) brings stable Server Components and Actions. TypeScript is non-negotiable for a project mixing interactive components, game logic, and API routes.

**Core technologies:**
- **Next.js 15 + React 19**: Full-stack framework with App Router for mixing static content pages with interactive features — the project needs both.
- **TypeScript**: Type safety for interactive components, game logic, API routes, and preventing runtime errors.
- **Tailwind CSS v4**: Utility-first CSS with CSS-first configuration via `@theme` directive, perfect for defining the warm color palette (cream, peach, soft cyan) as first-class design tokens.
- **Motion (Framer Motion)**: Declarative animation library for 90% of interactions — hover effects, drag, page transitions, floating stickers with physics.
- **GSAP + ScrollTrigger**: Complex timeline animations and scroll-driven sequences that Motion handles less gracefully (10% of animations).
- **Supabase**: PostgreSQL-backed database with built-in realtime subscriptions for live leaderboard updates, generous free tier, Row Level Security for anti-cheat basics.
- **Vercel**: First-party Next.js hosting with zero-config deployment, automatic preview deploys, edge functions, image optimization CDN.
- **MDX (next-mdx-remote)**: Blog content as Markdown with embedded React components, with frontmatter support via gray-matter.

**Supporting libraries (add when needed):**
- **Radix UI Primitives**: Unstyled accessible components (tooltips, dialogs, popovers) for Easter eggs and interactive UI.
- **Zustand**: Lightweight state management for sticker positions and Easter egg discovery persistence (only when useState/useContext becomes insufficient).
- **HTML5 Canvas API**: Native Canvas for arcade-style minigames (Snake, Breakout) — zero bundle cost, full control.

**Critical version notes:** All version numbers reflect latest known stable releases as of May 2025. Web search was unavailable during research. Verify with `npm view <package> version` before installing. Architecture choices are HIGH confidence; exact version pins are MEDIUM confidence.

### Expected Features

**Must have (table stakes):**
- **Who-you-are section**: First thing visitors want; conversational naming ("who's this guy?") with real photo and personality-forward copy.
- **Projects showcase**: With stubs/placeholders for future work; each needs title, one-liner, visual, link, and tags for filtering.
- **Navigation**: Unconventional is fine (sidebar, floating nav) but must be obvious; mobile hamburger required.
- **Responsive design**: 60%+ of traffic is mobile; floating stickers must not obscure content on small screens.
- **Contact/socials**: Direct links to GitHub, YouTube, LinkedIn, email — no contact form (spam magnet).
- **Fast initial load**: Target <2s LCP; critical for any interactive elements to even matter.
- **Warm visual design**: The "vibe" IS the product — cream/peach/soft teal palette, rounded corners, generous whitespace, friendly typography.
- **Semantic HTML / basic accessibility**: Alt text, semantic headings, skip-to-content, color contrast, keyboard nav, screen reader support.

**Should have (differentiators):**
- **Floating stickers / margin decorations**: Immediately signals "this is different" — draggable or clickable SVG elements in page margins with hover tooltips.
- **Minigames (scattered, discoverable)**: Biggest differentiator — mix of embedded games, hidden/Easter egg games, standalone game pages; keep them SMALL (30-second experiences).
- **Persistent leaderboard**: Transforms minigames from novelty to engagement loop; requires backend (Supabase) with anti-cheat basics.
- **Easter eggs / hidden surprises**: Rewards exploration and creates word-of-mouth; Konami code, hidden pages, hover reveals, console messages for developers.
- **Micro-animations everywhere**: Page transitions, scroll reveals, hover effects — elevates perceived quality; use Motion and respect prefers-reduced-motion.
- **Conversational section naming**: "who's this guy?" instead of "About" — makes navigation itself entertaining.
- **Custom 404 page**: Personality-driven 404 with funny copy or mini-game; low effort, high personality ROI.

**Defer (v2+):**
- **3D WebGL hero scene**: bruno-simon.com already perfected it; attempting as non-specialist means weeks for worse version; tanks mobile performance.
- **User authentication**: Massive scope creep; leaderboard doesn't need it (anonymous nickname + score submission).
- **CMS / admin panel**: Out of scope per PROJECT.md; markdown in repo is sufficient for personal site.
- **Comment system**: Moderation burden, spam, low engagement on personal blogs.
- **Real-time multiplayer**: WebSockets, state sync, matchmaking — startup-level engineering; async competition via leaderboard is sufficient.
- **Dark mode toggle**: Warm palette IS the brand; dark mode means designing twice and dilutes aesthetic.

### Architecture Approach

The recommended architecture is **server-first rendering with client component islands**. Next.js App Router defaults all components to Server Components. Interactive elements (animations, drag, games, state) are isolated in Client Components marked with `'use client'`. This keeps the JS bundle small while enabling rich interactivity where needed. The core principle: a personal website is primarily content (about, projects, blog) which renders faster and SEO-indexes better as Server Components. Interactive elements are layered on top without bloating initial page load.

**Major components:**

1. **Shell (Server)**: RootLayout handles HTML structure, metadata, fonts, global CSS. Navigation and Footer are static server-rendered components.

2. **Interactive Overlay (Client)**: A persistent client-side layer (`InteractiveLayer`) sits on top of all page content, managing global interactive elements that persist across navigations — `FloatingStickers`, `EasterEggManager`, `CursorEffects`, `ToastNotifications`.

3. **Page Content (Mixed)**: Each page is a Server Component by default with Client Component islands for interactive sections. `HeroSection` (animated intro), `ProjectCard` (hover effects), `MinigameEmbed` (lazy-loaded), `LeaderboardDisplay` (API fetch), `SidebarWidgets` — all Client. `AboutSection`, `BlogPostContent` (MDX) — Server.

4. **Minigame System (Client)**: Each minigame is fully client-side, lazy-loaded via `next/dynamic` with `{ ssr: false }` to avoid impacting main bundle. Common wrapper (`MinigameShell`) handles score display, submission, instructions. Games use Canvas API (arcade games) or React components (puzzle games).

5. **API Routes (Server)**: Next.js Route Handlers in `app/api/` provide backend. `/api/leaderboard` (GET scores, POST new score with rate limiting + validation), `/api/easter-eggs` (POST discovery logging).

**Data flow:**
- **Content**: MDX files compiled at build time, rendered as Server Components, zero client JS for content.
- **Interactive state**: Zustand stores with localStorage persistence for sticker positions, Easter egg discoveries, user nickname.
- **Leaderboard**: Client POSTs score to `/api/leaderboard`, Route Handler validates with Zod, rate limits, inserts to Supabase, client GETs updated rankings.
- **Easter eggs**: Client-first (reward shows instantly from local state), optional server logging for analytics.

**Key patterns:**
- Client island in Server page (Pattern 1)
- Lazy-loaded minigames via `next/dynamic` (Pattern 2)
- Zustand + localStorage for client-side persistence (Pattern 3)
- MDX blog with exported metadata (Pattern 4)
- Route Handler API with Zod validation (Pattern 5)

### Critical Pitfalls

1. **The "Use Client" Avalanche** — Slapping `'use client'` on page-level components turns the entire site into a client bundle, destroying initial load time and LCP. Prevention: Default to Server Components, create small leaf-level Client Components, use `server-only` package for DB/API logic.

2. **Leaderboard Score Manipulation** — Client-side game scores are untrustworthy; anyone can open DevTools and submit fake scores. Prevention: Server-side validation (max score ceilings per game), rate limiting (one submission per session), game session tokens (signed JWT issued on game start, validated on submission).

3. **Animation Performance Death by a Thousand Cuts** — Each animation seems lightweight alone, but combined they trigger constant layout recalcs and paint operations, causing stuttering and battery drain. Prevention: Only animate `transform` and `opacity` (GPU-composited), use Motion's layout system, budget 5-8 concurrent animations max, test on throttled CPU.

4. **Mobile Responsiveness Nightmare with Floating Elements** — Floating stickers and absolute-positioned elements look great on desktop but overlap content, extend beyond viewport, or become too small to tap on mobile. Prevention: Design mobile-first, use CSS `clamp()` for positions, hide/reposition decorative elements on mobile, convert hover Easter eggs to tap/long-press on touch.

5. **Over-Engineering the Fun, Under-Delivering the Content** — Weeks spent on particle systems and elaborate Easter eggs while "About" section still says "Coming soon" and projects page has placeholder text. Prevention: Content-first milestone gate (core pages must have real content before building interactive features), 60/40 time ratio (content vs. interactivity).

## Implications for Roadmap

Based on research, suggested phase structure (6 phases):

### Phase 1: Foundation & Design System
**Rationale:** Everything builds on this. Server/Client architecture patterns, warm color palette, responsive layout, and animation infrastructure must be established first. Getting component boundaries wrong here forces painful refactoring later.

**Delivers:**
- Next.js 15 project with App Router, TypeScript, Tailwind CSS v4
- Root layout + global styles (warm palette: cream, peach, soft cyan)
- Navigation + footer with conversational naming
- Responsive layout system with mobile-first breakpoints
- Basic page routes (home, about, projects, blog, links)
- Motion integration with `prefers-reduced-motion` support
- UI component library (button, card, section-heading, animated-text)

**Addresses (from FEATURES.md):**
- Warm visual design (table stakes)
- Responsive design (table stakes)
- Navigation (table stakes)
- Semantic HTML / accessibility basics (table stakes)

**Avoids (from PITFALLS.md):**
- "Use Client" avalanche (Pitfall 1): Establish Server/Client boundary patterns from day one
- Animation performance (Pitfall 3): Set up animation utilities using only transform/opacity, create performance budget
- Mobile responsiveness (Pitfall 4): Design mobile-first, define floating element behavior per breakpoint

**Research flag:** Standard patterns — skip research. Next.js setup, Tailwind config, responsive design are well-documented.

---

### Phase 2: Core Content Pages
**Rationale:** Content comes before interactivity. The site must communicate who Kaden is and what he's built even with JavaScript disabled. This phase delivers the minimum viable portfolio that can be shared.

**Delivers:**
- "Who's this guy?" about section with real content, photo, personality-forward copy
- Projects showcase with real projects (or high-quality stubs with "coming soon" markers)
- Contact/socials page with direct links
- MDX blog system setup (next-mdx-remote + gray-matter)
- 1-2 real blog posts (empty blog is worse than no blog)
- Custom 404 page with personality

**Addresses (from FEATURES.md):**
- Who-you-are section (table stakes)
- Projects showcase (table stakes)
- Contact/socials (table stakes)
- Blog/writing section (table stakes)
- Custom 404 page (differentiator, low effort)

**Avoids (from PITFALLS.md):**
- Over-engineering fun (Pitfall 7): Content-first milestone gate ensures this is built before interactive flourishes
- Blog complexity creep (Pitfall 9): Start with plain MDX, add features only when needed by actual content

**Research flag:** Standard patterns — skip research. MDX blogs in Next.js are well-established.

---

### Phase 3: Interactive Layer & Animations
**Rationale:** With content in place, layer on the interactive personality. This phase adds the "wow" factor without sacrificing the foundation. Page transitions, scroll reveals, and hover effects elevate perceived quality.

**Delivers:**
- Page transition animations
- Scroll-triggered reveals using Intersection Observer
- Hover effects on project cards
- Animated section headings and decorative elements
- Sidebar widgets (mini-clock, random fact, "currently" status)
- Cursor effects or custom cursor (optional)

**Addresses (from FEATURES.md):**
- Micro-animations everywhere (differentiator)
- Interactive sidebar widgets (differentiator)

**Avoids (from PITFALLS.md):**
- Animation performance (Pitfall 3): Enforce transform/opacity-only rule, test on throttled CPU
- Accessibility (Pitfall 5): Implement `prefers-reduced-motion`, ensure keyboard accessibility
- Hydration mismatches (Pitfall 6): Use `useEffect` for dynamic content

**Research flag:** Standard patterns — skip research. Motion and scroll animations are well-documented. Ensure performance testing is part of phase verification.

---

### Phase 4: Floating Stickers & Easter Egg System
**Rationale:** Floating stickers are the immediate "this is different" signal. Easter eggs reward exploration and create word-of-mouth. Both depend on the interactive infrastructure from Phase 3 and real content from Phase 2 (Easter eggs need sections to hide within).

**Delivers:**
- FloatingStickers component with drag physics (Motion drag API)
- Zustand store for sticker position persistence (localStorage)
- 3-5 initial stickers with personality (hover tooltips, draggable)
- EasterEggManager with trigger system (Konami code, click sequences, hover reveals)
- Toast notification system for discoveries
- 2-3 easy-to-find Easter eggs + 1-2 harder ones
- Console messages for developers who inspect

**Addresses (from FEATURES.md):**
- Floating stickers / margin decorations (differentiator, high impact)
- Easter eggs / hidden surprises (differentiator)

**Avoids (from PITFALLS.md):**
- Mobile responsiveness (Pitfall 4): Hide or reposition stickers on mobile, convert hover Easter eggs to tap/long-press
- Hydration mismatches (Pitfall 6): Use `useEffect` for random sticker positioning
- Accessibility (Pitfall 5): Add `aria-hidden` to decorative elements, ensure Easter eggs have keyboard fallbacks
- Easter eggs nobody finds (Pitfall 10): Layer difficulty, add breadcrumbs, keep at least one easy to find

**Research flag:** Standard patterns — skip research. Motion drag and localStorage patterns are well-documented. Focus on mobile adaptation.

---

### Phase 5: Minigame System & Leaderboard
**Rationale:** Minigames are the biggest differentiator but also the highest complexity (Canvas rendering, game logic, backend API, anti-cheat). This phase is self-contained and can be built in parallel with Phase 4. Starting with one simple game validates the architecture before building more.

**Delivers:**
- Supabase setup + schema (scores table with RLS)
- Leaderboard API routes (`/api/leaderboard` GET + POST with Zod validation, rate limiting)
- MinigameShell component (common wrapper for all games)
- LeaderboardPanel (top 10 scores display)
- ScoreSubmitForm (nickname + score submission)
- First minigame (suggestion: Snake or Memory game — simple, recognizable, achievable)
- Game session token system for score validation

**Addresses (from FEATURES.md):**
- Minigames (differentiator, highest impact)
- Persistent leaderboard (differentiator, engagement loop)

**Avoids (from PITFALLS.md):**
- Score manipulation (Pitfall 2): Server-side validation, rate limiting, session tokens
- API spam (Pitfall 8): Rate limiting, input sanitization, RLS, CORS, cleanup jobs
- Canvas/WebGL SSR crashes (Pitfall 11): Always use `next/dynamic` with `{ ssr: false }`, provide loading placeholders
- Env var mismanagement (Pitfall 12): Strict `NEXT_PUBLIC_` prefix discipline, `server-only` imports

**Research flag:** NEEDS RESEARCH for game-specific implementation. Standard patterns exist for Next.js API routes and Supabase, but specific game logic and anti-cheat strategies will benefit from targeted research when planning this phase. Use `/gsd:research-phase` for game architecture and score validation patterns.

---

### Phase 6: Polish, Performance, & Deploy
**Rationale:** Final optimization pass before launch. This phase ensures the site meets performance budgets, SEO is optimized, accessibility passes audit, and deployment is production-ready. Additional minigames and enhancements can be added post-launch.

**Delivers:**
- Lighthouse audit (target: Performance 90+, Accessibility 90+, SEO 95+, Best Practices 95+)
- Core Web Vitals optimization (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- SEO metadata + Open Graph images (next/og for dynamic OG images)
- Accessibility audit and fixes (screen reader testing, keyboard nav, color contrast)
- Custom domain setup + DNS configuration
- Vercel deployment with environment variables
- Vercel Analytics integration
- Additional minigames (2-3 more simple games)

**Addresses (from FEATURES.md):**
- Fast initial load (table stakes, performance budget)
- Custom domain (constraint from PROJECT.md)

**Avoids (from PITFALLS.md):**
- Core Web Vitals ignored (Pitfall 13): Run Lighthouse before deployment, use `next/image` and `next/font`, monitor with Vercel Analytics
- Animation performance (Pitfall 3): Final performance audit ensures no regressions

**Research flag:** Standard patterns — skip research. Vercel deployment, Lighthouse optimization, and Next.js SEO are well-documented.

---

### Phase Ordering Rationale

- **Phase 1 first (Foundation)**: Must establish Server/Client boundaries, color palette, responsive system, and animation infrastructure before anything else. Every subsequent phase depends on this.

- **Phase 2 second (Content)**: Content before interactivity prevents over-engineering trap. Real content must exist before adding flourishes.

- **Phase 3 third (Animations)**: Interactive layer needs both foundation (Phase 1 architecture) and content (Phase 2 pages to animate). Page transitions and scroll reveals only make sense with actual pages.

- **Phase 4 and 5 parallel**: Floating stickers/Easter eggs (Phase 4) and Minigames/Leaderboard (Phase 5) can be built simultaneously because they share only the animation infrastructure from Phase 3 but don't depend on each other. The minigame system needs API routes but not the sticker system, and vice versa.

- **Phase 6 last (Polish)**: Can only optimize what exists. Performance audit, SEO, and deployment are final steps after all features are built.

**Dependency chain:**
```
Phase 1 (Foundation)
    |
    v
Phase 2 (Content) ----+
    |                 |
    v                 |
Phase 3 (Interactive)-+
    |                 |
    +--------+--------+
    |        |
    v        v
Phase 4   Phase 5 (parallel)
(Stickers) (Games)
    |        |
    +---+----+
        |
        v
    Phase 6
   (Polish)
```

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Minigames & Leaderboard)**: Game architecture, Canvas rendering patterns, anti-cheat strategies, score validation. Use `/gsd:research-phase` for game-specific research when planning this phase.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Next.js setup, Tailwind config, responsive design — well-documented.
- **Phase 2 (Content)**: MDX blogs, static content — well-documented.
- **Phase 3 (Animations)**: Motion animations, scroll triggers — well-documented.
- **Phase 4 (Stickers & Easter Eggs)**: Motion drag, localStorage, Zustand — well-documented.
- **Phase 6 (Polish & Deploy)**: Lighthouse, Vercel deployment, SEO — well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Motion, Supabase, Vercel — all verified against official docs. Version numbers are MEDIUM (May 2025 training data, verify before install). |
| Features | MEDIUM-HIGH | Feature categories based on established personal website patterns (HIGH). Reference site details (mehai.dev, wyattsell.com, aliabdaal.com, llee Cornell page) from training data (MEDIUM — sites may have changed). |
| Architecture | HIGH | Next.js App Router patterns, Server/Client composition, API routes, MDX integration — all verified against Next.js 16.x official documentation. |
| Pitfalls | HIGH | Critical pitfalls (Use Client avalanche, score manipulation, animation performance, mobile responsiveness) based on Next.js docs, web.dev performance standards, and fundamental security patterns. |

**Overall confidence:** MEDIUM-HIGH

Stack and architecture choices are HIGH confidence (official docs verified). Feature landscape is MEDIUM-HIGH (established patterns but reference sites not re-verified). Pitfalls are HIGH confidence (fundamental to domain). Exact version numbers and reference site current states need verification.

### Gaps to Address

**Version verification (MEDIUM priority):**
- All package versions reflect May 2025 training data. Before `npm install`, verify: Next.js version, Motion package name (rebrand from Framer Motion), Tailwind CSS v4 availability, Supabase client version. Run `npm view <package> version` for each.

**Reference site validation (LOW priority):**
- Reference sites (mehai.dev, wyattsell.com, aliabdaal.com, llee Cornell page) may have redesigned since training data. Spot-check visually to confirm floating sticker patterns and aesthetic inspiration are still relevant. Feature categories remain valid regardless.

**Anti-cheat refinement (address during Phase 5 planning):**
- Leaderboard score validation strategies are HIGH confidence at conceptual level (session tokens, rate limiting, server-side ceilings). Specific implementation details (JWT structure, rate limit thresholds, game-specific score ceilings) will need refinement during Phase 5 planning. Use `/gsd:research-phase` for game-specific anti-cheat patterns.

**Performance budget baselines (address during Phase 1):**
- Performance targets are well-established (LCP < 2.5s, CLS < 0.1, INP < 200ms, bundle < 150KB gzipped). Actual achievable baselines for this specific stack + interactive elements should be measured during Phase 1 foundation and adjusted if needed.

**Mobile sticker adaptation (address during Phase 4):**
- Strategy is clear (hide/reposition/drawer on mobile), but exact breakpoints and sticker behavior patterns will need design exploration during Phase 4 planning. No additional research needed — this is a design decision.

## Sources

### Primary (HIGH confidence)
- Next.js 16.x Official Documentation — App Router, routing, Server/Client Components, API routes, MDX, project structure, environment variables, lazy loading/dynamic imports (verified 2026-02-22)
- PROJECT.md requirements — project scope, constraints, reference sites, out-of-scope items
- STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md — synthesized research outputs from parallel researchers

### Secondary (MEDIUM confidence)
- Motion (Framer Motion) — animation library patterns from training data (verify package name and import paths)
- Supabase — serverless PostgreSQL with realtime subscriptions from training data (verify free tier limits)
- Tailwind CSS v4 — CSS-first configuration patterns from training data (verify v4 release and `@theme` syntax)
- Reference site details (mehai.dev, wyattsell.com, aliabdaal.com, llee Cornell page) — from training data through May 2025

### Tertiary (MEDIUM-LOW confidence)
- Exact package versions — based on May 2025 training data; verify with npm registry before installing
- Design token values (specific hex colors, font choices) — subjective, need visual validation
- Font availability (Plus Jakarta Sans, Quicksand) — verify availability via next/font/google

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
