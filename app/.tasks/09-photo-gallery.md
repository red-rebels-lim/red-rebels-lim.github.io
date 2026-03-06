# Task 09: Photo Gallery

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: Medium
## Category: Content & Media

## Description
Allow uploading or linking match-day photos. Back4App supports file storage. Fans love reliving match-day atmosphere.

## Requirements
- Photo gallery section per match or a dedicated gallery page
- Image upload to Back4App file storage (admin only) or link external URLs
- Thumbnail grid with lightbox/modal for full-size viewing
- Lazy loading for performance
- Optional: fan photo submissions (moderated)

## Technical Approach
1. **Parse Classes:**
   - `MatchPhoto` class: `matchId`, `imageFile` (Parse File), `caption`, `uploadedBy`, `approved`
2. **Components:**
   - `PhotoGallery.tsx` — thumbnail grid with lightbox
   - `PhotoUpload.tsx` — upload form (admin only initially)
   - `PhotoLightbox.tsx` — full-screen image viewer with swipe navigation
3. **Image Handling:**
   - Use Back4App file storage for uploads
   - Generate thumbnails server-side (Cloud Function) or use CSS object-fit
   - Lazy load images with `loading="lazy"` and IntersectionObserver
4. **Integration:**
   - Add gallery tab/section to EventPopover or match detail page
   - Optional: dedicated `/gallery` route

## Dependencies
- Back4App file storage
- Image compression library (optional)

## Acceptance Criteria
- [ ] Photos displayed in grid layout per match
- [ ] Lightbox/modal for full-size viewing
- [ ] Lazy loading for performance
- [ ] Admin upload capability
- [ ] Mobile-friendly swipe navigation in lightbox
