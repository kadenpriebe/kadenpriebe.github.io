# Architecture Patterns

**Domain:** Interactive personal website with minigames, leaderboard, blog, and Easter eggs
**Researched:** 2026-02-22

## Recommended Architecture

### High-Level Overview

```
+------------------------------------------------------------------+
|                        Root Layout                                |
|  (html, body, fonts, global providers, global CSS)                |
|                                                                   |
|  +-------------------+  +-------------------------------------+  |
|  | InteractiveLayer  |  |         Page Content                |  |
|  | (Client)          |  |  (Server Components by default)     |  |
|  |                   |  |                                     |  |
|  | - FloatingStickers|  |  +-------------------------------+  |  |
|  | - EasterEggSystem |  |  | Route-specific Layout         |  |  |
|  | - CursorEffects   |  |  |                               |  |  |
|  | - Konami listener |  |  |  +----------+ +-----------+   |  |  |
|  +-------------------+  |  |  | Sidebar  | | Main      |   |  |  |
|                          |  |  | Widgets  | | Content   |   |  |  |
|                          |  |  | (Client) | | (Server)  |   |  |  |
|                          |  |  +----------+ +-----------+   |  |  |
|                          |  +-------------------------------+  |  |
|                          +-------------------------------------+  |
+------------------------------------------------------------------+
|                        API Layer                                  |
|  /api/leaderboard  /api/easter-eggs  /api/analytics              |
+------------------------------------------------------------------+
|                       Database (Supabase)                         |
|  scores | easter_egg_discoveries | (optional: analytics)         |
+------------------------------------------------------------------+
```

### Architecture Strategy: Server-First with Client Islands

The core architectural principle is **server-first rendering with client component islands**. Next.js App Router defaults all components to Server Components. Interactive elements (animations, drag, state) are isolated in Client Components marked with `'use client'`. This keeps the JS bundle small while enabling rich interactivity where needed.

**Why this pattern:** A personal website is primarily content (about, projects, blog). Content renders faster and SEO-indexes better as Server Components. Interactive elements (stickers, minigames, sidebar widgets) are layered on top as Client Components without bloating the initial page load.

## Component Boundaries

### Layer 1: Shell (Server)

The outermost layer handles HTML structure, metadata, fonts, and global styling. This is entirely server-rendered.

| Component | Responsibility | Renders As |
|-----------|---------------|------------|
| `RootLayout` | `<html>`, `<body>`, global fonts, metadata, imports global CSS | Server |
| `Navigation` | Site nav header with fun section names | Server (links are static) |
| `Footer` | Site footer, social links | Server |
| `ThemeProvider` | CSS custom properties for warm color palette | Client (wraps children) |

### Layer 2: Interactive Overlay (Client)

A persistent client-side layer that sits on top of all page content. This layer manages global interactive elements that persist across page navigations.

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `InteractiveLayer` | Container for all floating/overlay interactive elements | All child interactive components |
| `FloatingStickers` | Renders draggable sticker elements in page margins | `StickerStore` (Zustand) |
| `EasterEggManager` | Listens for triggers (Konami code, click sequences, scroll positions), shows rewards | `EasterEggStore`, `/api/easter-eggs` |
| `CursorEffects` | Custom cursor trail or hover sparkle effects | Mouse events (local state) |
| `ToastNotifications` | Shows Easter egg discoveries, achievements | `EasterEggManager` |

### Layer 3: Page Content (Mixed Server/Client)

Each page is a Server Component by default, with Client Component islands for interactive sections.

| Component | Responsibility | Renders As |
|-----------|---------------|------------|
| `HeroSection` | Landing page hero with animated intro | Client (animations) |
| `AboutSection` | "Who's this guy?" content and photo | Server with Client animation wrappers |
| `ProjectCard` | Individual project showcase card | Client (hover effects, animations) |
| `BlogPostContent` | MDX-rendered blog post | Server (MDX renders server-side) |
| `MinigameEmbed` | Wrapper that lazy-loads a minigame | Client (dynamic import) |
| `LeaderboardDisplay` | Shows top scores for a minigame | Client (fetches from API, real-time optional) |
| `SidebarWidgets` | Fun sidebar elements (mini-clock, random fact, "currently" status) | Client |

### Layer 4: Minigame System (Client)

Each minigame is a fully client-side experience, lazy-loaded to avoid impacting initial page load.

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `MinigameShell` | Common wrapper: score display, submit button, instructions | Individual game + `/api/leaderboard` |
| `SnakeGame` / `MemoryGame` / `TypeRacer` / etc. | Individual game logic and rendering | `MinigameShell` via props/callbacks |
| `ScoreSubmitForm` | Name + score submission after game ends | `/api/leaderboard` POST |
| `LeaderboardPanel` | Top 10 scores display | `/api/leaderboard` GET |

### Layer 5: API Routes (Server)

Next.js Route Handlers in `app/api/` provide the backend for dynamic features.

| Route | Method | Responsibility | Communicates With |
|-------|--------|---------------|-------------------|
| `/api/leaderboard` | GET | Fetch top scores (filterable by game) | Supabase `scores` table |
| `/api/leaderboard` | POST | Submit a new score (with rate limiting + validation) | Supabase `scores` table |
| `/api/easter-eggs` | POST | Log an Easter egg discovery (optional analytics) | Supabase `discoveries` table |

## Data Flow

### Content Data Flow (Static)

```
MDX files in /content/blog/
        |
        v
Build time: @next/mdx compiles to React components
        |
        v
Server Component renders HTML (zero JS for content)
        |
        v
Client receives pre-rendered HTML
```

Blog posts, project descriptions, and about content are all **build-time static**. MDX files live in a `/content/` directory, are compiled at build time by `@next/mdx`, and rendered as Server Components. No client JavaScript is needed for content pages.

### Interactive Data Flow (Client-Side State)

```
User drags sticker
        |
        v
FloatingStickers component (Client)
        |
        v
Zustand store persists position to localStorage
        |
        v
On next visit: positions restored from localStorage
```

Sticker positions, Easter egg discovery status, and user preferences (like a nickname for leaderboard) are stored in **browser localStorage** via a lightweight Zustand store. No server round-trips for these.

### Leaderboard Data Flow (Client -> Server -> Database)

```
User finishes minigame
        |
        v
MinigameShell records score + shows ScoreSubmitForm
        |
        v
POST /api/leaderboard { game: "snake", name: "Kaden", score: 420 }
        |
        v
Route Handler: validate with Zod, rate limit, insert to Supabase
        |
        v
Supabase `scores` table stores record
        |
        v
GET /api/leaderboard?game=snake returns top 10
        |
        v
LeaderboardPanel re-fetches and displays updated rankings
```

### Easter Egg Data Flow

```
User triggers Easter egg (e.g., Konami code, clicks hidden element)
        |
        v
EasterEggManager detects trigger
        |
        v
1. Shows reward animation/toast (immediate, client-side)
2. Updates local discovery tracker (localStorage)
3. Optionally: POST /api/easter-eggs for analytics
```

Easter eggs are **client-first**: the reward shows instantly from local state, with optional server logging for fun analytics (e.g., "47 people found the Konami code this month").

## Project File Structure

```
src/
  app/
    layout.tsx                    # Root layout (Server)
    page.tsx                      # Home page (Server)
    globals.css                   # Tailwind + custom properties

    (main)/                       # Route group for main content pages
      layout.tsx                  # Shared layout with sidebar
      about/
        page.tsx                  # "Who's this guy?"
      projects/
        page.tsx                  # Project showcase grid
        [slug]/
          page.tsx                # Individual project detail
      blog/
        page.tsx                  # Blog index
        [slug]/
          page.tsx                # Individual blog post (renders MDX)
      links/
        page.tsx                  # Social links / connect page

    games/                        # Minigame section
      page.tsx                    # Games index / arcade
      [game]/
        page.tsx                  # Individual minigame page

    api/
      leaderboard/
        route.ts                  # GET (fetch scores) + POST (submit score)
      easter-eggs/
        route.ts                  # POST (log discovery)

  components/
    layout/
      navigation.tsx              # Site navigation (Server)
      footer.tsx                  # Site footer (Server)
      sidebar.tsx                 # Sidebar container (Server shell)

    interactive/
      interactive-layer.tsx       # Global interactive overlay (Client)
      floating-stickers.tsx       # Draggable margin stickers (Client)
      sticker.tsx                 # Individual sticker component (Client)
      easter-egg-manager.tsx      # Easter egg detection system (Client)
      cursor-effects.tsx          # Custom cursor effects (Client)
      toast.tsx                   # Toast notification system (Client)

    ui/
      button.tsx                  # Styled button
      card.tsx                    # Styled card
      badge.tsx                   # Tag/badge component
      section-heading.tsx         # Fun section headers with decorations
      animated-text.tsx           # Text with entrance animations (Client)
      hover-card.tsx              # Card with hover tilt/glow effect (Client)

    widgets/
      mini-clock.tsx              # Sidebar clock widget (Client)
      now-playing.tsx             # "Currently listening to" widget (Client)
      random-fact.tsx             # Random fun fact display (Client)
      visitor-counter.tsx         # "You are visitor #X" (Client)

    games/
      minigame-shell.tsx          # Common game wrapper (Client)
      leaderboard-panel.tsx       # Score display (Client)
      score-submit-form.tsx       # Name + score submission (Client)
      snake/
        snake-game.tsx            # Snake game (Client)
      memory/
        memory-game.tsx           # Memory card game (Client)
      typing/
        typing-game.tsx           # Typing speed game (Client)

    blog/
      blog-card.tsx               # Blog post preview card
      mdx-components.tsx          # Custom MDX component overrides

  content/
    blog/
      my-first-post.mdx           # Blog posts as MDX files
      another-post.mdx
    projects/
      project-data.ts             # Project metadata (title, description, tech, links)

  lib/
    supabase/
      client.ts                   # Supabase client for client components
      server.ts                   # Supabase client for server components
    utils.ts                      # Shared utility functions
    constants.ts                  # Site-wide constants (colors, sticker data, Easter egg definitions)

  stores/
    sticker-store.ts              # Zustand store for sticker positions
    easter-egg-store.ts           # Zustand store for discovered Easter eggs
    game-store.ts                 # Zustand store for active game state

  hooks/
    use-easter-egg.ts             # Hook: register and detect Easter egg triggers
    use-sticker-drag.ts           # Hook: sticker drag-and-drop logic
    use-intersection.ts           # Hook: viewport intersection for scroll animations
    use-local-storage.ts          # Hook: typed localStorage wrapper

  types/
    index.ts                      # Shared TypeScript types

content/                          # Alternative: content at project root
  blog/
    *.mdx

public/
  stickers/                       # Sticker image assets
  images/                         # Photos, project screenshots
  fonts/                          # Custom fonts if not using next/font
  og/                             # Open Graph images

mdx-components.tsx                # Required by @next/mdx (project root)
next.config.mjs                   # Next.js + MDX plugin config
postcss.config.mjs                # Tailwind PostCSS plugin
tailwind.config.ts                # Tailwind theme customization (warm palette)
```

## Patterns to Follow

### Pattern 1: Client Island in Server Page

**What:** Keep pages as Server Components, wrap only interactive sections in Client Components.

**When:** Any page that mixes static content with interactive elements (which is most pages on this site).

**Example:**

```typescript
// app/(main)/about/page.tsx — Server Component (default)
import { AnimatedSection } from '@/components/ui/animated-section'
import { FloatingPhoto } from '@/components/interactive/floating-photo'

export default function AboutPage() {
  return (
    <main>
      {/* Server-rendered content — fast, zero JS */}
      <h1>Who's this guy?</h1>
      <p>I'm Kaden, a Cornell student who...</p>

      {/* Client island — only this component ships JS */}
      <AnimatedSection>
        <FloatingPhoto src="/images/kaden.jpg" alt="Kaden" />
      </AnimatedSection>
    </main>
  )
}
```

```typescript
// components/ui/animated-section.tsx
'use client'

import { motion } from 'framer-motion'

export function AnimatedSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}
```

### Pattern 2: Lazy-Loaded Minigames

**What:** Minigames are heavy client components. Use `next/dynamic` to load them only when the user navigates to a game page, preventing any game code from appearing in the main bundle.

**When:** All minigame components.

**Example:**

```typescript
// app/games/[game]/page.tsx
import dynamic from 'next/dynamic'
import { MinigameShell } from '@/components/games/minigame-shell'

const games = {
  snake: dynamic(() => import('@/components/games/snake/snake-game'), {
    loading: () => <div className="animate-pulse">Loading game...</div>,
    ssr: false, // Games need canvas/browser APIs — no SSR
  }),
  memory: dynamic(() => import('@/components/games/memory/memory-game'), {
    loading: () => <div className="animate-pulse">Loading game...</div>,
    ssr: false,
  }),
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>
}) {
  const { game } = await params
  const GameComponent = games[game as keyof typeof games]

  if (!GameComponent) return <div>Game not found</div>

  return (
    <MinigameShell gameName={game}>
      <GameComponent />
    </MinigameShell>
  )
}

export function generateStaticParams() {
  return Object.keys(games).map((game) => ({ game }))
}
```

### Pattern 3: Zustand + localStorage for Client-Side Persistence

**What:** Use Zustand stores with `persist` middleware for data that should survive page reloads but does not need a server (sticker positions, Easter egg discoveries, user nickname).

**When:** Any user preference or local state that should persist across sessions.

**Example:**

```typescript
// stores/sticker-store.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StickerPosition {
  id: string
  x: number
  y: number
}

interface StickerStore {
  positions: StickerPosition[]
  updatePosition: (id: string, x: number, y: number) => void
  resetPositions: () => void
}

export const useStickerStore = create<StickerStore>()(
  persist(
    (set) => ({
      positions: [],
      updatePosition: (id, x, y) =>
        set((state) => ({
          positions: state.positions.some((p) => p.id === id)
            ? state.positions.map((p) => (p.id === id ? { id, x, y } : p))
            : [...state.positions, { id, x, y }],
        })),
      resetPositions: () => set({ positions: [] }),
    }),
    { name: 'sticker-positions' }
  )
)
```

### Pattern 4: MDX Blog with Exported Metadata

**What:** Use `@next/mdx` with exported metadata objects in MDX files (not frontmatter) for the blog system. This avoids extra parsing dependencies and works natively with Next.js imports.

**When:** All blog content.

**Example:**

```mdx
// content/blog/my-first-post.mdx
export const metadata = {
  title: 'My First Post',
  date: '2026-02-22',
  description: 'Welcome to my corner of the internet.',
  tags: ['personal', 'announcements'],
}

# Welcome!

This is my first blog post. I built this site with **Next.js** and it has minigames.

<Callout type="fun">
  Try finding the Easter eggs hidden around the site!
</Callout>
```

```typescript
// app/(main)/blog/page.tsx — Server Component
import { getAllPosts } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'

export default async function BlogIndex() {
  const posts = getAllPosts() // reads content dir at build time

  return (
    <div>
      <h1>Brain Dumps</h1>
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  )
}
```

### Pattern 5: Route Handler API with Zod Validation

**What:** All API routes use Zod for input validation and structured error responses.

**When:** Every Route Handler that accepts user input.

**Example:**

```typescript
// app/api/leaderboard/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ScoreSchema = z.object({
  game: z.string().min(1).max(50),
  name: z.string().min(1).max(30).trim(),
  score: z.number().int().positive().max(999999),
})

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get('game')
  const supabase = createClient()

  let query = supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10)

  if (game) query = query.eq('game', game)

  const { data, error } = await query
  if (error) return Response.json({ error: 'Failed to fetch scores' }, { status: 500 })

  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = ScoreSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }

  const supabase = createClient()
  const { error } = await supabase.from('scores').insert(result.data)

  if (error) return Response.json({ error: 'Failed to submit score' }, { status: 500 })

  return Response.json({ success: true }, { status: 201 })
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Making Entire Pages Client Components

**What:** Marking a page file with `'use client'` because it contains one interactive element.

**Why bad:** Ships the entire page as JavaScript. Kills performance, SEO, and initial load time. On this site, most content is static text and images -- it should render on the server.

**Instead:** Keep page files as Server Components. Extract interactive elements into small Client Components and import them as islands (see Pattern 1).

### Anti-Pattern 2: Fetching Leaderboard Data on Every Page Load

**What:** Using a global context or layout-level fetch to load leaderboard data for all pages.

**Why bad:** Wastes bandwidth and slows down every page for data only relevant on game pages. Most visitors may never visit games.

**Instead:** Fetch leaderboard data only in game-specific components. Use React Query or SWR for client-side caching with stale-while-revalidate, so returning to the leaderboard feels instant.

### Anti-Pattern 3: Storing Minigame Code in the Main Bundle

**What:** Importing game components directly in pages or layouts without dynamic imports.

**Why bad:** Canvas-based games with physics/rendering logic can be 50-200KB+ of JavaScript. Bundling this with the main site means everyone downloads game code even if they never play.

**Instead:** Use `next/dynamic` with `ssr: false` for all minigame components (see Pattern 2).

### Anti-Pattern 4: Using CSS-in-JS (styled-components, Emotion) with App Router

**What:** Using runtime CSS-in-JS libraries for styling.

**Why bad:** These libraries require client-side JavaScript to generate styles, which conflicts with Server Components. They add bundle size and introduce flash-of-unstyled-content. Next.js official docs recommend Tailwind CSS or CSS Modules instead.

**Instead:** Use Tailwind CSS for all styling. For complex animations, use Framer Motion (which is designed for React and works in Client Components).

### Anti-Pattern 5: One Giant Zustand Store

**What:** Putting all client state (sticker positions, Easter egg progress, game state, UI preferences) in a single store.

**Why bad:** Any state change re-renders all subscribers. localStorage serialization becomes slow. Hard to reason about.

**Instead:** Use separate stores per domain: `useStickerStore`, `useEasterEggStore`, `useGameStore`. Each persists independently.

## Scalability Considerations

| Concern | At launch (you + friends) | At 1K visitors/month | At 100K visitors/month |
|---------|---------------------------|----------------------|------------------------|
| Leaderboard | Supabase free tier, direct queries | Supabase free tier still fine, add index on (game, score) | Add server-side caching (ISR or edge cache), rate limit submissions |
| Static content | SSG at build time, Vercel CDN | Same -- Vercel CDN handles any volume for static content | Same |
| Minigame loading | Dynamic imports, loads on demand | Same | Same -- code-splitting handles this regardless of traffic |
| Images/stickers | `next/image` optimization, Vercel Image CDN | Same | Consider moving sticker assets to dedicated CDN if Vercel bandwidth is concern |
| Database | Supabase free tier (500MB, 2 GB bandwidth) | Still within free tier | Evaluate Supabase Pro or migrate to PlanetScale |
| Easter egg analytics | Optional, can skip entirely at launch | Simple count queries | Aggregate data, avoid per-visit logging |

## Suggested Build Order (Dependencies)

The architecture implies this build order based on component dependencies:

```
Phase 1: Foundation
  - Next.js project setup (App Router, TypeScript, Tailwind)
  - Root layout + global styles (warm color palette)
  - Navigation + footer
  - Basic page routes (home, about, projects, blog, links)
  Depends on: nothing (starting point)

Phase 2: Design System + Content
  - UI components (button, card, section-heading)
  - Tailwind theme (pastels, cream, peach)
  - Static content pages (about, projects, links)
  - MDX blog system setup
  Depends on: Phase 1 (layout and routing)

Phase 3: Interactive Layer
  - Framer Motion integration
  - Page transition animations
  - Scroll-triggered animations
  - Hover effects on cards
  - Sidebar widgets
  Depends on: Phase 2 (components to animate exist)

Phase 4: Floating Stickers + Easter Eggs
  - FloatingStickers component with drag
  - Zustand stores for persistence
  - EasterEggManager with trigger system
  - Toast notification system
  Depends on: Phase 3 (animation infrastructure)

Phase 5: Minigame System + Leaderboard
  - Supabase setup + schema
  - Leaderboard API routes
  - MinigameShell + ScoreSubmitForm
  - First minigame (e.g., Snake or Memory)
  - LeaderboardPanel
  Depends on: Phase 1 (routing), Phase 3 (animations)
  Note: Can be parallelized with Phase 4

Phase 6: Polish + Deploy
  - Performance optimization (Lighthouse audit)
  - SEO metadata + Open Graph images
  - Accessibility pass
  - Custom domain + Vercel deployment
  - Additional minigames
  Depends on: All previous phases
```

**Key dependency insight:** Phases 4 and 5 can be built in parallel because they share only the animation infrastructure from Phase 3 but do not depend on each other. The minigame system needs the API layer but not the sticker/Easter egg system, and vice versa.

## Sources

- Next.js App Router documentation (v16.1.6, accessed 2026-02-22) -- routing, layouts, server/client components, route handlers, MDX, CSS/Tailwind, project structure
  - https://nextjs.org/docs/app/building-your-application/routing
  - https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns (published as "Server and Client Components")
  - https://nextjs.org/docs/app/api-reference/file-conventions/route
  - https://nextjs.org/docs/app/building-your-application/configuring/mdx
  - https://nextjs.org/docs/app/getting-started/installation
  - https://nextjs.org/docs/app/getting-started/project-structure
  - https://nextjs.org/docs/app/building-your-application/styling/tailwind-css (published as CSS guide)
- Framer Motion -- animation library for React (MEDIUM confidence, from training data, not verified via docs)
- Supabase -- serverless PostgreSQL with JS client (MEDIUM confidence, from training data)
- Zustand -- lightweight state management with persist middleware (MEDIUM confidence, from training data)
- Zod -- TypeScript-first schema validation (MEDIUM confidence, from training data)
