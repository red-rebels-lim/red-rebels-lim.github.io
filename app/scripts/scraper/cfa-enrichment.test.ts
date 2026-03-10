import { describe, it, expect } from 'vitest';
import { parseCfaGameDetails, parseCfaFixtureRefs } from './cfa-enrichment.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Minimal HTML snippet that mirrors the real CFA game_details page structure,
 * based on https://www.cfa.com.cy/Gr/game_details/66686780/66700841
 * (Nea Salamina 4-1 ΠΑΕΕΚ, Nea Salamina is home team).
 */
const HOME_MATCH_HTML = `
<html><body>
<h2 class="fpHeader1"><span>ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ - ΠΑΕΕΚ ΚΕΡΥΝΕΙΑΣ</span></h2>

<!-- Lineup section -->
<table>
  <tbody>
    <tr><th colspan="2">Αρχικές Ενδεκάδες</th></tr>
    <tr>
      <td>
        <table><tbody>
          <tr><td align="right"><a href="/Gr/player/77/1">ALBERTO VARO</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/2">ΠΑΝΑΓΙΩΤΗΣ ΑΡΤΥΜΑΤΑΣ</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/3">ΓΕΩΡΓΙΟΣ ΧΡΙΣΤΟΔΟΥΛΟΥ</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/4">MANUEL ARTILES</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/5">FILIPE CORREIA</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/6">ALEJANDRO GUTIERREZ</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/7">ΑΝΤΡΕΑΣ ΔΗΜΗΤΡΙΟΥ</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/8">ADULAI DJALO</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/9">ΚΩΝΣΤΑΝΤΙΝΟΣ ΗΛΙΑ</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/10">ΚΩΣΤΑΣ ΧΑΡΑΛΑΜΠΟΥΣ</a></td><td></td></tr>
          <tr><td align="right"><a href="/Gr/player/77/11">ΓΙΩΡΓΟΣ ΒΙΚΤΩΡΟΣ</a></td><td></td></tr>
        </tbody></table>
      </td>
      <td>
        <table><tbody>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/21">ΔΗΜΗΤΡΙΟΣ ΚΑΤΣΙΜΗΤΡΟΣ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/22">ΑΝΤΩΝΗΣ ΑΡΝΑΟΥΤΗΣ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/23">ΘΕΟΧΑΡΗΣ ΠΟΖΑΤΖΙΔΗΣ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/24">ANDONIS FOTI</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/25">ΧΑΡΑΛΑΜΠΟΣ ΚΑΤΤΙΡΤΖΗΣ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/26">ΙΩΑΝΝΗΣ ΑΒΡΑΜΙΔΗΣ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/27">AGUSTIN PRINCIPE</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/28">MARKO DOBRIJEVIC</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/29">ΧΡΙΣΤΟΣ ΠΑΣΙΑΡΔΗΣ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/30">ΚΩΝΣΤΑΝΤΙΝΟΣ ΒΕΝΙΖΕΛΟΥ</a></td></tr>
          <tr><td><img src="/images/spacer.gif"></td><td><a href="/Gr/player/77/31">ΔΗΜΗΤΡΙΟΣ ΠΙΤΣΩΤΗΣ</a></td></tr>
        </tbody></table>
      </td>
    </tr>
  </tbody>
</table>

<!-- Subs table -->
<table>
  <tbody>
    <tr><th colspan="9">Αλλαγές</th></tr>
    <tr>
      <td><b>Μέσα</b></td><td></td><td><b>Έξω</b></td><td></td>
      <td><b>Λεπτό</b></td><td></td><td><b>Μέσα</b></td><td></td><td><b>Έξω</b></td>
    </tr>
    <!-- away sub at 46' -->
    <tr>
      <td>&nbsp;</td><td></td><td>&nbsp;</td><td></td>
      <td>46'</td><td></td>
      <td><a href="/Gr/player/77/50">ΚΑΡΑΓΙΑΝΝΗΣ</a></td><td></td>
      <td><a href="/Gr/player/77/26">ΙΩΑΝΝΗΣ ΑΒΡΑΜΙΔΗΣ</a></td>
    </tr>
    <!-- home sub at 68' -->
    <tr>
      <td><a href="/Gr/player/77/60">ΑΝΘΙΜΟΥ</a></td><td></td>
      <td><a href="/Gr/player/77/6">ALEJANDRO GUTIERREZ</a></td><td></td>
      <td>68'</td><td></td>
      <td>&nbsp;</td><td></td><td>&nbsp;</td>
    </tr>
  </tbody>
</table>

<!-- Events table (goals + cards) -->
<table>
  <tbody>
    <tr><td colspan="3"><!--lblscorers--><img src="/images/ball.gif"></td></tr>
    <!-- home goals -->
    <tr>
      <td class="tableOddRow" align="right"><a href="/Gr/player/77/8">ADULAI DJALO</a> &nbsp;</td>
      <td class="tableOddRow" align="center">9'</td>
      <td class="tableOddRow">&nbsp;</td>
    </tr>
    <tr>
      <td class="tableEvenRow" align="right"><a href="/Gr/player/77/5">FILIPE CORREIA</a> &nbsp;</td>
      <td class="tableEvenRow" align="center">21'</td>
      <td class="tableEvenRow">&nbsp;</td>
    </tr>
    <!-- away goal -->
    <tr>
      <td class="tableOddRow" align="right">&nbsp;</td>
      <td class="tableOddRow" align="center">26'</td>
      <td class="tableOddRow">&nbsp;<a href="/Gr/player/77/27">AGUSTIN PRINCIPE</a></td>
    </tr>
    <!-- home goals cont. -->
    <tr>
      <td class="tableEvenRow" align="right"><a href="/Gr/player/77/5">FILIPE CORREIA</a> &nbsp;</td>
      <td class="tableEvenRow" align="center">30'</td>
      <td class="tableEvenRow">&nbsp;</td>
    </tr>
    <tr>
      <td class="tableOddRow" align="right"><a href="/Gr/player/77/3">ΓΕΩΡΓΙΟΣ ΧΡΙΣΤΟΔΟΥΛΟΥ</a> &nbsp;</td>
      <td class="tableOddRow" align="center">45'</td>
      <td class="tableOddRow">&nbsp;</td>
    </tr>
    <tr><td colspan="3"><img src="/images/spacer.gif" width="20" height="15"></td></tr>
    <tr><td colspan="3"><!--lblyellows--><img src="/images/yellow.gif"></td></tr>
    <!-- home yellow -->
    <tr>
      <td class="tableOddRow"><a href="/Gr/player/77/10">ΚΩΣΤΑΣ ΧΑΡΑΛΑΜΠΟΥΣ</a>&nbsp;</td>
      <td class="tableOddRow" align="center">36'</td>
      <td class="tableOddRow">&nbsp;</td>
    </tr>
    <!-- away yellow -->
    <tr>
      <td class="tableEvenRow">&nbsp;</td>
      <td class="tableEvenRow" align="center">45'</td>
      <td class="tableEvenRow">&nbsp;<a href="/Gr/player/77/29">ΧΡΙΣΤΟΣ ΠΑΣΙΑΡΔΗΣ</a></td>
    </tr>
    <tr><td colspan="3"><img src="/images/spacer.gif" width="20" height="15"></td></tr>
    <tr><td colspan="3"><!--lblreds--><img src="/images/red.gif"></td></tr>
    <!-- away red card -->
    <tr>
      <td class="tableOddRow">&nbsp;</td>
      <td class="tableOddRow" align="center">89'</td>
      <td class="tableOddRow">&nbsp;<a href="/Gr/player/77/28">MARKO DOBRIJEVIC</a></td>
    </tr>
    <tr><td colspan="3"><img src="/images/spacer.gif" width="20" height="15"></td></tr>
  </tbody>
</table>
</body></html>
`;

/**
 * Same match from the AWAY perspective — swap home/away column assignments.
 * isHomeTeam=false means Nea Salamina is the CFA away (right-column) team.
 */

// ── parseCfaGameDetails – home match ─────────────────────────────────────────

describe('parseCfaGameDetails – home match (isHomeTeam=true)', () => {
  const result = parseCfaGameDetails(HOME_MATCH_HTML, true);

  it('extracts home lineup (11 players)', () => {
    expect(result.lineup.home).toHaveLength(11);
    expect(result.lineup.home[0].name).toBe('ALBERTO VARO');
    expect(result.lineup.home[10].name).toBe('ΓΙΩΡΓΟΣ ΒΙΚΤΩΡΟΣ');
  });

  it('extracts away lineup (11 players)', () => {
    expect(result.lineup.away).toHaveLength(11);
    expect(result.lineup.away[0].name).toBe('ΔΗΜΗΤΡΙΟΣ ΚΑΤΣΙΜΗΤΡΟΣ');
  });

  it('extracts home goals as team=home', () => {
    const homeGoals = result.scorers.filter(s => s.team === 'home');
    expect(homeGoals).toHaveLength(4);
    expect(homeGoals[0]).toMatchObject({ name: 'ADULAI DJALO', minute: '9', team: 'home' });
    expect(homeGoals[1]).toMatchObject({ name: 'FILIPE CORREIA', minute: '21', team: 'home' });
  });

  it('extracts away goal as team=away', () => {
    const awayGoals = result.scorers.filter(s => s.team === 'away');
    expect(awayGoals).toHaveLength(1);
    expect(awayGoals[0]).toMatchObject({ name: 'AGUSTIN PRINCIPE', minute: '26', team: 'away' });
  });

  it('extracts home yellow card', () => {
    const yellow = result.bookings.find(b => b.card === 'yellow' && b.team === 'home');
    expect(yellow).toMatchObject({ name: 'ΚΩΣΤΑΣ ΧΑΡΑΛΑΜΠΟΥΣ', minute: '36', card: 'yellow' });
  });

  it('extracts away yellow card', () => {
    const yellow = result.bookings.find(b => b.card === 'yellow' && b.team === 'away');
    expect(yellow).toMatchObject({ name: 'ΧΡΙΣΤΟΣ ΠΑΣΙΑΡΔΗΣ', minute: '45', card: 'yellow' });
  });

  it('extracts away red card', () => {
    const red = result.bookings.find(b => b.card === 'red');
    expect(red).toMatchObject({ name: 'MARKO DOBRIJEVIC', minute: '89', card: 'red', team: 'away' });
  });

  it('extracts home substitution (home sub at 68\')', () => {
    const sub = result.subs.find(s => s.team === 'home');
    expect(sub).toMatchObject({ playerOn: 'ΑΝΘΙΜΟΥ', playerOff: 'ALEJANDRO GUTIERREZ', minute: '68', team: 'home' });
  });

  it('extracts away substitution (away sub at 46\')', () => {
    const sub = result.subs.find(s => s.team === 'away');
    expect(sub).toMatchObject({ playerOn: 'ΚΑΡΑΓΙΑΝΝΗΣ', playerOff: 'ΙΩΑΝΝΗΣ ΑΒΡΑΜΙΔΗΣ', minute: '46', team: 'away' });
  });
});

// ── parseCfaGameDetails – away match (perspective flipped) ───────────────────

describe('parseCfaGameDetails – away match (isHomeTeam=false)', () => {
  // Same HTML but now we tell the parser Nea Salamina is the CFA away team.
  // So CFA-home side → our 'away', CFA-away side → our 'home'.
  const result = parseCfaGameDetails(HOME_MATCH_HTML, false);

  it('flips lineup: CFA-home players become our away lineup', () => {
    expect(result.lineup.away[0].name).toBe('ALBERTO VARO');
  });

  it('flips lineup: CFA-away players become our home lineup', () => {
    expect(result.lineup.home[0].name).toBe('ΔΗΜΗΤΡΙΟΣ ΚΑΤΣΙΜΗΤΡΟΣ');
  });

  it('flips scorers: CFA-home goals become team=away', () => {
    const adulaiGoal = result.scorers.find(s => s.name === 'ADULAI DJALO');
    expect(adulaiGoal?.team).toBe('away');
  });

  it('flips scorers: CFA-away goal becomes team=home', () => {
    const awayGoal = result.scorers.find(s => s.name === 'AGUSTIN PRINCIPE');
    expect(awayGoal?.team).toBe('home');
  });

  it('flips bookings: CFA-home yellow becomes team=away', () => {
    const yellow = result.bookings.find(b => b.name === 'ΚΩΣΤΑΣ ΧΑΡΑΛΑΜΠΟΥΣ');
    expect(yellow?.team).toBe('away');
  });

  it('flips subs: CFA-home sub becomes team=away', () => {
    const sub = result.subs.find(s => s.playerOn === 'ΑΝΘΙΜΟΥ');
    expect(sub?.team).toBe('away');
  });
});

// ── parseCfaGameDetails – no events ──────────────────────────────────────────

describe('parseCfaGameDetails – empty match', () => {
  const EMPTY_HTML = `
    <html><body>
    <table><tbody>
      <tr><th colspan="2">Αρχικές Ενδεκάδες</th></tr>
      <tr><td></td><td></td></tr>
    </tbody></table>
    </body></html>
  `;
  const result = parseCfaGameDetails(EMPTY_HTML, true);

  it('returns empty scorers', () => expect(result.scorers).toEqual([]));
  it('returns empty bookings', () => expect(result.bookings).toEqual([]));
  it('returns empty subs', () => expect(result.subs).toEqual([]));
  it('returns empty lineups', () => {
    expect(result.lineup.home).toEqual([]);
    expect(result.lineup.away).toEqual([]);
  });
});

// ── parseCfaFixtureRefs ───────────────────────────────────────────────────────

describe('parseCfaFixtureRefs', () => {
  const FIXTURE_HTML = `
    <html><body>
    <!-- <h5 class="fixures-game-date">28-Σεπτεμβρίου-2025</h5> -->
    <div class="mob-fixtures row">
      <div><div class="col-xs-7">ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ</div></div>
      <div><span>2-1</span></div>
      <div><div class="col-xs-7">ΑΠΟΛΛΩΝΑΣ ΛΕΜΕΣΟΥ</div></div>
      <div></div>
    </div>
    <!-- <div style="float: right;"><a class="btn btn-primary" href="/Gr/game_details/65409603/66500001">></a></div> -->
    <!-- <div style="float: right;"><a class="btn btn-primary" href="/Gr/game_details/65409603/66500001">></a></div> -->

    <!-- <h5 class="fixures-game-date">05-Οκτωβρίου-2025</h5> -->
    <div class="mob-fixtures row">
      <div><div class="col-xs-7">ΑΠΟΛΛΩΝΑΣ ΛΕΜΕΣΟΥ</div></div>
      <div><span>1-0</span></div>
      <div><div class="col-xs-7">ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ</div></div>
      <div></div>
    </div>
    <!-- <div style="float: right;"><a class="btn btn-primary" href="/Gr/game_details/65409603/66500002">></a></div> -->
    </body></html>
  `;

  const refs = parseCfaFixtureRefs(FIXTURE_HTML);

  it('returns 2 refs for Nea Salamina matches', () => {
    expect(refs).toHaveLength(2);
  });

  it('correctly identifies home match', () => {
    const homeRef = refs.find(r => r.day === 28 && r.monthNum === 9);
    expect(homeRef).toBeDefined();
    expect(homeRef?.isHome).toBe(true);
    expect(homeRef?.gameId).toBe('66500001');
    expect(homeRef?.leagueId).toBe('65409603');
  });

  it('correctly identifies away match', () => {
    const awayRef = refs.find(r => r.day === 5 && r.monthNum === 10);
    expect(awayRef).toBeDefined();
    expect(awayRef?.isHome).toBe(false);
    expect(awayRef?.gameId).toBe('66500002');
  });

  it('returns empty array when no Nea Salamina matches', () => {
    const html = `
      <!-- <h5 class="fixures-game-date">01-Σεπτεμβρίου-2025</h5> -->
      <div class="mob-fixtures row">
        <div><div class="col-xs-7">ΑΠΟΕΛ</div></div>
        <div><span>2-0</span></div>
        <div><div class="col-xs-7">ΟΜΟΝΟΙΑ</div></div>
        <div></div>
      </div>
      <!-- <div style="float: right;"><a href="/Gr/game_details/123/456">></a></div> -->
    `;
    expect(parseCfaFixtureRefs(html)).toEqual([]);
  });
});
