import { describe, it, expect } from 'vitest';
import { parseMatchRefs, parseMatchStats } from './dataproject-enrichment.js';

// ── Minimal HTML fixtures ──────────────────────────────────────────────────────

function buildMatchListHtml(matches: Array<{
  mId: string; cid: string; pid: string;
  date: string; homeTeam: string; awayTeam: string;
}>) {
  // Mirrors the real dataproject round-grid structure:
  // span[id$="Label2"] wrapped in a <p onclick="MatchStatistics...">, with a
  // sibling LB_DataOra span for the date and an HF_MatchDatetime hidden input as fallback.
  const cards = matches.map((m, i) => `
    <div class="match-wrapper-${i}">
      <input id="match${i}_HF_MatchDatetime" value="${m.date}" />
      <span id="match${i}_LB_DataOra">${m.date}</span>
      <p onclick="javascript:window.location='MatchStatistics.aspx?mID=${m.mId}&amp;ID=42&amp;CID=${m.cid}&amp;PID=${m.pid}&amp;type=LegList';">
        <span id="match${i}_Label2" style="font-weight:normal;">${m.homeTeam}</span>
      </p>
      <span id="match${i}_Label4" style="font-weight:bold;">${m.awayTeam}</span>
    </div>
  `).join('\n');
  return `<html><body>${cards}</body></html>`;
}

function buildStatsHtml(opts: {
  setScores: string;        // e.g. "25/14 25/22 19/25 25/21"
  homePlayers: Array<{ name: string; pts: string }>;
  awayPlayers: Array<{ name: string; pts: string }>;
}) {
  const homePlayers = opts.homePlayers.map(p => `
    <tr>
      <td><p class="p_margin_2"><span id="PlayerName" style="font-weight:bold;">${p.name}</span></p></td>
      <td><p class="p_margin_2"><span id="PointsTot">${p.pts}</span></p></td>
    </tr>
  `).join('');

  const awayPlayers = opts.awayPlayers.map(p => `
    <tr>
      <td><p class="p_margin_2"><span id="PlayerName" style="font-weight:bold;">${p.name}</span></p></td>
      <td><p class="p_margin_2"><span id="PointsTot">${p.pts}</span></p></td>
    </tr>
  `).join('');

  return `
    <html><body>
      <p>${opts.setScores}</p>
      <div id="Content_Main_ctl17_RP_MatchStats_RPL_MatchStats_0">
        <span id="Content_Main_ctl17_RP_MatchStats_TeamName_Home_0">NEA SALAMINA Famagusta</span>
        <table id="RG_HomeTeam"><tbody>${homePlayers}</tbody></table>
        <span id="Content_Main_ctl17_RP_MatchStats_TeamName_Guest_0">PAFIAKOS Pafos</span>
        <table id="RG_GuestTeam"><tbody>${awayPlayers}</tbody></table>
      </div>
    </body></html>
  `;
}

// ── parseMatchRefs ─────────────────────────────────────────────────────────────

describe('parseMatchRefs', () => {
  it('returns refs for NEA SALAMINA home match', () => {
    const html = buildMatchListHtml([
      { mId: '1138', cid: '130', pid: '71', date: '17/10/2025 - 20:30', homeTeam: 'NEA SALAMINA Famagusta', awayTeam: 'PAFIAKOS Pafos' },
    ]);
    const refs = parseMatchRefs(html, 'volleyball-men');
    expect(refs).toHaveLength(1);
    expect(refs[0].mId).toBe('1138');
    expect(refs[0].day).toBe(17);
    expect(refs[0].monthNum).toBe(10);
    expect(refs[0].homeTeam).toBe('NEA SALAMINA Famagusta');
    expect(refs[0].awayTeam).toBe('PAFIAKOS Pafos');
    expect(refs[0].isHome).toBe(true);
    expect(refs[0].sport).toBe('volleyball-men');
  });

  it('returns refs for NEA SALAMINA away match', () => {
    const html = buildMatchListHtml([
      { mId: '1152', cid: '130', pid: '71', date: '31/10/2025 - 20:00', homeTeam: 'OMONIA Nicosia', awayTeam: 'NEA SALAMINA Famagusta' },
    ]);
    const refs = parseMatchRefs(html, 'volleyball-men');
    expect(refs).toHaveLength(1);
    expect(refs[0].isHome).toBe(false);
    expect(refs[0].day).toBe(31);
    expect(refs[0].monthNum).toBe(10);
  });

  it('skips matches that do not involve NEA SALAMINA', () => {
    const html = buildMatchListHtml([
      { mId: '1139', cid: '130', pid: '71', date: '17/10/2025 - 20:00', homeTeam: 'OMONIA Nicosia', awayTeam: 'ANAGENNISIS DHERYNIAS' },
    ]);
    const refs = parseMatchRefs(html, 'volleyball-men');
    expect(refs).toHaveLength(0);
  });

  it('deduplicates by mId', () => {
    const html = buildMatchListHtml([
      { mId: '1138', cid: '130', pid: '71', date: '17/10/2025 - 20:30', homeTeam: 'NEA SALAMINA Famagusta', awayTeam: 'PAFIAKOS Pafos' },
      { mId: '1138', cid: '130', pid: '71', date: '17/10/2025 - 20:30', homeTeam: 'NEA SALAMINA Famagusta', awayTeam: 'PAFIAKOS Pafos' },
    ]);
    const refs = parseMatchRefs(html, 'volleyball-men');
    expect(refs).toHaveLength(1);
  });

  it('returns empty array if no matches found', () => {
    const refs = parseMatchRefs('<html><body></body></html>', 'volleyball-men');
    expect(refs).toHaveLength(0);
  });

  it('finds NEA SALAMINA matches in round-grid (LBL_HomeTeamName pattern)', () => {
    // Mirrors the round-grid section that uses LBL_HomeTeamName / LBL_GuestTeamName
    const html = `<html><body>
      <div>
        <span id="ctl_RADLIST_Legs_ctrl1_RADLIST_Matches_ctrl0_LB_DataOra">07/11/2025 - 20:30</span>
        <p onclick="javascript:window.location='MatchStatistics.aspx?mID=1169&amp;ID=42&amp;CID=130&amp;PID=71&amp;type=LegList';">
          <span id="ctl_RADLIST_Legs_ctrl1_RADLIST_Matches_ctrl0_LBL_HomeTeamName" style="font-weight:bold;">NEA SALAMINA Famagusta</span>
        </p>
        <span id="ctl_RADLIST_Legs_ctrl1_RADLIST_Matches_ctrl0_LBL_GuestTeamName">ANORTHOSIS Famagusta</span>
      </div>
    </body></html>`;
    const refs = parseMatchRefs(html, 'volleyball-men');
    expect(refs).toHaveLength(1);
    expect(refs[0].mId).toBe('1169');
    expect(refs[0].day).toBe(7);
    expect(refs[0].monthNum).toBe(11);
    expect(refs[0].homeTeam).toBe('NEA SALAMINA Famagusta');
    expect(refs[0].awayTeam).toBe('ANORTHOSIS Famagusta');
    expect(refs[0].isHome).toBe(true);
  });

  it('deduplicates across Label2 and LBL_HomeTeamName patterns', () => {
    // Same mId appearing in both sections should result in only one ref
    const html = `<html><body>
      <div>
        <span id="match0_LB_DataOra">17/10/2025 - 20:30</span>
        <p onclick="javascript:window.location='MatchStatistics.aspx?mID=1138&amp;ID=42&amp;CID=130&amp;PID=71&amp;type=LegList';">
          <span id="match0_Label2">NEA SALAMINA Famagusta</span>
        </p>
        <span id="match0_Label4">PAFIAKOS Pafos</span>
      </div>
      <div>
        <span id="ctl_RADLIST_Legs_ctrl0_RADLIST_Matches_ctrl0_LB_DataOra">17/10/2025 - 20:30</span>
        <p onclick="javascript:window.location='MatchStatistics.aspx?mID=1138&amp;ID=42&amp;CID=130&amp;PID=71&amp;type=LegList';">
          <span id="ctl_RADLIST_Legs_ctrl0_RADLIST_Matches_ctrl0_LBL_HomeTeamName">NEA SALAMINA Famagusta</span>
        </p>
        <span id="ctl_RADLIST_Legs_ctrl0_RADLIST_Matches_ctrl0_LBL_GuestTeamName">PAFIAKOS Pafos</span>
      </div>
    </body></html>`;
    const refs = parseMatchRefs(html, 'volleyball-men');
    expect(refs).toHaveLength(1);
    expect(refs[0].mId).toBe('1138');
  });
});

// ── parseMatchStats ────────────────────────────────────────────────────────────

describe('parseMatchStats — home match', () => {
  const html = buildStatsHtml({
    setScores: '14/25 22/25 25/19 21/25',
    homePlayers: [
      { name: 'Peemuller Richard', pts: '19' },
      { name: 'Topuzliev Simeon', pts: '12' },
      { name: 'Chrysostomou Anninos', pts: '5' },
    ],
    awayPlayers: [
      { name: 'Melgarejo Brian', pts: '13' },
      { name: 'Dijoud Vianney', pts: '9' },
    ],
  });

  it('parses set scores correctly', () => {
    const { sets } = parseMatchStats(html, true);
    expect(sets).toHaveLength(4);
    expect(sets[0]).toEqual({ home: 14, away: 25 });
    expect(sets[1]).toEqual({ home: 22, away: 25 });
    expect(sets[2]).toEqual({ home: 25, away: 19 });
    expect(sets[3]).toEqual({ home: 21, away: 25 });
  });

  it('assigns home team scorers as team=home (NEA SALAMINA is home)', () => {
    const { vbScorers } = parseMatchStats(html, true);
    const homeScorers = vbScorers.filter(s => s.team === 'home');
    expect(homeScorers).toHaveLength(3);
    expect(homeScorers[0].name).toBe('Peemuller Richard');
    expect(homeScorers[0].points).toBe(19);
  });

  it('assigns guest team scorers as team=away (NEA SALAMINA is home)', () => {
    const { vbScorers } = parseMatchStats(html, true);
    const awayScorers = vbScorers.filter(s => s.team === 'away');
    expect(awayScorers).toHaveLength(2);
    expect(awayScorers[0].name).toBe('Melgarejo Brian');
  });

  it('sorts scorers by points descending within each team', () => {
    const { vbScorers } = parseMatchStats(html, true);
    const homeScorers = vbScorers.filter(s => s.team === 'home');
    expect(homeScorers[0].points).toBeGreaterThanOrEqual(homeScorers[1].points);
  });
});

describe('parseMatchStats — away match', () => {
  const html = buildStatsHtml({
    setScores: '25/18 25/22 22/25 22/25 15/12',
    homePlayers: [
      { name: 'OMONIA Player A', pts: '8' },
    ],
    awayPlayers: [
      { name: 'Chrysostomou Anninos', pts: '15' },
      { name: 'Peemuller Richard', pts: '11' },
    ],
  });

  it('flips team assignments when NEA SALAMINA is away', () => {
    const { vbScorers } = parseMatchStats(html, false);
    // RG_GuestTeam (NEA SALAMINA) should be team='home'
    const neaScorers = vbScorers.filter(s => s.team === 'home');
    expect(neaScorers).toHaveLength(2);
    expect(neaScorers[0].name).toBe('Chrysostomou Anninos');
    // RG_HomeTeam (opponent) should be team='away'
    const opponentScorers = vbScorers.filter(s => s.team === 'away');
    expect(opponentScorers).toHaveLength(1);
    expect(opponentScorers[0].name).toBe('OMONIA Player A');
  });

  it('parses 5-set match scores', () => {
    const { sets } = parseMatchStats(html, false);
    expect(sets).toHaveLength(5);
    expect(sets[4]).toEqual({ home: 15, away: 12 });
  });
});

describe('parseMatchStats — empty / missing data', () => {
  it('returns empty arrays for a page with no stats', () => {
    const { sets, vbScorers } = parseMatchStats('<html><body></body></html>', true);
    expect(sets).toHaveLength(0);
    expect(vbScorers).toHaveLength(0);
  });

  it('excludes TOTALS rows', () => {
    const html = buildStatsHtml({
      setScores: '25/20',
      homePlayers: [
        { name: 'Player A', pts: '10' },
        { name: 'TOTALS', pts: '10' },
      ],
      awayPlayers: [],
    });
    const { vbScorers } = parseMatchStats(html, true);
    expect(vbScorers.every(s => s.name !== 'TOTALS')).toBe(true);
  });

  it('excludes players with 0 or non-numeric points', () => {
    const html = buildStatsHtml({
      setScores: '25/20',
      homePlayers: [
        { name: 'Active Player', pts: '5' },
        { name: 'Libero Player', pts: '-' },
        { name: 'Zero Player', pts: '0' },
      ],
      awayPlayers: [],
    });
    const { vbScorers } = parseMatchStats(html, true);
    expect(vbScorers).toHaveLength(1);
    expect(vbScorers[0].name).toBe('Active Player');
  });
});
