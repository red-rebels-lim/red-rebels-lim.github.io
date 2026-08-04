/// Ports of app/src/data/constants.ts and month-config.ts.
library;

import '../models/events.dart';

const teamName = 'Νέα Σαλαμίνα';

/// Origin serving the live data feeds (events.json, players.json) and player
/// portraits. TODO(sunset): re-point once data hosting moves off the old
/// red-rebels.com Worker (SoloSalamina pivot — web app is being sunset).
const siteBaseUrl = 'https://red-rebels.com';
const seasonStartYear = 2026;
const seasonEndYear = 2027;
const seasonLabel = '26/27';

const ownLogoAsset = 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp';

// Season window is July -> June: pre-season friendlies (July/Aug) belong to
// the season they precede (stakeholder decision 2026-07-17).
const monthOrder = <String>[
  'july', 'august', 'september', 'october', 'november', 'december',
  'january', 'february', 'march', 'april', 'may', 'june',
];

class MonthInfo {
  const MonthInfo({required this.year, required this.month, required this.daysInMonth, required this.startDay});

  final int year;

  /// Dart month number, 1–12.
  final int month;
  final int daysInMonth;

  /// Weekday offset of day 1, Monday-based (0 = Monday).
  final int startDay;
}

MonthInfo monthInfo(String monthName) {
  const monthNumbers = {
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
  };
  final month = monthNumbers[monthName]!;
  final year = month >= 7 ? seasonStartYear : seasonEndYear;
  final daysInMonth = DateTime(year, month + 1, 0).day;
  final startDay = DateTime(year, month, 1).weekday - 1;
  return MonthInfo(year: year, month: month, daysInMonth: daysInMonth, startDay: startDay);
}

/// Concrete kickoff [DateTime] for an event in a season month
/// (midnight when the time is TBD/unparseable).
DateTime eventDateTime(String monthName, SportEvent event) {
  final info = monthInfo(monthName);
  var hour = 0, minute = 0;
  if (event.time.contains(':')) {
    final parts = event.time.split(':');
    hour = int.tryParse(parts[0]) ?? 0;
    minute = int.tryParse(parts[1]) ?? 0;
  }
  return DateTime(info.year, info.month, event.day, hour, minute);
}

/// Greek team names (as stored in events.json) → English i18n keys
/// under fotmob.teams. Port of lib/translate.ts GREEK_TO_TEAM_KEY.
const greekToTeamKey = <String, String>{
  // Football
  'ΝΕΑ ΣΑΛΑΜΙΝΑ': 'Nea Salamis',
  'Νέα Σαλαμίνα': 'Nea Salamis',
  'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ': 'Doxa Katokopia',
  'ΗΡΑΚΛΗΣ ΓΕΡΟΛΑΚΚΟΥ': 'Iraklis Gerolakkou',
  'ΔΙΓΕΝΗΣ ΑΚΡΙΤΑΣ ΜΟΡΦΟΥ': 'Digenis Morphou',
  'Π.Ο. ΑΧΥΡΩΝΑΣ ΟΝΗΣΙΛΟΣ': 'PO Achyronas-Onisilos',
  'ΜΕΑΠ ΠΕΡΑ ΧΩΡΙΟΥ ΝΗΣΟΥ': 'MEAP Nisou',
  'ΧΑΛΚΑΝΟΡΑΣ ΙΔΑΛΙΟΥ': 'Chalkanoras Idaliou',
  'ΑΣΙΛ ΛΥΣΗΣ': 'ASIL Lysi',
  'ΑΕΖ ΖΑΚΑΚΙΟΥ': 'AEZ Zakakiou',
  'ΣΠΑΡΤΑΚΟΣ ΚΙΤΙΟΥ': 'Spartakos Kitiou',
  'ΕΘΝΙΚΟΣ ΛΑΤΣΙΩΝ': 'Ethnikos Latsion',
  'ΠΑΕΕΚ ΚΕΡΥΝΕΙΑΣ': 'PAEEK',
  'ΚΑΡΜΙΩΤΙΣΣΑ ΠΟΛΕΜΙΔΙΩΝ': 'Karmiotissa Pano Polemidion',
  'ΑΛΣ ΟΜΟΝΟΙΑ 29 Μ': 'Omonia 29 Maiou',
  'ΟΜΟΝΟΙΑ 29ΗΣ ΜΑΪΟΥ': 'Omonia 29 Maiou',
  'ΕΝΠ': 'Enosis Neon Paralimni',
  // Football — 26/27 First Division opponents (CFA draw name forms, news/53562)
  'ΟΛΥΜΠΙΑΚΟΣ ΛΕΥΚΩΣΙΑΣ': 'Olympiakos Nicosia',
  'ΑΕΛ ΛΕΜΕΣΟΥ': 'AEL',
  'ΑΝΟΡΘΩΣΗ ΑΜΜΟΧΩΣΤΟΥ': 'Anorthosis',
  'ΑΠΟΕΛ ΛΕΥΚΩΣΙΑΣ': 'APOEL',
  'ΑΠΟΛΛΩΝΑΣ ΛΕΜΕΣΟΥ': 'Apollon Limassol',
  'ΠΑΦΟΣ FC': 'Pafos FC',
  'ΠΑΦΟΣ F.C.': 'Pafos FC',
  'ΟΜΟΝΟΙΑ ΑΡΑΔΙΠΠΟΥ': 'Omonia Aradippou',
  'ΑΡΗΣ ΛΕΜΕΣΟΥ': 'Aris Limassol',
  'ΟΜΟΝΟΙΑ ΛΕΥΚΩΣΙΑΣ': 'Omonia',
  'KRASAVA Ε.Ν. Y': 'Krasava Ypsona',
  'KRASAVA Ε.Ν.Y.': 'Krasava Ypsona',
  // Friendlies (foreign clubs stored Latin, as in the club's announcement)
  'AKS 1947 BUSKO-ZDROJ': 'AKS 1947 Busko-Zdroj',
  'KORONA KIELCE': 'Korona Kielce',
  'RADOMIAK RADOM': 'Radomiak Radom',
  'TERMALICA': 'Termalica',
  'ΑΟΑΝ ΑΓΙΑΣ ΝΑΠΑΣ': 'Ayia Napa',
  'ΑΠΕΑ ΑΚΡΩΤΗΡΙΟΥ': 'APEA Akrotiri',
  // Volleyball (men)
  'ΑΝΟΡΘΩΣΙΣ': 'Anorthosis',
  'ΟΜΟΝΟΙΑ': 'Omonia',
  'OMONOIA': 'Omonia',
  'ΚΟΥΡΗΣ ΕΡΗΜΗΣ': 'Kouris Erimis',
  'ΠΑΦΙΑΚΟΣ': 'Pafiakos',
  'ΑΕΚ ΛΑΡΝΑΚΑΣ': 'AEK Larnaca',
  'ΑΕΛ': 'AEL',
  // Volleyball (women)
  'ΑΝΟΡΘΩΣΙΣ (Γ)': 'Anorthosis (W)',
  'ΑΕΛ (Γ)': 'AEL (W)',
  'ΑΕΚ ΛΑΡΝΑΚΑΣ (Γ)': 'AEK Larnaca (W)',
  'ΑΠΟΛΛΩΝ (Γ)': 'Apollon (W)',
  'ΟΛΥΜΠΙΑΔΑ Ν. (Γ)': 'Olympiada N. (W)',
  'LEMESOS VOLLEYBALL (Γ)': 'Lemesos Volleyball (W)',
  // Other
  'ΚΡΑΣΑΒΑ ΥΨΩΝΑ': 'Krasava Ypsona',
  'ΑΕ ΚΑΡΑΒΑ': 'AE Karava',
  'ΑΝΑΓΕΝΝΗΣΗ': 'Anagennisi',
  'ΑΠΟΕΛ': 'APOEL',
};

/// Greek venue names → English i18n keys under fotmob.venue.
const greekToVenueKey = <String, String>{
  'Stadio Vitex Ammochostos Epistrofi': 'Stadio Vitex Ammochostos Epistrofi',
  'Αγίου Αθανασίου': 'Agiou Athanasiou',
  'Σπύρος Κυπριανού': 'Spyros Kyprianou',
  'Γυμνάσιο Αγίου Νεοφύτου': 'Gymnasio Agiou Neofytou',
  'Ελευθερία': 'Eleftheria',
  'ΓΗΠΕΔΟ ΟΛΥΜΠΙΑΔΑΣ ΛΥΜΠΙΩΝ': 'Olympiada Lympion',
  'Κίτιον': 'Kition',
  'Θεμιστόκλειο': 'Themistokleio',
  'Νεάπολη-Επιστροφή': 'Neapoli-Epistrofi',
  'Λευκόθεο': 'Lefkotheo',
  'Αφροδίτη': 'Afroditi',
  'Σωτήρειον': 'Sotireion',
  'Απόλλων': 'Apollon Stadium',
  'Δερύνειας': 'Deryneias',
  'Λύκειο Πολεμιδιών': 'Lykeio Polemidion',
  'ΓΗΠΕΔΟ "ΚΕΡΥΝΕΙΑ-ΕΠΙΣΤΡΟΦΗ"': 'Keryneia-Epistrofi',
  'ΚΟΙΝΟΤΙΚΟ ΓΗΠΕΔΟ ΠΑΝΩ ΠΟΛΕΜΙΔΙΩΝ': 'Pano Polemidion Community Stadium',
};

/// Meeting titles (events data `opponent` free text) → i18n keys under
/// meetings.* (web translate.ts MEETING_TITLE_TO_KEY parity).
const meetingTitleToKey = <String, String>{
  'First Official Training 2026/27': 'firstTraining2627',
};

const sportEmoji = <String, String>{
  'football-men': '⚽',
  'volleyball-men': '🏐',
  'volleyball-women': '🏐',
  'meeting': '📋',
};
