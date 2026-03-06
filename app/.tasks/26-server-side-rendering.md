# Task 26: Server-Side Rendering or Static Generation

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: Medium
## Category: Technical / Infrastructure

## Description
Migrate to a framework like Astro or Next.js for better SEO, faster initial load, and social media link previews (Open Graph tags for match sharing).

## Requirements
- Static site generation (SSG) for calendar pages
- Open Graph meta tags for social media link previews
- Faster initial page load (no blank flash while JS loads)
- Maintain current SPA-like navigation experience
- Compatible with GitHub Pages deployment

## Technical Approach
1. **Framework Options:**
   - **Astro** — best fit for static content with React islands, deploys to GitHub Pages
   - **Next.js** — full SSR/SSG, but needs Vercel or custom server (not ideal for GitHub Pages)
   - **Vite SSG plugin** — minimal migration, generates static HTML at build time
2. **Migration Steps:**
   - Start with Vite SSG plugin (`vite-ssg`) for minimal disruption
   - Pre-render routes at build time: `/`, `/stats`, `/settings`
   - Add Open Graph meta tags per page
3. **Open Graph Tags:**
   ```html
   <meta property="og:title" content="Red Rebels Calendar 25/26" />
   <meta property="og:description" content="Nea Salamina match calendar" />
   <meta property="og:image" content="/images/og-preview.png" />
   ```

## Relevant Files
- `vite.config.ts` — build configuration
- `index.html` — HTML template
- `src/App.tsx` — router setup
- `.github/workflows/deploy.yml` — deployment pipeline

## Dependencies
- Framework selection decision
- Potential breaking changes to routing (HashRouter vs BrowserRouter)

## Acceptance Criteria
- [ ] Pages pre-rendered as static HTML
- [ ] Open Graph meta tags for social sharing
- [ ] No regression in SPA navigation
- [ ] Compatible with GitHub Pages
- [ ] Build time remains reasonable (<60s)
