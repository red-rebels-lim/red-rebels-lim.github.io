/// News article from the solosalamina.com WordPress REST API
/// (`/wp-json/wp/v2/posts?_embed=1`). Content is Greek-only and shown as-is
/// in both app languages.
library;

class NewsArticle {
  const NewsArticle({
    required this.id,
    required this.title,
    required this.excerpt,
    required this.contentHtml,
    required this.date,
    required this.link,
    this.imageUrl,
    this.categories = const [],
  });

  final int id;

  /// Plain text (tags stripped, entities decoded).
  final String title;

  /// Plain text (tags stripped, entities decoded).
  final String excerpt;

  /// Raw WordPress `content.rendered` HTML for the in-app reader.
  final String contentHtml;
  final DateTime date;

  /// Canonical post URL on solosalamina.com (open-original / share target).
  final String link;

  /// Featured image, medium_large size when available.
  final String? imageUrl;

  /// Greek category names, e.g. 'Ποδόσφαιρο'.
  final List<String> categories;

  /// Parses one post from the REST payload. Returns null when required fields
  /// are missing or malformed — callers skip such entries.
  static NewsArticle? fromJson(Map<String, dynamic> j) {
    try {
      final id = (j['id'] as num?)?.toInt();
      final title = (j['title'] as Map<String, dynamic>?)?['rendered'] as String?;
      final link = j['link'] as String?;
      // date_gmt has no offset suffix — parse as UTC, display in local time.
      final rawDate = j['date_gmt'] as String? ?? j['date'] as String?;
      if (id == null || title == null || link == null || rawDate == null) {
        return null;
      }
      final date = DateTime.tryParse('${rawDate}Z')?.toLocal() ??
          DateTime.tryParse(rawDate);
      if (date == null) return null;

      final excerpt =
          (j['excerpt'] as Map<String, dynamic>?)?['rendered'] as String? ?? '';
      final content =
          (j['content'] as Map<String, dynamic>?)?['rendered'] as String? ?? '';
      final embedded = j['_embedded'] as Map<String, dynamic>? ?? const {};

      return NewsArticle(
        id: id,
        title: htmlToPlainText(title),
        excerpt: htmlToPlainText(excerpt),
        contentHtml: content,
        date: date,
        link: link,
        imageUrl: _featuredImage(embedded),
        categories: _categories(embedded),
      );
    } catch (_) {
      return null;
    }
  }

  /// medium_large rendition when present (list thumbnails shouldn't pull the
  /// full-resolution original), else the original source_url.
  static String? _featuredImage(Map<String, dynamic> embedded) {
    final media = (embedded['wp:featuredmedia'] as List?)?.firstOrNull;
    if (media is! Map<String, dynamic>) return null;
    final sizes =
        (media['media_details'] as Map<String, dynamic>?)?['sizes'];
    if (sizes is Map<String, dynamic>) {
      final mediumLarge = sizes['medium_large'];
      if (mediumLarge is Map<String, dynamic>) {
        final url = mediumLarge['source_url'] as String?;
        if (url != null) return url;
      }
    }
    return media['source_url'] as String?;
  }

  static List<String> _categories(Map<String, dynamic> embedded) {
    final groups = embedded['wp:term'] as List? ?? const [];
    return [
      for (final group in groups)
        if (group is List)
          for (final term in group)
            if (term is Map<String, dynamic> &&
                term['taxonomy'] == 'category' &&
                term['name'] is String)
              term['name'] as String,
    ];
  }
}

/// Strips tags and decodes the entities WordPress emits in `*.rendered`
/// titles/excerpts (named subset + numeric). Not a general HTML parser — the
/// full article body is rendered from HTML by the reader instead.
String htmlToPlainText(String html) {
  var text = html
      .replaceAll(RegExp(r'<[^>]*>'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
  const named = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&hellip;': '…',
    '&ndash;': '–',
    '&mdash;': '—',
    '&laquo;': '«',
    '&raquo;': '»',
  };
  named.forEach((entity, char) => text = text.replaceAll(entity, char));
  text = text.replaceAllMapped(
    RegExp(r'&#(\d+);'),
    (m) => String.fromCharCode(int.parse(m.group(1)!)),
  );
  text = text.replaceAllMapped(
    RegExp(r'&#x([0-9a-fA-F]+);'),
    (m) => String.fromCharCode(int.parse(m.group(1)!, radix: 16)),
  );
  return text;
}
