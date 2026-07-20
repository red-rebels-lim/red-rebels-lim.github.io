import 'package:flutter/material.dart';

import '../theme.dart';

/// Web pill: `px-4 py-2 rounded-full text-xs font-bold tracking-wide`;
/// active `bg-primary text-white`, inactive slate-200 / #1a1a1a.
/// Shared by the stats and squad sport selectors.
class SportPill extends StatelessWidget {
  const SportPill({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: selected ? colors.primary : (dark ? const Color(0xFF1A1A1A) : twSlate200),
      borderRadius: colors.br(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: colors.br(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.3,
              color: selected ? Colors.white : (dark ? twSlate400 : twSlate600),
            ),
          ),
        ),
      ),
    );
  }
}
