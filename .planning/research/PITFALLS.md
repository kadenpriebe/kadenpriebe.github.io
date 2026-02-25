# Domain Pitfalls

**Domain:** Interactive personal website (personality-driven portfolio with minigames, leaderboard, animations, Easter eggs)
**Researched:** 2026-02-22

---

## Critical Pitfalls

Mistakes that cause rewrites, major performance problems, or security incidents.

---

### Pitfall 1: The "Use Client" Avalanche — Turning Your Entire Site Into a Client Bundle

**What goes wrong:** Because the site is interaction-heavy (floating stickers, hover effects, minigames, animations), developers slap `'use client'` on page-level components or high-level layouts. In Next.js App Router, `'use client'` marks a boundary: everything imported below it becomes part of the client bundle. The result is a site that ships hundreds of KB of JavaScript that never needed to run on the client, destroying initial load time and LCP scores.

**Why it happens:** Interactive personal sites feel like "everything is interactive," so the instinct is to make everything a Client Component. Developers don't realize that a page with 80% static content and 20% interactive elements should still be a Server Component that *composes* small Client Components — not a Client Component that renders everything.

**Consequences:**
- Bundle sizes 3-5x larger than necessary
- Slow Time to Interactive (TTI) on mobile, especially on throttled connections
- SEO impact: content not available until JS hydrates
- Hydration mismatches from SSR-rendered content not matching client state

**Prevention:**
- Default to Server Components for all pages and layouts
- Create small, leaf-level Client Components: `<FloatingSticker />`, `<HoverCard />`, `<MinigameEmbed />`, `<LeaderboardWidget />`
- Use the interleaving pattern from Next.js docs: Server Component parent passes `children` to Client Component wrappers
- Use `next/dynamic` with `{ ssr: false }` for minigames and heavy canvas elements that genuinely cannot render on the server
- Install `server-only` package and import it in any module with DB/API logic to get build-time errors if accidentally pulled into client code

**Detection (warning signs):**
- Client bundle exceeds 150KB (gzipped) on initial page load
- `next build` output shows large "First Load JS" numbers for pages
- Lighthouse Performance score drops below 80
- Pages flash/flicker on load (hydration mismatch)

**Phase relevance:** Foundation phase (Phase 1). Get the Server/Client boundary architecture right from day one. Retrofitting is painful.

**Confidence:** HIGH (verified against Next.js 16.x official documentation)

---

### Pitfall 2: Leaderboard Score Manipulation — Client-Side Trust

**What goes wrong:** The minigame runs entirely on the client. When the game ends, the client sends `{ name: "Kaden", score: 99999 }` to an API endpoint. There is nothing stopping someone from opening DevTools, inspecting the network request, and submitting any score they want. Within hours of deployment, the leaderboard is filled with impossibly high scores.

**Why it happens:** Developers treat the leaderboard like a form submission — trust the client input, store it in the database. They don't realize that any client-side game score is inherently untrustworthy. This is the #1 issue with browser-based game leaderboards.

**Consequences:**
- Leaderboard becomes meaningless (filled with fake scores)
- Legitimate players stop engaging
- If the site goes viral (portfolio sites can), the problem scales fast
- Rebuilding trust in the leaderboard requires a full reset

**Prevention (layered defense):**
1. **Server-side validation:** Define maximum possible scores per game. A Flappy Bird clone where score = pipes passed cannot exceed, say, 500 in a 3-minute session. Reject scores above the ceiling.
2. **Rate limiting:** One score submission per game session. Use a session token issued when the game starts, consumed on submission.
3. **Game session tokens:** When the player starts a game, the server issues a signed, time-limited JWT. On score submission, validate the token and check that enough time has elapsed for the claimed score. A score of 200 submitted 2 seconds after game start is invalid.
4. **Replay validation (optional, advanced):** Record game inputs and replay them server-side. Only feasible for deterministic games. Likely overkill for a personal site.
5. **Soft moderation:** Display a "recent scores" view alongside "all-time best." If someone cheats the all-time board, recent scores still show legitimate play.

**Detection (warning signs):**
- Scores appearing that are mathematically impossible for the game design
- Multiple max-int-value scores from different "users"
- Score submissions with no corresponding game session token

**Phase relevance:** Leaderboard/backend phase. Must be designed into the API from the start, not bolted on after the leaderboard is already public.

**Confidence:** HIGH (well-documented pattern in web game development; no external source needed for this — it's fundamental security)

---

### Pitfall 3: Animation Performance Death by a Thousand Cuts

**What goes wrong:** Each interactive element seems lightweight on its own — a floating sticker here, a hover effect there, a parallax scroll, a particle background. But combined, they trigger constant layout recalculations and paint operations. The page stutters on scroll, animations jank, and the CPU fan spins up on every page.

**Why it happens:** Developers test individual animations in isolation during development, on a fast MacBook. They never test 15 animations running simultaneously on a mid-range Android phone. CSS animations on `top`, `left`, `width`, or `height` trigger layout, which is catastrophically expensive when many elements animate at once.

**Consequences:**
- 10-15 FPS on mobile devices (should be 60 FPS)
- Battery drain on mobile
- Visitors leave because the site feels "heavy" or "laggy"
- Ironic outcome: the fun interactive elements make the site less fun to use

**Prevention:**
- **Only animate `transform` and `opacity`** — these are the only properties that can be GPU-composited without triggering layout or paint. Never animate `top`, `left`, `width`, `height`, `margin`, `padding`.
- **Use `will-change: transform`** sparingly on elements that will animate, to promote them to their own compositor layer. But don't blanket-apply it — too many layers exhausts GPU memory.
- **Use Framer Motion (Motion)** with its `layout` animation system, which uses `transform` under the hood. Avoid raw CSS transitions on layout-triggering properties.
- **Budget your animations:** No more than 5-8 concurrently visible animated elements per viewport. Use Intersection Observer to pause off-screen animations.
- **Test on a throttled CPU:** Chrome DevTools > Performance > CPU throttling 4x. If it's not smooth there, it won't be smooth on a real phone.
- **Prefer CSS animations over JS** for simple effects (hover glow, fade-in). CSS animations can be optimized by the browser's compositor thread and don't block the main thread.
- **Use `requestAnimationFrame` or Framer Motion** for JS-driven animations. Never use `setInterval`/`setTimeout` for animation.

**Detection (warning signs):**
- Chrome DevTools Performance tab shows "Layout" blocks exceeding 10ms
- FPS counter drops below 30 during scroll or interaction
- Mobile users reporting battery drain or heat
- Lighthouse "Avoid large layout shifts" warnings

**Phase relevance:** Every phase that adds interactive elements. Establish animation patterns and performance budgets in Phase 1; enforce them throughout.

**Confidence:** HIGH (fundamental browser rendering knowledge, confirmed by web.dev performance documentation patterns)

---

### Pitfall 4: Mobile Responsiveness Nightmare with Floating/Absolute Elements

**What goes wrong:** Floating stickers, sidebar widgets, and absolutely-positioned Easter egg triggers look great on a 1440px desktop viewport. On a 375px phone screen, they overlap content, extend beyond viewport bounds causing horizontal scroll, cover navigation, or become too small to tap (violating touch target guidelines). The site that felt "fun" on desktop feels "broken" on mobile.

**Why it happens:** Floating elements and stickers are designed in desktop-first thinking. Absolute positioning and fixed elements don't participate in normal document flow, so they don't naturally reflow on smaller screens. The developer adds a few `@media` queries and calls it done, but the combinatorial explosion of screen sizes, orientations, and element positions creates edge cases everywhere.

**Consequences:**
- Horizontal scrollbar on mobile (content wider than viewport)
- Stickers covering text or CTAs
- Touch targets smaller than 44x44px (Apple HIG) / 48x48px (Material)
- Easter eggs impossible to discover on mobile (hover-dependent)
- 50%+ of portfolio traffic is mobile — half your audience sees a broken site

**Prevention:**
- **Design mobile-first, enhance for desktop.** Start with a clean mobile layout. Add floating elements only for screens above 768px (or use a progressive enhancement approach).
- **Use CSS `clamp()` and viewport units** instead of fixed pixel positions for floating elements.
- **Hide or reposition decorative elements on mobile.** Floating stickers can become a scrollable tray or a drawer instead of scattered absolute-positioned elements.
- **Convert hover Easter eggs to tap/long-press on touch devices.** Use `@media (hover: hover)` to detect hover capability.
- **Test with real devices** or at minimum Chrome DevTools device emulation at 375px, 390px, and 414px widths.
- **Set `overflow-x: hidden` on body** as a safety net, but fix the root cause (elements exceeding viewport width).

**Detection (warning signs):**
- Horizontal scroll appears on any mobile viewport
- Elements overlapping text when browser is resized
- Lighthouse "Tap targets are not sized appropriately" warning
- Any hover-only interaction with no touch fallback

**Phase relevance:** Design system / foundation phase. Establish mobile breakpoint strategy and floating element rules before building features.

**Confidence:** HIGH (universal responsive design knowledge, specific to this project's floating sticker/sidebar requirements from PROJECT.md)

---

## Moderate Pitfalls

---

### Pitfall 5: Accessibility Theater — "Fun" That Excludes

**What goes wrong:** The site's personality relies heavily on visual and interactive elements: floating stickers, animations, color-coded sections, hover-triggered Easter eggs. Users with motion sensitivity (vestibular disorders), screen reader users, keyboard-only users, and color-blind users get a degraded or broken experience. The site feels exclusive rather than inclusive.

**Prevention:**
- **Respect `prefers-reduced-motion`:** Wrap all animations in a media query check. Framer Motion supports this natively with `useReducedMotion()`. When reduced motion is preferred, replace animations with instant state changes or gentle opacity fades.
- **Ensure all interactive elements are keyboard-accessible:** Every clickable sticker, every game, every Easter egg must be reachable via Tab and activatable via Enter/Space. Use semantic HTML (`<button>`, `<a>`) not `<div onClick>`.
- **Add meaningful alt text and ARIA labels:** Floating stickers need `aria-label`. Decorative elements need `aria-hidden="true"`. Games need instructions that screen readers can access.
- **Don't rely on color alone:** Section differentiation should use shape, iconography, or labels in addition to color.
- **Make minigames keyboard-playable** or provide an alternative experience.

**Detection:**
- Run axe DevTools or Lighthouse Accessibility audit — score should be 90+
- Navigate entire site using only keyboard (Tab, Enter, Escape)
- Enable `prefers-reduced-motion` in OS settings and verify the site is still usable
- Test with VoiceOver (macOS) or NVDA (Windows)

**Phase relevance:** Every phase. Bake accessibility into component contracts from Phase 1. Much harder to retrofit than to build correctly.

**Confidence:** HIGH (WCAG 2.1 guidelines are well-established; `prefers-reduced-motion` is a solved pattern)

---

### Pitfall 6: Hydration Mismatch Hell with Dynamic/Random Content

**What goes wrong:** The site uses random sticker positions, random Easter egg locations, or time-dependent greetings ("Good morning!"). The server renders one version, the client hydrates with different random values or a different time. React throws hydration mismatch warnings, and the UI flickers as the client "corrects" the server-rendered HTML.

**Prevention:**
- **Defer random/dynamic content to the client only:** Use `useEffect` for random positioning so it only runs after hydration. Server renders a stable default; client enhances.
- **Use `next/dynamic` with `{ ssr: false }`** for components that inherently depend on client-side randomness (sticker scattering, particle effects).
- **Seed random generators with deterministic values on the server** if you need SSR. Use a date-based seed so the same "random" layout renders for the same request.
- **For time-dependent content:** Render a neutral default on the server ("Hey there!"), then update to time-specific greeting in `useEffect`.
- **Use `suppressHydrationWarning`** only as a last resort on specific elements (e.g., timestamp displays), never globally.

**Detection:**
- Console warnings: "Text content did not match" or "Hydration failed"
- Flash of incorrect content on page load
- Elements jumping positions after initial render

**Phase relevance:** Foundation phase when setting up sticker system and dynamic elements.

**Confidence:** HIGH (verified against Next.js documentation on SSR/hydration behavior)

---

### Pitfall 7: Over-Engineering the Fun, Under-Delivering the Content

**What goes wrong:** Weeks are spent building a particle system, a physics-based sticker interaction, a custom WebGL background, and an elaborate Easter egg hunt — meanwhile the "About" section still says "Coming soon," the projects page has placeholder text, and there's no blog content. Visitors are briefly amused by the effects but leave without learning anything about Kaden because there's nothing to learn.

**Prevention:**
- **Content-first milestone gate:** Before building any minigame or Easter egg, the core content pages (About, Projects, Blog with at least one post) must have real, written content deployed.
- **Budget the ratio:** 60% of development time on content, structure, and core UX. 40% on interactive flourishes. Not the reverse.
- **Define "personality" through writing first, interactions second.** The casual section names, the conversational tone, the authentic voice — these are free and infinitely more impactful than a particle effect.
- **Ship an MVP that's a great static site, then layer interactivity.** If someone visits with JS disabled or on a slow connection, the site should still communicate who Kaden is.

**Detection:**
- Any page that has interactive elements but no real content
- Time tracking shows >50% effort on animations/games vs. content/layout
- Friends/testers say "cool effects" but can't describe what Kaden does

**Phase relevance:** Roadmap structure. Content phases should precede or run parallel to interaction phases, never after.

**Confidence:** HIGH (common pattern in personal website projects — this is the #1 reason personality-driven portfolios fail to achieve their goal)

---

### Pitfall 8: Leaderboard API as an Open Spam Endpoint

**What goes wrong:** The leaderboard API endpoint (`POST /api/scores`) is publicly accessible with no authentication, rate limiting, or input validation. Bots discover it and flood the database with garbage entries. Or a curious visitor reverse-engineers the API and submits offensive names alongside scores. The Supabase free tier's row limit is exhausted by spam.

**Prevention:**
- **Rate limit the API:** Use Vercel's built-in rate limiting or implement IP-based throttling. Maximum 10 submissions per IP per hour is reasonable.
- **Input sanitization:** Max name length (20 characters), alphanumeric + spaces only, profanity filter (a simple blocklist is sufficient for a personal site).
- **Supabase Row Level Security (RLS):** Enable RLS on the scores table. Use an anon key with INSERT-only permissions. No UPDATE or DELETE from the client.
- **Honeypot fields:** Add a hidden form field. Bots fill it; real users don't. Reject submissions where the honeypot is populated.
- **Database row limits:** Set up a cleanup job or Supabase database function that keeps only the top 100 scores per game, deleting the rest. Prevents table bloat.
- **CORS restrictions:** Only allow requests from your domain.

**Detection:**
- Sudden spike in database rows
- Offensive or nonsensical names appearing on leaderboard
- Supabase usage alerts (approaching free tier limits)

**Phase relevance:** Backend/leaderboard phase. Security must be part of the initial API design.

**Confidence:** HIGH (standard API security patterns, specific to this project's public leaderboard requirement)

---

### Pitfall 9: Blog/Content Management Complexity Creep

**What goes wrong:** Starting with "I'll use markdown files" is fine. Then you want syntax highlighting, then MDX for interactive components in posts, then dynamic OG images, then a CMS because editing files in VS Code is annoying. Each addition brings new dependencies, build complexity, and potential breakage. The blog system becomes over-engineered for a site that might have 5-10 posts.

**Prevention:**
- **Start with plain Markdown + `gray-matter` + `next-mdx-remote`** (or the equivalent `@next/mdx`). This is the simplest viable blog for a Next.js site.
- **Don't add a CMS.** The PROJECT.md explicitly says "content managed through code/markdown" — respect that constraint. A CMS adds auth, a dashboard, API integrations, and content modeling complexity that's not justified for a single-author personal site.
- **Use static generation (`generateStaticParams`)** for blog posts. They're static content — no need for server-side rendering on every request.
- **Add features on demand, not preemptively:** Syntax highlighting? Add it when you write a code-heavy post. MDX components? Add them when you have a specific interactive post idea. Not before.
- **OG images:** Use `next/og` (ImageResponse API from `@vercel/og`) for dynamic OG image generation. It's built into Next.js and requires minimal setup.

**Detection:**
- Blog dependencies outnumber blog posts
- Blog build step takes longer than the rest of the site
- Spending more time configuring the blog system than writing content

**Phase relevance:** Blog/content phase. Start minimal, expand based on actual writing needs.

**Confidence:** HIGH (the PROJECT.md explicitly scopes this; markdown-based blogs in Next.js are well-established)

---

## Minor Pitfalls

---

### Pitfall 10: Easter Eggs That Nobody Finds

**What goes wrong:** Easter eggs are hidden so well that nobody ever discovers them. Or they require such specific interactions (triple-click on the third word of the second paragraph while holding Shift) that they're effectively nonexistent. The developer spent hours on them; zero visitors ever see them.

**Prevention:**
- **Layer discovery difficulty:** Have 2-3 "easy" Easter eggs (click a specific icon, type a konami code, hover over a suspicious element) and 1-2 genuinely hidden ones.
- **Breadcrumbs:** Subtle visual hints. A sticker that wiggles slightly more than others. A cursor change on hover. A tooltip that says "psst..."
- **Social shareability:** When someone finds an Easter egg, make it screenshot-worthy or shareable. This creates organic discovery for others.
- **Keep a secret page or URL** (e.g., `/secret`) — people will try common hidden URLs.

**Detection:**
- Analytics show zero interactions with Easter egg elements (if tracked)
- Nobody mentions Easter eggs when sharing the site

**Phase relevance:** Easter eggs phase. Design discovery gradients intentionally.

**Confidence:** MEDIUM (based on UX design patterns and common personal site observations)

---

### Pitfall 11: Canvas/WebGL Minigames Breaking SSR

**What goes wrong:** A minigame component imports a library that accesses `window`, `document`, or `canvas` APIs at module level. Next.js tries to render it on the server, crashes, and the build fails. Or it renders an empty container server-side and the game flashes in on hydration.

**Prevention:**
- **Always use `next/dynamic` with `{ ssr: false }` for game components.** This is non-negotiable for anything using `<canvas>`, WebGL, or game libraries (Phaser, PixiJS, p5.js).
- **Provide a loading placeholder:** Use the `loading` option in `next/dynamic` to show a game thumbnail or "Loading game..." skeleton while the component loads client-side.
- **Lazy-load game libraries:** Don't import Phaser or a 200KB game engine on page load. Dynamic import it when the user clicks "Play."
- **Isolate game code:** Keep game logic in dedicated files/folders separate from the component tree. This prevents accidental server-side import chains.

**Detection:**
- Build errors referencing `window is not defined` or `document is not defined`
- Empty spaces on initial page render that pop in with content
- Large "First Load JS" in `next build` output for pages containing games

**Phase relevance:** Minigames phase. Establish the dynamic import pattern for the first game; reuse for all subsequent games.

**Confidence:** HIGH (verified against Next.js dynamic import documentation)

---

### Pitfall 12: Deployment Environment Variable Mismanagement

**What goes wrong:** The Supabase URL and anon key are needed on the client (for leaderboard reads). The service role key is needed on the server (for score validation). The developer puts all of them in `.env.local` without the `NEXT_PUBLIC_` prefix, and the client-side leaderboard component can't connect. Or worse, they prefix the service role key with `NEXT_PUBLIC_` and expose it to the browser.

**Prevention:**
- **Strict prefix discipline:**
  - `NEXT_PUBLIC_SUPABASE_URL` — client-safe, prefixed
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-safe, prefixed (anon key is designed to be public; RLS protects the data)
  - `SUPABASE_SERVICE_ROLE_KEY` — server-only, NO prefix
- **Use the `server-only` package** in any module that imports the service role key
- **Set environment variables in Vercel dashboard** for production, not just in `.env.local`
- **Use `.env.example`** with placeholder values committed to the repo, documenting which variables are needed

**Detection:**
- Client-side `fetch` to Supabase returns 401 or empty responses
- Supabase service role key visible in browser DevTools Network tab
- Build succeeds locally but fails on Vercel (missing env vars)

**Phase relevance:** Backend/deployment phase. Define the env var strategy at project setup.

**Confidence:** HIGH (verified against Next.js environment variable documentation)

---

### Pitfall 13: Ignoring Core Web Vitals Until the End

**What goes wrong:** The site is built feature-by-feature with no performance monitoring. At the end, Lighthouse scores are checked: LCP is 6 seconds (should be <2.5s), CLS is 0.4 (should be <0.1), and INP is 500ms (should be <200ms). Fixing these retroactively requires rearchitecting animation systems, image loading, and font loading — essentially a rewrite of the visual layer.

**Prevention:**
- **Set performance budgets in Phase 1:**
  - LCP < 2.5s
  - CLS < 0.1
  - INP < 200ms
  - First Load JS < 150KB gzipped per route
- **Use `next/image` for all images** from day one. Never use raw `<img>` tags. Specify `width` and `height` to prevent CLS.
- **Use `next/font` for font loading** — eliminates FOUT/FOIT and the CLS that comes with it.
- **Run Lighthouse in CI** (or at minimum, before each merge). Vercel provides automatic Web Vitals monitoring.
- **Preload critical assets:** Hero images, primary font weights.
- **Avoid layout-shifting animations:** Elements that animate from `height: 0` to `height: auto` cause CLS. Use `transform: scaleY()` or fixed-height containers instead.

**Detection:**
- Lighthouse Performance score below 80
- Vercel Analytics showing poor Core Web Vitals
- Visual "jump" when the page loads (CLS)

**Phase relevance:** Every phase. Establish baselines in Phase 1, monitor throughout, never let scores degrade.

**Confidence:** HIGH (Core Web Vitals are well-documented by web.dev; `next/image` and `next/font` are verified in Next.js docs)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Foundation / Design System | "Use Client" avalanche (Pitfall 1) | Establish Server/Client component boundary patterns. Create a reference architecture showing which components are client vs server. |
| Foundation / Design System | Animation performance (Pitfall 3) | Set up animation utility patterns using only `transform`/`opacity`. Create a shared `<AnimateIn>` component. Set performance budget. |
| Foundation / Design System | Mobile responsiveness (Pitfall 4) | Design mobile-first. Establish breakpoint system. Define floating element behavior per breakpoint. |
| Interactive Elements / Stickers | Hydration mismatches (Pitfall 6) | Use `useEffect` for random positioning. Use `{ ssr: false }` for scatter layouts. |
| Interactive Elements / Stickers | Accessibility (Pitfall 5) | Implement `prefers-reduced-motion` check in shared animation utilities. Add `aria-hidden` to purely decorative elements. |
| Minigames | Canvas/WebGL SSR crashes (Pitfall 11) | Always use `next/dynamic` with `{ ssr: false }`. Provide loading placeholders. Lazy-load game libraries. |
| Leaderboard Backend | Score manipulation (Pitfall 2) | Design session token system. Implement server-side score ceiling validation. Add rate limiting. |
| Leaderboard Backend | API spam (Pitfall 8) | Rate limiting, input sanitization, RLS, CORS. Design cleanup jobs for row limits. |
| Leaderboard Backend | Env var exposure (Pitfall 12) | Strict `NEXT_PUBLIC_` prefix discipline. `server-only` imports. |
| Blog / Content | Complexity creep (Pitfall 9) | Start with plain markdown. Add features only when needed by actual content. |
| Content Overall | Over-engineering fun (Pitfall 7) | Content-first milestone gate. Real content must exist before polish interactions. |
| Easter Eggs | Undiscoverable (Pitfall 10) | Layer difficulty. Add subtle visual hints. Include at least one easy-to-find Easter egg. |
| Deployment | Core Web Vitals (Pitfall 13) | Run Lighthouse before deployment. Use `next/image`, `next/font`. Monitor with Vercel Analytics. |

---

## Sources

- Next.js 16.x Official Documentation — Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components (HIGH confidence, fetched 2026-02-22)
- Next.js 16.x Official Documentation — Lazy Loading / Dynamic Imports: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading (HIGH confidence, fetched 2026-02-22)
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables (HIGH confidence, verified via docs)
- Core Web Vitals / web.dev: https://web.dev/vitals/ (HIGH confidence, well-established standards)
- WCAG 2.1 Accessibility Guidelines: https://www.w3.org/WAI/WCAG21/quickref/ (HIGH confidence, W3C standard)
- CSS Compositing (transform/opacity GPU acceleration): Browser rendering pipeline knowledge (HIGH confidence, fundamental to browser architecture)
- Leaderboard security patterns: Applied security engineering knowledge (HIGH confidence, well-known attack vectors for client-side games)
- Supabase Row Level Security: https://supabase.com/docs/guides/auth/row-level-security (MEDIUM confidence, not directly fetched this session but well-established documentation)
