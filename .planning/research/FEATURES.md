# Feature Landscape

**Domain:** Interactive, personality-driven personal website / portfolio
**Researched:** 2026-02-22
**Overall confidence:** MEDIUM (web search/fetch unavailable; analysis based on training knowledge of reference sites and personal website ecosystem patterns -- verified against PROJECT.md requirements)

## Table Stakes

Features visitors expect from a personal website. Missing any of these and the site feels incomplete or broken, no matter how fun the interactive bits are.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Who-you-are section** | First thing anyone looks for. "About" is the #1 visited page on personal sites. Without it, visitors bounce. | Low | Use conversational naming ("who's this guy?" per PROJECT.md). Photo is essential -- real photo, not avatar. 2-3 paragraphs max, personality-forward. |
| **Projects showcase** | Visitors come to see what you've built. A personal site without projects is a business card. | Medium | Must support stubs/placeholders for future work. Each project needs: title, one-liner, visual (screenshot or icon), link. Tags for filtering (research, code, creative). |
| **Navigation that works** | Users must be able to find sections. Clever naming is fine; confusion is not. | Low | Can be unconventional (sidebar, floating nav, scroll-based) but must be obvious. Mobile hamburger menu or equivalent required. |
| **Responsive design** | 60%+ of web traffic is mobile. A site that breaks on phones is amateur hour. | Medium | Every interactive element needs a mobile fallback. Floating stickers must not obscure content on small screens. |
| **Contact / socials** | Visitors need a way to reach you. This is a networking tool. | Low | Links to GitHub, YouTube, LinkedIn, email. Not a contact form (spam magnet) -- direct links are better. |
| **Fast initial load** | If the site takes 3+ seconds, visitors leave before seeing any personality. | Medium | Target < 2s LCP. Progressive enhancement: static content first, interactive elements hydrate after. Critical for all the fancy stuff to even matter. |
| **Blog / writing section** | Expected for someone positioning as a thinker/creator. Empty blog is worse than no blog. | Medium | Launch with 1-3 posts minimum or defer section entirely. Markdown-based, code syntax highlighting, readable typography. |
| **Warm, inviting visual design** | The "vibe" IS the product for a personality site. Sterile design contradicts the core value proposition. | Medium | Cream/peach/soft teal palette (Ali Abdaal reference). Rounded corners, generous whitespace, friendly typography. This isn't decoration -- it's the foundation everything else sits on. |
| **Semantic HTML / basic accessibility** | Screen readers, keyboard nav, and SEO all depend on this. Legal risk (ADA) and ethical requirement. | Low | Alt text on images, semantic headings, skip-to-content link, sufficient color contrast on text. Fun doesn't mean exclusionary. |
| **Custom domain** | yourname.com signals professionalism. A .vercel.app URL undermines the entire effort. | Low | Already in PROJECT.md constraints. Buy domain, configure DNS, done. |

## Differentiators

Features that make visitors say "I've never seen this on a personal site before." These transform a portfolio from forgettable to shareable. Ordered roughly by impact-to-effort ratio.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Floating stickers / margin decorations** | Immediately signals "this is different." Visitors click, hover, and explore. Creates the "walking into someone's creative space" feel from PROJECT.md. Inspired by mehai.dev. | Medium | Draggable or clickable SVG/image elements in page margins. Hover tooltips with personality. Must not obscure content. Mobile: smaller, repositioned, or in a drawer. Use Framer Motion for physics-based drag. |
| **Minigames (scattered, discoverable)** | The single biggest differentiator. Nobody expects games on a personal site. Creates shareability ("go play the game on Kaden's site"). | High | Start with 1-2 games. Mix of: (1) embedded in a section (e.g., typing speed test on the "about coding" page), (2) hidden/Easter egg games, (3) standalone game page. Canvas or React-based. Keep them SMALL -- 30-second experiences, not full applications. |
| **Persistent leaderboard** | Transforms minigames from novelty to engagement loop. Visitors return, share scores, compete. Social proof that others visit the site. | High | Requires real backend (Supabase recommended). Anti-cheat basics (server-side validation, rate limiting). Display: global leaderboard + "your rank." Name entry (no auth required -- friction kills engagement). |
| **Easter eggs / hidden surprises** | Rewards exploration. Creates word-of-mouth ("did you find the thing where..."). The llee Cornell page energy -- personality hidden in unexpected places. | Low-Med | Konami code triggering something fun. Hidden pages (e.g., /secret). Hover states that reveal jokes. Click a specific element X times for a surprise. Console.log messages for developers who inspect. Key: they must be DISCOVERABLE enough that someone finds them organically. |
| **Micro-animations everywhere** | Elevates perceived quality. The difference between "nice site" and "WOW this site." Subtle but cumulative. | Medium | Page transitions, scroll-triggered reveals, hover effects on cards, loading states with personality, cursor trails or custom cursor. Use Framer Motion. Respect prefers-reduced-motion. |
| **Conversational / casual section naming** | Makes navigation itself entertaining. "who's this guy?" instead of "About." "things I've made" instead of "Projects." Reinforces personality at every touchpoint. | Low | See llee's Cornell page for inspiration -- even hyperlink text has personality. Apply to nav items, page headings, button labels, 404 page, loading states. |
| **Interactive sidebar / margin widgets** | The wyattsell.com inspiration. Persistent UI elements that react, display live info, or offer interaction without leaving the current page. | Medium | Ideas: now-playing widget (Spotify API), current time/weather, random quote rotator, tiny doodle pad, "visitors right now" counter. Desktop only -- collapse or relocate on mobile. |
| **Custom 404 page** | Most sites waste this. A personality-driven 404 page turns a mistake into a moment. | Low | Funny copy, maybe a mini-game, link back home. Takes 1-2 hours to build, remembered forever. |
| **Scroll-driven storytelling** | For the "about" section especially, reveal content as the user scrolls. More engaging than a wall of text. | Medium | Use Intersection Observer or scroll-linked animations. Timeline of experiences, parallax elements, progressive reveal. Don't overdo it -- one section with this treatment, not the whole site. |
| **Dynamic/generative visual elements** | Background patterns, header art, or decorative elements that are slightly different each visit. | Medium | Generative SVG patterns, randomized color accent per visit, particle effects. Creates "living" feeling. Keep it subtle -- accent, not centerpiece. |
| **"Now" page** | A /now page (nownownow.com movement) showing what you're currently doing, reading, building. Creates return visits. | Low | Update manually or semi-automatically. Current classes, current project, currently reading, currently listening to. Very on-brand for a student/builder. |

## Anti-Features

Features to explicitly NOT build. Each of these is a trap that looks good on paper but hurts the actual experience or wastes significant effort.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **3D WebGL hero scene** | bruno-simon.com already did it definitively. Attempting this as a non-specialist means weeks of work for a worse version. Tanks mobile performance. Accessibility nightmare. | Use 2D animations with Framer Motion. Achieve "wow" through clever micro-interactions rather than raw technical spectacle. More personality, less GPU. |
| **User authentication / accounts** | Massive scope creep. Auth adds login UI, password reset, session management, GDPR concerns. The leaderboard doesn't need it. | Anonymous leaderboard entries: nickname + score. Optional: use a simple token/cookie so returning visitors see their previous scores. No signup flow. |
| **CMS / admin panel** | Already out of scope per PROJECT.md. A CMS adds a whole second application. For a personal site with infrequent updates, it's pure overhead. | Markdown files in the repo. Edit locally, push, deploy. MDX if you want React components in blog posts. |
| **Comment system on blog posts** | Moderation burden. Spam. Scope creep. Low engagement on personal blogs. | Link to Twitter/X or a contact method if people want to discuss. Or use GitHub Discussions linked from posts. |
| **Complex multi-page game** | A full game is a separate project. Embedding one in a portfolio site means maintaining two codebases. | Keep games to 30-second micro-experiences. One screen, one mechanic, one leaderboard. Think Flappy Bird, not Zelda. |
| **Real-time multiplayer** | WebSockets, game state sync, matchmaking -- this is a startup's worth of engineering. | Asynchronous competition via leaderboard. "Beat my score" is multiplayer enough. |
| **Dark mode toggle** | Controversial take: the warm cream/peach palette IS the brand. Dark mode means designing the entire site twice and diluting the carefully chosen aesthetic. Adds toggle UI complexity. | Pick the warm palette and commit. If forced to add dark mode later, it's an enhancement, not a launch feature. |
| **Infinite scroll / content feed** | This isn't a social media platform. Infinite scroll reduces exploration and makes the site feel like a feed rather than a space. | Distinct pages/sections. Let visitors choose where to go. The spatial metaphor ("walking into a room") requires boundaries. |
| **Analytics dashboard (visible)** | "X visitors this month" is vanity for the site owner and meaningless to visitors. | Use analytics privately (Vercel Analytics, Plausible). The only public metric should be leaderboard scores. |
| **Auto-playing audio/video** | Universally despised. Will cause immediate bounce. | Audio/video only on explicit user interaction. A "click to play" music box Easter egg is fine. Auto-play anything is not. |

## Feature Dependencies

```
Core Design System (colors, typography, spacing)
  |
  ├── Responsive Layout & Navigation
  |     ├── All content sections (About, Projects, Blog, Contact)
  |     ├── Floating Stickers (depends on layout grid)
  |     └── Sidebar Widgets (depends on layout grid)
  |
  ├── Micro-animations (Framer Motion setup)
  |     ├── Page transitions
  |     ├── Scroll-triggered reveals
  |     ├── Hover effects
  |     └── Easter egg triggers
  |
  ├── Content Sections
  |     ├── About/Who section (standalone)
  |     ├── Projects showcase (standalone)
  |     ├── Blog section (needs MDX pipeline)
  |     └── Contact/Socials (standalone)
  |
  ├── Minigames
  |     ├── Game engine/framework choice (Canvas or React-based)
  |     ├── Individual game implementations
  |     └── Leaderboard backend (Supabase)
  |           ├── Score submission API
  |           ├── Score retrieval API
  |           └── Leaderboard UI component
  |
  └── Easter Eggs (depend on most other features being in place to hide within)
```

**Critical path:** Design System --> Layout --> Content Sections --> Interactive Elements --> Minigames --> Leaderboard

**Key dependency insight:** Easter eggs should be built LAST because they depend on having real content and sections to hide within. Building them early means reworking them as the site evolves.

## MVP Recommendation

**Launch with these (Phase 1-2):**

1. **Design system + warm palette** -- Foundation everything builds on
2. **Responsive layout with casual navigation** -- The skeleton
3. **About section with personality** -- First thing visitors want
4. **Projects showcase with stubs** -- Proves you build things
5. **Contact/socials links** -- Lets people reach you
6. **Floating stickers (2-3 static ones)** -- Immediate "this is different" signal, low complexity
7. **Micro-animations on key interactions** -- Polish that compounds
8. **Custom 404 page** -- Low effort, high personality ROI

**Phase 2-3 (add after launch):**

9. **One minigame (simple, embedded)** -- Start with something like a reaction time test or memory match
10. **Leaderboard backend** -- Only worth building once a game exists
11. **Blog section with 1-2 posts** -- Don't launch empty
12. **"Now" page** -- Quick to build, strong return-visit driver
13. **More floating stickers (draggable)** -- Upgrade the static ones

**Defer (Phase 4+):**

14. **Multiple minigames** -- Only after validating the first one gets engagement
15. **Interactive sidebar widgets** -- Desktop enhancement, not essential
16. **Scroll-driven storytelling** -- Nice but not critical
17. **Easter eggs throughout** -- Build as the site matures and has enough surface area to hide things
18. **Generative visual elements** -- Icing on the cake

**Rationale:** The biggest mistake personality sites make is spending months on interactive features while having no actual content. A beautiful, warm site with real content and 2-3 interactive touches will outperform a half-built interactive playground with placeholder text. Ship the foundation, then layer on the fun.

## Competitive Landscape Notes

**What the reference sites teach us:**

| Site | Key Lesson | Steal This | Avoid This |
|------|-----------|------------|------------|
| **mehai.dev** | Stickers/decorative elements create spatial feeling with minimal engineering | Floating margin elements with tooltips | Don't over-clutter; 3-5 stickers per viewport max |
| **wyattsell.com** | Sidebar widgets create persistent personality presence | One or two always-visible interactive widgets | Don't make the sidebar compete with main content |
| **aliabdaal.com** | Warm colors + generous spacing = instant trust and comfort | Cream/peach base, soft shadows, rounded corners, friendly sans-serif | Don't copy the newsletter-forward layout (different goals) |
| **llee (Cornell)** | Personality in EVERY text element, even hyperlinks, is more memorable than any animation | Witty link text, self-aware humor, Easter eggs in unexpected places | Don't go full academic-page aesthetic -- take the tone, not the look |

**Broader patterns from standout portfolio sites (cassidoo.co, joshwcomeau.com, neal.fun):**

- The most memorable sites have ONE signature interactive element, not twenty mediocre ones
- Loading states and transitions matter more than hero sections
- Personality in error states (404, empty states, loading) is disproportionately impactful
- Sites that are fun to explore on desktop but functional on mobile win
- The "about" section is always the most-visited page -- invest heavily here

## Sources

- Project requirements from `/Users/kadenpriebe/Desktop/Personal Website/.planning/PROJECT.md`
- Training knowledge of reference sites: mehai.dev, wyattsell.com, aliabdaal.com, cs.cornell.edu/home/llee/ (MEDIUM confidence -- sites may have changed since training data)
- Training knowledge of broader portfolio ecosystem: bruno-simon.com, cassidoo.co, joshwcomeau.com, neal.fun (MEDIUM confidence)
- Personal website UX patterns from web development community consensus (HIGH confidence -- these patterns are well-established)

**Confidence note:** Web search and fetch tools were unavailable during this research. All reference site details are from training data (cutoff ~May 2025). The sites may have been redesigned since then. Feature categories and patterns are based on well-established web development best practices and should be HIGH confidence regardless. Specific reference site details are MEDIUM confidence and should be spot-checked visually.
