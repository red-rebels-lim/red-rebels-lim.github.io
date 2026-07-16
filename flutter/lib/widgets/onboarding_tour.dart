import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

/// First-run welcome tour, ported from the web `OnboardingTour.tsx` /
/// `useOnboarding.ts` (QA-26 / register row FUN-02, decided 2026-07-14).
///
/// Seven steps in a centered dialog over a black/60 overlay — the web's
/// step data carries `targetSelector`s but its component never anchors or
/// spotlights anything, so neither does this port. Step counter, title,
/// description; Skip bottom-left, Back from step 2, Next / "Got it!" on the
/// last step; tapping the overlay skips. Completing or skipping sets the
/// app's existing seen flag ([AppState.introSeenKey]).
///
/// All copy comes from the `onboarding.step{1..7}Title/Desc` i18n keys —
/// byte-copies of the web JSONs, so EN and EL match the PWA verbatim.
const onboardingStepCount = 7;

Future<void> showOnboardingTour(BuildContext context) {
  final app = context.read<AppState>();
  return showDialog<void>(
    context: context,
    // Web: clicking the overlay skips (completes) the tour.
    barrierDismissible: true,
    barrierColor: Colors.black.withValues(alpha: 0.6),
    builder: (context) => const _TourDialog(),
  ).then((_) => app.markIntroSeen());
}

class _TourDialog extends StatefulWidget {
  const _TourDialog();

  @override
  State<_TourDialog> createState() => _TourDialogState();
}

class _TourDialogState extends State<_TourDialog> {
  int _step = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final isFirst = _step == 0;
    final isLast = _step == onboardingStepCount - 1;
    final n = _step + 1;

    return Dialog(
      backgroundColor: dark ? colors.card : Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20),
      shape: RoundedRectangleBorder(
        // Web: `border-2 border-primary-border-emphasis rounded-2xl`.
        side: BorderSide(color: brandRed.withValues(alpha: dark ? 0.5 : 0.4), width: 2),
        borderRadius: colors.br(16),
      ),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 384),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Step counter: `text-sm text-primary/80 font-semibold`.
            Text(
              '$n / $onboardingStepCount',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: colors.primary.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              app.t('onboarding.step${n}Title'),
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.foreground),
            ),
            const SizedBox(height: 8),
            Text(
              app.t('onboarding.step${n}Desc'),
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: colors.foreground.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                InkWell(
                  onTap: () => Navigator.of(context).pop(),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      app.t('onboarding.skip'),
                      style: TextStyle(
                        fontSize: 14,
                        color: colors.foreground.withValues(alpha: 0.6),
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                if (!isFirst) ...[
                  OutlinedButton(
                    onPressed: () => setState(() => _step--),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: colors.foreground,
                      side: BorderSide(color: brandRed.withValues(alpha: 0.25)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: colors.br(8)),
                    ),
                    child: Text(
                      app.t('onboarding.prev'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                // Web: red gradient with a primary-glow shadow.
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [brandRed, Color(0xFFB91C1C)],
                    ),
                    border: Border.all(color: brandRed),
                    borderRadius: colors.br(8),
                    boxShadow: [
                      BoxShadow(
                        color: brandRed.withValues(alpha: 0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: InkWell(
                    borderRadius: colors.br(8),
                    onTap: () {
                      if (isLast) {
                        Navigator.of(context).pop();
                      } else {
                        setState(() => _step++);
                      }
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text(
                        app.t(isLast ? 'onboarding.finish' : 'onboarding.next'),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
