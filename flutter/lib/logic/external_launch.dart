import 'package:url_launcher/url_launcher.dart';

/// Bridge to url_launcher — replaceable so widget tests can assert launches
/// without a real plugin behind them (settings links, news open-original).
Future<bool> Function(Uri url) openExternalUrl =
    (url) => launchUrl(url, mode: LaunchMode.externalApplication);
