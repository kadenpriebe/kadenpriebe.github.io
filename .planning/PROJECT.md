# Kaden Priebe — Personal Website

## What This Is

A personal website for Kaden Priebe — Cornell student, researcher, content creator, and builder — that feels like walking into someone's creative space rather than reading a resume. Warm, colorful, and interactive, with minigames (and a real leaderboard), Easter eggs, floating stickers, and personality baked into every corner. Built in Next.js, deployed on a custom domain.

## Core Value

When someone lands on the site, they should think "this person is fun" — personality-first, memorable, and genuinely enjoyable to explore.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Minimalist, clean design (white background, black text, high readability — Lillian Lee & wyattsell.com energy)
- [ ] Interactive elements throughout (floating stickers, sidebar widgets, micro-animations, hover effects)
- [ ] Minigames scattered across the site (mix of arcade, brain teasers, site-integrated)
- [ ] Real leaderboard backend for minigame scores (persistent, anyone can submit)
- [ ] Fun, casual section names (conversational tone — not "About" / "Projects" / "Blog")
- [ ] Easter eggs and hidden surprises throughout
- [ ] Authentic, conversational writing voice
- [ ] "About me" section — who Kaden is, the story, photo
- [ ] Projects showcase with stubs for future work
- [ ] Blog/writing section for articles and reflections
- [ ] Links/socials section connecting to other platforms
- [ ] Research projects featured alongside creative work
- [ ] Custom domain deployment

### Out of Scope

- YouTube/social media as primary focus — it exists but the site isn't mainly about that
- Mobile app — web only
- E-commerce or monetization — this is a personal site
- CMS or admin panel — content managed through code/markdown

## Context

**Who Kaden is:**
- Cornell University student
- Researcher (lab work, academic projects)
- Content creator (YouTube, social media — growing but not the main feature)
- Builder/developer (side projects, tools)

**Reference sites and what to steal from each:**
- **wyattsell.com** — Clean layout, fun interactive sidebar elements, developer portfolio with personality
- **cs.cornell.edu/home/llee/** — Minimalist academic aesthetic (black on white), hyperlinks with character, authentic feel, Easter eggs hidden in links, witty and self-aware tone
- **mehai.dev** — Clickable floating stickers in margins, tooltips on hover, playful layout with serious content underneath
- **aliabdaal.com** — Friendly approachable vibe, generous spacing, inviting design (Note: borrowing the spacing and vibe, but using a minimalist black-on-white palette)

**Content status:**
- Research projects: has real work to showcase
- Creative work: has content to feature
- Software/apps and ML/AI work: stubs for now, will fill in as projects develop
- Blog: section ready, content to come

## Constraints

- **Tech stack**: Next.js / React — chosen for interactive capabilities and ecosystem
- **Hosting**: Custom domain (Vercel likely, for Next.js compatibility)
- **Backend**: Needs real database for leaderboard (serverless-friendly — Supabase, PlanetScale, or similar)
- **Performance**: Interactive elements can't tank page load — progressive enhancement
- **Accessibility**: Fun doesn't mean unusable — maintain core accessibility

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js / React | Best fit for highly interactive site with both static content and dynamic features (leaderboard) | — Pending |
| Minimalist Light aesthetic | Matches Lillian Lee and wyattsell.com; clean, high-readability, and content-focused | — Pending |
| Real leaderboard backend | User wants persistent, multi-user scores — not just local storage | — Pending |
| Casual section naming | Conversational names like "who's this guy?" instead of "About" reinforce personality | — Pending |
| Stubs for future projects | Site grows with Kaden — placeholder sections signal ambition and invite return visits | — Pending |

---
*Last updated: 2026-02-22 after initialization*
