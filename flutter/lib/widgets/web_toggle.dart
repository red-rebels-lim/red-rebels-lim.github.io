import 'package:flutter/material.dart';

import '../theme.dart';

/// iOS-style toggle matching the web `SettingsToggle` (51×31 track, red when
/// on, white 27px thumb; half opacity when disabled). Null [onChanged]
/// disables it, mirroring Material Switch semantics.
class WebToggle extends StatelessWidget {
  const WebToggle({super.key, required this.checked, this.onChanged});

  final bool checked;
  final VoidCallback? onChanged;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      toggled: checked,
      button: true,
      enabled: onChanged != null,
      child: Opacity(
        opacity: onChanged == null ? 0.5 : 1,
        child: GestureDetector(
          onTap: onChanged,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 51,
            height: 31,
            padding: const EdgeInsets.all(2),
            alignment: checked ? Alignment.centerRight : Alignment.centerLeft,
            decoration: BoxDecoration(
              color: checked ? accentRed : (dark ? twSlate700 : twSlate200),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Container(
              width: 27,
              height: 27,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [BoxShadow(color: Color(0x22000000), blurRadius: 2)],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
