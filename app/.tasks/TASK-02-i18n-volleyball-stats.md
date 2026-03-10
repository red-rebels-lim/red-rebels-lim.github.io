# TASK-02: i18n Keys for Volleyball Stats

**Status:** done
**Depends on:** -
**Estimated scope:** Small

## Objective

Add translation keys for volleyball statistics to both `src/i18n/en.json` and `src/i18n/el.json`. These will be used by the volleyball stat components and the sport selector tabs.

## Implementation

### File: `src/i18n/en.json`

Add to the `"stats"` section:

```json
{
  "stats": {
    // ... existing keys unchanged ...

    // Sport selector tabs
    "mensFootball": "Men's Football",
    "mensVolleyball": "Men's Volleyball",
    "womensVolleyball": "Women's Volleyball",

    // Volleyball-specific stats
    "setsWon": "Sets Won",
    "setsLost": "Sets Lost",
    "setWinPct": "Set Win %",
    "winRate": "Win Rate",
    "setBreakdown": "Set Breakdown",
    "threeZero": "3-0",
    "threeOne": "3-1",
    "threeTwo": "3-2",
    "zeroThree": "0-3",
    "oneThree": "1-3",
    "twoThree": "2-3",
    "winsCount": "Wins",
    "lossesCount": "Losses",
    "totalPoints": "Points",
    "seasonSummary": "Season Summary",
    "viewFull": "View Full",
    "performanceSplit": "Performance Split",
    "last5Matches": "Last 5 Matches"
  }
}
```

### File: `src/i18n/el.json`

Add matching Greek translations:

```json
{
  "stats": {
    // ... existing keys unchanged ...

    "mensFootball": "Ποδόσφαιρο Ανδρών",
    "mensVolleyball": "Βόλεϊ Ανδρών",
    "womensVolleyball": "Βόλεϊ Γυναικών",

    "setsWon": "Σετ Κερδισμένα",
    "setsLost": "Σετ Χαμένα",
    "setWinPct": "Ποσοστό Σετ",
    "winRate": "Ποσοστό Νικών",
    "setBreakdown": "Ανάλυση Σετ",
    "threeZero": "3-0",
    "threeOne": "3-1",
    "threeTwo": "3-2",
    "zeroThree": "0-3",
    "oneThree": "1-3",
    "twoThree": "2-3",
    "winsCount": "Νίκες",
    "lossesCount": "Ήττες",
    "totalPoints": "Πόντοι",
    "seasonSummary": "Περίληψη Σεζόν",
    "viewFull": "Πλήρης Προβολή",
    "performanceSplit": "Ανάλυση Απόδοσης",
    "last5Matches": "Τελευταίοι 5 Αγώνες"
  }
}
```

## Notes

- The `"threeZero"` etc. keys are intentionally short since they appear as labels next to set counts (e.g. "3-0  5 wins")
- Some existing keys can be reused: `"matches"`, `"wins"`, `"losses"`, `"home"`, `"away"`, `"opponent"`, `"topScorers"`, `"nextMatch"`, `"recentForm"`, `"headToHead"`, `"streaks"`, `"records"`, `"noData"`

## Acceptance Criteria

- [ ] All new keys added to both `en.json` and `el.json`
- [ ] No existing keys modified or removed
- [ ] JSON files remain valid (no syntax errors)
- [ ] Keys follow existing naming conventions (camelCase)
