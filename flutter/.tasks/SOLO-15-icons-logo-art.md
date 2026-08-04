# SOLO-15: Icon regeneration + logo art

**Status:** done with site-sourced assets (PR #115) — user-provided originals can swap in later
**Batch:** icons (`feat/solosalamina-icons`)
**Depends on:** user logo delivery
**Estimated scope:** Small/Medium

## Context

All launcher/notification/in-app logo art carries the Red Rebels mark. User supplies the
SoloSalamina logos (partnership assets). Blocks nothing else — old icons remain until then.

Asset shopping list for the user: 1024×1024 app icon, adaptive foreground (transparent
PNG), monochrome variant, white notification glyph, ~192px clear logo.

## Implementation notes

- Replace `assets/icon/{app_icon,app_icon_foreground,app_icon_monochrome,source_logo}.png`;
  run `dart run flutter_launcher_icons` (regens `res/mipmap-*`, iOS AppIcon set).
- Revisit `pubspec.yaml` `adaptive_icon_background: "#C82E04"` against the new logo.
- Manual (not generated): `res/drawable-*/ic_notification.png` (white-on-transparent),
  `assets/images/clear_logo_192.png` (settings notification preview, `settings_page.dart:676`),
  `res/drawable-nodpi/widget_preview.png`.
- KEEP: `widget_crest_club.png` + team crests (club identity, not app brand), `stadium.webp`.

## Acceptance criteria

- [ ] New launcher icon on both platforms (incl. Android adaptive + monochrome/themed)
- [ ] Notification glyph + settings preview logo swapped
- [ ] analyze + tests green
