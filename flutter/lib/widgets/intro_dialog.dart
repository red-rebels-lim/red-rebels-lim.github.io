import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

/// First-run intro (CAL-10 re-imagined as a native flow): three short pages
/// reusing the web onboarding-tour copy. Shown once — dismissing it via Skip
/// or Got it! sets [AppState.introSeenKey].
Future<void> showIntroDialog(BuildContext context) {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (_) => const IntroDialog(),
  );
}

/// One intro page: icon + tour-step title/body (existing onboarding.* keys).
typedef _IntroPage = ({IconData icon, String titleKey, String bodyKey});

class IntroDialog extends StatefulWidget {
  const IntroDialog({super.key});

  @override
  State<IntroDialog> createState() => _IntroDialogState();
}

class _IntroDialogState extends State<IntroDialog> {
  static const _pages = <_IntroPage>[
    (icon: Icons.swipe, titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Desc'),
    (icon: Icons.query_stats, titleKey: 'onboarding.step4Title', bodyKey: 'onboarding.step4Desc'),
    (
      icon: Icons.notifications_active_outlined,
      titleKey: 'onboarding.step5Title',
      bodyKey: 'onboarding.step5Desc',
    ),
  ];

  int _page = 0;

  bool get _isLast => _page == _pages.length - 1;

  Future<void> _dismiss() async {
    await context.read<AppState>().markIntroSeen();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final page = _pages[_page];

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Semantics(
        label: app.t('onboarding.tourLabel'),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: brandRed.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(page.icon, size: 30, color: brandRed),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                app.t(page.titleKey).upperNoTonos,
                textAlign: TextAlign.center,
                style: condensed(size: 18, color: theme.colorScheme.onSurface, letterSpacing: 1.5),
              ),
              const SizedBox(height: 8),
              Text(
                app.t(page.bodyKey),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: colors.mutedForeground, height: 1.5),
              ),
              const SizedBox(height: 16),
              // ── Dots indicator ──
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < _pages.length; i++)
                    Container(
                      width: i == _page ? 18 : 7,
                      height: 7,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: i == _page ? brandRed : colors.muted,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              // ── Skip ←→ Next / Got it! ──
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: _dismiss,
                    child: Text(
                      app.t('onboarding.skip'),
                      style: TextStyle(color: colors.mutedForeground),
                    ),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: brandRed,
                      shape: const StadiumBorder(),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                    onPressed: _isLast ? _dismiss : () => setState(() => _page++),
                    child: Text(
                      app.t(_isLast ? 'onboarding.finish' : 'onboarding.next').upperNoTonos,
                      style: condensed(size: 13, color: Colors.white, letterSpacing: 1.2),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
