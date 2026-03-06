# Task 10: Club News Feed

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Medium
## Category: Content & Media

## Description
Scrape or integrate news from Nea Salamina's social media or website, showing the latest club updates in-app.

## Requirements
- News feed section on the app (new page or section on calendar page)
- Source: club website, Facebook page, or Instagram
- Display: headline, thumbnail, date, snippet, link to full article
- Auto-refresh on app load
- Bilingual support if source provides both languages

## Technical Approach
1. **Data Source Options:**
   - Option A: RSS feed from club website (if available)
   - Option B: Back4App Cloud Function that scrapes club website periodically
   - Option C: Social media API integration (Facebook Graph API, Instagram Basic Display)
2. **Parse Classes:**
   - `NewsItem` class: `title`, `snippet`, `imageUrl`, `sourceUrl`, `publishedAt`, `source`
3. **Components:**
   - `NewsFeed.tsx` — scrollable list of news cards
   - `NewsCard.tsx` — individual news item with thumbnail and snippet
4. **Integration:**
   - New `/news` route or section on calendar page
   - Add "News" link to Navbar

## Dependencies
- Club website/social media availability
- Back4App Cloud Functions for scraping

## Acceptance Criteria
- [ ] News items displayed with headline, image, date, snippet
- [ ] Links open to original source
- [ ] Content refreshes on app load
- [ ] Mobile-friendly card layout
