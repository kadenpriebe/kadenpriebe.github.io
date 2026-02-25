# Technology Stack

**Project:** Kaden Priebe -- Personal Website
**Researched:** 2026-02-22
**Overall Confidence:** MEDIUM (versions based on training data through May 2025; verify with `npm view <pkg> version` before installing)

---

## Version Verification Notice

Web search and npm registry access were unavailable during research. All version numbers reflect the latest known stable releases as of May 2025. Before running `npm install`, verify each version with `npm view <package> version`. The architecture and library choices are HIGH confidence; exact version pins are MEDIUM confidence.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Next.js** | ^15.x | Full-stack React framework | App Router for file-based routing, Server Components for fast initial loads, API Routes for the leaderboard backend, Image optimization built-in, and first-class Vercel deployment. The project needs both static content (blog, about) and dynamic features (leaderboard, interactive elements) -- Next.js handles both natively. | HIGH |
| **React** | ^19.x | UI library | Ships with Next.js 15. React 19 brings Server Components as stable, `use()` hook, Actions for forms, and improved Suspense -- all useful for mixing static pages with interactive widgets. | HIGH |
| **TypeScript** | ^5.x | Type safety | Non-negotiable for a project with interactive components, game logic, and API routes. Catches bugs before they ship, and Next.js has first-class TS support with zero config. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Tailwind CSS** | ^4.x | Utility-first CSS | Tailwind v4 is a ground-up rewrite with CSS-first configuration, lightning-fast builds via Oxide engine, and native `@theme` directive for custom design tokens. Perfect for defining Kaden's warm color palette (cream, peach, soft cyan) as first-class tokens. Co-locating styles with JSX means interactive components stay self-contained. | HIGH |
| **CSS Modules** | (built-in) | Scoped component styles | For cases where Tailwind utilities get unwieldy (complex animations, pseudo-element tricks). Next.js supports CSS Modules natively, zero config. Use sparingly alongside Tailwind. | HIGH |

**Why NOT other CSS options:**
- **styled-components / Emotion**: Runtime CSS-in-JS adds bundle size and hydration cost. Tailwind is zero-runtime.
- **Sass/SCSS**: Unnecessary indirection when Tailwind + CSS Modules cover everything. Extra build step with no real benefit.
- **Chakra UI / MUI**: Component libraries impose their design language. Kaden's site needs a bespoke warm aesthetic, not a generic Material look.

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Motion** (formerly Framer Motion) | ^11.x | Primary animation library | The dominant React animation library. Declarative API (`animate`, `whileHover`, `whileDrag`, `layout`) maps directly to the project's needs: floating stickers, hover effects, page transitions, micro-interactions. The `drag` prop gives draggable elements for free. `AnimatePresence` handles mount/unmount animations for Easter eggs. Rebranded from "Framer Motion" to "Motion" (package: `motion/react`). | HIGH |
| **GSAP** | ^3.12 | Complex timeline animations | For scroll-triggered sequences (ScrollTrigger plugin), complex chained animations, and canvas/SVG work that Motion handles less gracefully. GSAP's timeline model is unmatched for coordinated multi-element animations. Free for non-commercial use (this personal site qualifies). | HIGH |

**Animation strategy:** Use Motion for 90% of interactions (hover, drag, layout transitions, simple reveals). Use GSAP + ScrollTrigger for 10% of complex choreographed sequences (hero section entrance, scroll-driven parallax). Do NOT mix both on the same element -- choose one per component.

**Why NOT other animation options:**
- **react-spring**: Less intuitive API, smaller ecosystem, less documentation. Motion covers every use case react-spring does, with better DX.
- **Anime.js**: Not React-native. Requires manual ref management and lifecycle sync. GSAP fills this niche better.
- **Lottie**: Good for pre-made vector animations but overkill for this project's needs. Consider only if Kaden wants After Effects-quality animations later.
- **CSS animations only**: Insufficient for drag interactions, physics-based springs, and coordinated sequences.

### Interactive Elements

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Motion drag** | (included) | Draggable stickers/elements | Motion's built-in `drag` prop with `dragConstraints`, `dragElastic`, and `dragMomentum` gives physics-based dragging out of the box. No extra library needed for floating stickers. | HIGH |
| **@use-gesture/react** | ^10.x | Advanced gesture handling | For multi-touch gestures, pinch-to-zoom on images, and swipe interactions that go beyond basic drag. Pairs perfectly with Motion -- use-gesture handles the input, Motion handles the visual response. | MEDIUM |
| **react-confetti** | ^6.x | Celebration effects | Lightweight confetti explosions for Easter eggs, leaderboard achievements, game wins. Small bundle, no dependencies. | MEDIUM |

### Minigames

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **HTML5 Canvas API** | (native) | Game rendering | For arcade-style minigames (Snake, Breakout, etc.), raw Canvas gives full control with zero bundle cost. Wrap in a React component with `useRef` + `useEffect` for lifecycle management. | HIGH |
| **React** (components) | (included) | DOM-based puzzle games | For brain teasers, memory games, and UI-based puzzles, React components with Motion animations are simpler and more accessible than Canvas. Use React for anything that benefits from DOM structure. | HIGH |

**Game architecture decision:** Do NOT pull in a game engine (Phaser, PixiJS) for the minigames. These are small, embedded games -- not full game projects. Canvas for anything needing a render loop (arcade games), React components for everything else (card matching, trivia, word games). If a specific game later needs 2D physics, add `matter.js` for that game only.

**Why NOT game engines:**
- **Phaser**: 500KB+ bundle for features you will not use. Designed for standalone games, not embedded widgets.
- **PixiJS**: WebGL renderer is overkill for simple 2D minigames. Adds complexity without proportional benefit.
- **Three.js / React Three Fiber**: 3D is not needed. Massive bundle for zero value here.

### Backend / Database (Leaderboard)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Supabase** | JS client ^2.x | Database + realtime | PostgreSQL under the hood with a generous free tier (500MB, 50K monthly active users). Built-in realtime subscriptions mean the leaderboard updates live without polling. Row Level Security for anti-cheat basics. REST and realtime APIs with zero server management. The JS client works in Next.js API routes and directly from the browser. | HIGH |
| **Next.js API Routes** | (included) | Backend API layer | Server-side score validation before writing to Supabase. Prevents client-side score manipulation. App Router's Route Handlers (`app/api/`) support streaming and edge runtime. | HIGH |

**Why Supabase over alternatives:**
- **PlanetScale**: Shut down its free tier in 2024. MySQL-based, less ecosystem support for realtime. Not recommended.
- **Neon**: Solid PostgreSQL serverless option but lacks built-in realtime subscriptions. Would need to add Pusher/Ably/websockets separately for live leaderboard updates. More moving parts.
- **Firebase/Firestore**: NoSQL makes leaderboard queries (ORDER BY score DESC LIMIT 10) awkward. Google ecosystem lock-in. Supabase's PostgreSQL is more flexible.
- **Upstash Redis**: Great for rate limiting (add later if needed) but not a primary database. No relational queries.
- **SQLite / Turso**: Interesting but less mature ecosystem. No built-in realtime.

### Deployment & Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Vercel** | — | Hosting & deployment | First-party Next.js deployment. Zero-config, automatic preview deployments on PRs, edge functions, image optimization CDN, analytics built-in. Custom domain setup is trivial (DNS records). Free tier covers personal sites easily. | HIGH |
| **Vercel Analytics** | (included) | Performance monitoring | Web Vitals tracking to ensure interactive elements do not tank performance. Free on Hobby plan. | MEDIUM |

**Why NOT other hosts:**
- **Netlify**: Good, but Next.js support is second-class compared to Vercel. SSR/ISR edge cases.
- **Cloudflare Pages**: Improving rapidly but Next.js compatibility still has gaps (middleware, certain API route features).
- **Self-hosted (Docker/VPS)**: Unnecessary operational burden for a personal site. Vercel handles scaling, SSL, CDN.

### Content & Markdown

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **MDX** | ^3.x | Blog/writing content | Markdown with JSX components. Write blog posts in Markdown but embed interactive React components (charts, code demos, mini-widgets) inline. `@next/mdx` or `next-mdx-remote` for Next.js integration. | HIGH |
| **next-mdx-remote** | ^5.x | Remote/dynamic MDX | Renders MDX from file system at build time with full component support. Better than `@next/mdx` for blog-style content because it supports frontmatter and dynamic loading without webpack config. | HIGH |
| **gray-matter** | ^4.x | Frontmatter parsing | Parses YAML frontmatter from MDX files (title, date, tags). Lightweight, battle-tested, pairs with next-mdx-remote. | HIGH |
| **rehype-pretty-code** | ^0.13+ | Code syntax highlighting | If blog posts include code snippets. Uses Shiki under the hood for accurate, VS Code-quality highlighting with zero client JS. | MEDIUM |

### Design System & UI Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Radix UI Primitives** | latest | Accessible unstyled components | For tooltips, dialogs, popovers, dropdown menus -- all needed for Easter eggs and interactive elements. Fully accessible (WAI-ARIA), completely unstyled (bring your own warm palette). The primitives approach means Kaden's design is never constrained by a library's opinions. | HIGH |
| **clsx** | ^2.x | Conditional class merging | Tiny utility for composing Tailwind classes conditionally. Essential for interactive states (`isActive`, `isDragging`, etc.). | HIGH |
| **tailwind-merge** | ^2.x | Tailwind class conflict resolution | Prevents Tailwind class conflicts when merging component props. Use with clsx via a `cn()` utility function. | HIGH |
| **Lucide React** | latest | Icons | Clean, consistent icon set. Tree-shakeable (only imports icons you use). Better maintained than react-icons (which bundles everything). Warm, rounded icon style fits the aesthetic. | MEDIUM |

### Developer Experience

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **ESLint** | ^9.x | Code linting | Next.js ships with ESLint config. Flat config format in v9. Catches bugs and enforces consistency. | HIGH |
| **Prettier** | ^3.x | Code formatting | End formatting debates. Integrates with ESLint via eslint-config-prettier. | HIGH |
| **Husky** | ^9.x | Git hooks | Pre-commit linting and formatting. Prevents broken code from being committed. | MEDIUM |

---

## Supporting Libraries (Add When Needed)

These are NOT part of the initial install. Add them when their specific feature is being built.

| Library | Version | Purpose | When to Add |
|---------|---------|---------|-------------|
| **canvas-confetti** | ^1.9 | Canvas-based confetti | When building Easter egg celebrations (lighter than react-confetti) |
| **zustand** | ^5.x | Lightweight state management | When game state or sticker positions need to persist across components. Simpler than Redux, works with React 19. Do NOT add unless useState/useContext becomes insufficient. |
| **@tanstack/react-query** | ^5.x | Server state management | When leaderboard data fetching becomes complex (caching, refetching, optimistic updates). Overkill for initial MVP -- start with simple `fetch` in Server Components. |
| **sharp** | latest | Image optimization | Vercel includes this for Next.js Image component. Only install explicitly if doing custom image processing. |
| **matter.js** | ^0.19+ | 2D physics engine | Only if a specific minigame needs realistic physics (bouncing balls, ragdoll). Do NOT add speculatively. |
| **@vercel/og** | latest | Open Graph images | Dynamic social preview images. Add when building share/SEO features. |
| **next-themes** | ^0.4 | Theme switching | Only if adding dark mode. The warm palette might not need dark mode -- decide later. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Astro | Astro excels at static content sites but interactive "islands" become awkward when the ENTIRE site is interactive. Next.js gives full React everywhere. |
| Framework | Next.js 15 | Remix | Solid framework but smaller ecosystem, fewer deployment options, less community content for portfolio/personal sites. |
| Framework | Next.js 15 | Vite + React | No SSR/SSG out of the box. No file-based routing. No API routes. Would need to assemble what Next.js gives for free. |
| Styling | Tailwind CSS v4 | vanilla-extract | Type-safe CSS is appealing but smaller ecosystem, steeper learning curve, and Tailwind's utility-first approach is faster for prototyping a personal site. |
| Animation | Motion | react-spring | Less intuitive API, weaker drag support, less documentation. Motion is the clear ecosystem leader. |
| Database | Supabase | Convex | Interesting reactive database but newer, smaller community, and the free tier is more constrained. Supabase is battle-tested. |
| Database | Supabase | Drizzle + Neon | Drizzle ORM + Neon serverless PostgreSQL is a strong combo, but requires assembling realtime yourself. More pieces to manage for the same outcome. |
| State | Start with React context | Redux Toolkit | Massive overkill for a personal site. If state gets complex, Zustand is 10x simpler. |
| Icons | Lucide React | react-icons | react-icons bundles ALL icon sets (even if tree-shaken, the DX is worse). Lucide is purpose-built, lighter, and better maintained. |
| Content | MDX | Contentlayer | Contentlayer was effectively abandoned in 2024. next-mdx-remote is actively maintained and simpler. |
| Content | MDX | Sanity/Strapi CMS | Out of scope per PROJECT.md -- content managed through code/markdown, no CMS. |

---

## Design Token Strategy

The warm, colorful aesthetic is a core project requirement. Define these in Tailwind v4's CSS-first configuration.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Warm palette inspired by Ali Abdaal */
  --color-cream: #FFF8F0;
  --color-cream-dark: #F5EDE3;
  --color-peach: #FFCBA4;
  --color-peach-light: #FFE0C7;
  --color-peach-dark: #E8A878;
  --color-coral: #FF8C6B;
  --color-soft-cyan: #A8E6CF;
  --color-soft-cyan-dark: #7BC4A5;
  --color-lavender: #D4B8FF;
  --color-warm-gray: #6B5B4E;
  --color-warm-gray-light: #8B7D70;
  --color-text-primary: #3D2E22;
  --color-text-secondary: #6B5B4E;
  --color-surface: #FFFAF5;
  --color-surface-elevated: #FFFFFF;

  /* Typography */
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-fun: 'Quicksand', sans-serif; /* For playful UI elements */

  /* Spacing scale */
  --radius-soft: 12px;
  --radius-pill: 9999px;
  --radius-card: 16px;

  /* Shadows (warm-tinted) */
  --shadow-soft: 0 2px 8px rgba(107, 91, 78, 0.08);
  --shadow-medium: 0 4px 16px rgba(107, 91, 78, 0.12);
  --shadow-float: 0 8px 32px rgba(107, 91, 78, 0.16);
}
```

**Font choices rationale:**
- **Plus Jakarta Sans**: Geometric, friendly, warm. Used widely in modern creative portfolios. Pairs well with the colorful aesthetic.
- **Inter**: The workhorse body font. Exceptional legibility at all sizes, variable font for performance.
- **Quicksand**: Rounded, playful -- use for game UI, sticker labels, fun callouts. NOT for body text.
- Load via `next/font/google` for zero-CLS font loading.

---

## Project Structure

```
kaden-website/
  app/
    layout.tsx              # Root layout, fonts, global providers
    page.tsx                # Homepage
    globals.css             # Tailwind theme + global styles
    api/
      leaderboard/
        route.ts            # Leaderboard API (GET scores, POST new score)
    (sections)/             # Route groups for page sections
      about/
      projects/
      blog/
        [slug]/
          page.tsx          # Dynamic MDX blog posts
      games/
        page.tsx            # Games hub
        [game]/
          page.tsx          # Individual game pages
  components/
    ui/                     # Radix-based primitives (tooltip, dialog, etc.)
    interactive/            # Floating stickers, draggable elements
    games/                  # Game components (each self-contained)
    layout/                 # Nav, footer, sidebar
    animations/             # Reusable Motion animation wrappers
  content/
    blog/                   # MDX blog posts
  lib/
    supabase.ts             # Supabase client initialization
    utils.ts                # cn() helper, shared utilities
    games/                  # Game logic (separated from rendering)
  public/
    stickers/               # SVG/PNG sticker assets
    sounds/                 # Optional game sound effects
```

---

## Installation

```bash
# Initialize Next.js project with TypeScript and Tailwind
npx create-next-app@latest kaden-website --typescript --tailwind --eslint --app --src-dir=false

# Animation
npm install motion gsap

# Database (leaderboard)
npm install @supabase/supabase-js

# Content (MDX blog)
npm install next-mdx-remote gray-matter

# UI primitives (install individually as needed)
npm install @radix-ui/react-tooltip @radix-ui/react-dialog @radix-ui/react-popover

# Utilities
npm install clsx tailwind-merge lucide-react

# Gestures (when building interactive elements)
npm install @use-gesture/react

# Dev dependencies
npm install -D prettier eslint-config-prettier
```

**Install in phases, not all at once.** Start with core (Next.js, Tailwind, Motion) and add libraries as their features are built.

---

## Performance Budget

Interactive personal sites can easily balloon. Set these constraints:

| Metric | Target | Why |
|--------|--------|-----|
| First Contentful Paint | < 1.5s | Content should feel instant |
| Largest Contentful Paint | < 2.5s | Hero section with animations |
| Total Bundle Size (JS) | < 200KB gzipped | Interactive is not an excuse for slow |
| Time to Interactive | < 3.5s | Games and stickers should be usable fast |
| Cumulative Layout Shift | < 0.1 | Floating elements must not cause layout shift |

**Strategies:**
- Use Next.js `dynamic()` with `ssr: false` for game components (they need Canvas/browser APIs anyway)
- Lazy-load game code only when user navigates to game section
- Use `next/image` for all images (automatic WebP, lazy loading, sizing)
- Keep Motion animations GPU-accelerated (transform/opacity only, avoid animating width/height/top/left)
- Preload critical fonts via `next/font`

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # Server-side only, never expose
```

---

## Sources & Confidence

| Recommendation | Basis | Confidence |
|----------------|-------|------------|
| Next.js 15 + App Router | Training data + established ecosystem leader | HIGH |
| React 19 | Ships with Next.js 15, stable since late 2024 | HIGH |
| Tailwind CSS v4 | Training data (released early 2025), verify exact version | MEDIUM -- verify version |
| Motion (Framer Motion rebrand) | Training data (rebrand happened in 2024), verify package name | MEDIUM -- verify import path |
| GSAP 3.12+ | Long-stable library, verify latest | HIGH |
| Supabase | Established, growing, free tier verified through 2024 | HIGH |
| Vercel deployment | First-party Next.js host, obvious choice | HIGH |
| MDX + next-mdx-remote | Established pattern, verify v5 API | MEDIUM |
| Radix UI | Stable, widely adopted | HIGH |
| Design tokens / colors | Subjective -- needs visual validation | MEDIUM |
| Font choices | Based on design trend knowledge, verify availability | MEDIUM |
| Project structure | Based on Next.js App Router conventions | HIGH |

**Key verification tasks before starting development:**
1. Run `npm view next version` to confirm Next.js version
2. Run `npm view motion version` to confirm Motion package name and version
3. Run `npm view tailwindcss version` to confirm Tailwind v4 availability
4. Check Supabase free tier limits at supabase.com/pricing
5. Test `create-next-app` flags -- the exact CLI flags may have changed
