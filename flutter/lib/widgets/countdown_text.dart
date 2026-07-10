import 'dart:async';

import 'package:flutter/material.dart';

import '../theme.dart';

/// Live 'Xd Xh Xm Xs' countdown to [target] (port of useCountdown).
/// Renders nothing once the target has passed.
class CountdownText extends StatefulWidget {
  const CountdownText({super.key, required this.target, this.size = 12});

  final DateTime target;
  final double size;

  @override
  State<CountdownText> createState() => _CountdownTextState();
}

class _CountdownTextState extends State<CountdownText> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.target.difference(DateTime.now());
    if (remaining.isNegative) return const SizedBox.shrink();
    return Text(
      '${remaining.inDays}d ${remaining.inHours % 24}h '
      '${remaining.inMinutes % 60}m ${remaining.inSeconds % 60}s',
      style: TextStyle(
        color: drawAmber,
        fontSize: widget.size,
        fontWeight: FontWeight.w600,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );
  }
}
