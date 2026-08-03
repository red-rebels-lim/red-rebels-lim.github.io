#!/usr/bin/env node
// Emits a QA dataset (TEST-PLAN §4.5) as events.json for on-device injection.
// Mirrors integration_test/qa_datasets.dart — keep the two in sync.
//   node tool/qa/gen_dataset.mjs <full-season|cup-penalties|volleyball|unknown-team|upcoming-soon|no-upcoming|empty>

const SEASON_START_YEAR = 2026; // keep in step with lib/data/constants.dart
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const UNKNOWN = 'ΤΕΣΤ ΓΙΟΥΝΑΪΤΕΝΤ';

const ourLineup = () => ['ΤΕΣΤ ΤΕΡΜΑΤΟΦΥΛΑΚΑΣ','ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ','ΑΜΥΝΤΙΚΟΣ ΔΥΟ','ΑΜΥΝΤΙΚΟΣ ΤΡΙΑ','ΑΜΥΝΤΙΚΟΣ ΤΕΣΣΕΡΑ','ΜΕΣΟΣ ΕΝΑ','ΜΕΣΟΣ ΔΥΟ','ΜΕΣΟΣ ΤΡΙΑ','ΕΠΙΘΕΤΙΚΟΣ ΕΝΑ','ΕΠΙΘΕΤΙΚΟΣ ΔΥΟ','ΕΠΙΘΕΤΙΚΟΣ ΤΡΙΑ']
  .map((name, i) => ({ name, number: i + 1 }));
const theirLineup = () => [{name:'OPPONENT ONE',number:1},{name:'OPPONENT TWO',number:7},{name:'OPPONENT THREE',number:9}];

const fullSeason = () => ({
  september: [
    { day:5, sport:'football-men', location:'home', opponent:'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ', time:'19:00',
      venue:'Stadio Vitex Ammochostos Epistrofi', logo:'images/team_logos/ΔΟΞΑ_ΚΑΤΩΚΟΠΙΑΣ.webp',
      status:'played', score:'3-1', competition:'league', matchday:1,
      scorers:[
        {name:'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ',minute:'23',team:'home'},
        {name:'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ  (Πέναλτι)',minute:'58',team:'home',type:'pen'},
        {name:'ΤΕΣΤ ΣΚΟΡΕΡ',minute:'77',team:'home'},
        {name:'OPPONENT TWO',minute:'89',team:'away'}],
      bookings:[
        {name:'ΜΕΣΟΣ ΕΝΑ',minute:'31',team:'home',card:'yellow'},
        {name:'OPPONENT THREE',minute:'66',team:'away',card:'red'}],
      lineup:{home:ourLineup(),away:theirLineup()},
      subs:[{playerOn:'ΤΕΣΤ ΑΛΛΑΓΗ',playerOff:'ΜΕΣΟΣ ΤΡΙΑ',minute:'60',team:'home'}],
      reportEN:'A commanding home win sealed by a second-half surge.',
      reportEL:'Καθαρή εντός έδρας νίκη με ξέσπασμα στο δεύτερο ημίχρονο.' },
    { day:12, sport:'football-men', location:'away', opponent:'ΑΕΛ', time:'18:00',
      logo:'images/team_logos/ΑΕΛ.webp', status:'played', score:'2-0', competition:'league', matchday:2,
      scorers:[{name:'OPPONENT ONE',minute:'15',team:'home'},{name:'OPPONENT TWO',minute:'52',team:'home'}],
      lineup:{home:theirLineup(),away:ourLineup()},
      subs:[{playerOn:'ΤΕΣΤ ΑΛΛΑΓΗ',playerOff:'ΕΠΙΘΕΤΙΚΟΣ ΕΝΑ',minute:'70',team:'away'}] },
  ],
  october: [
    { day:3, sport:'football-men', location:'away', opponent:'ΑΠΟΕΛ', time:'20:00',
      status:'played', score:'2-2', competition:'cup', matchday:1, penalties:'1-3',
      scorers:[
        {name:'ΤΕΣΤ ΣΚΟΡΕΡ',minute:'44',team:'away'},
        {name:'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ',minute:'90+2',team:'away'},
        {name:'OPPONENT ONE',minute:'12',team:'home'},
        {name:'OPPONENT THREE',minute:'75',team:'home'}] },
    { day:10, sport:'volleyball-men', location:'home', opponent:'ΑΝΟΡΘΩΣΙΣ', time:'19:30',
      status:'played', score:'3-1', competition:'league', matchday:1,
      sets:[{home:25,away:20},{home:23,away:25},{home:25,away:18},{home:25,away:22}],
      vbScorers:[{name:'ΤΕΣΤ ΠΟΝΤΕΡ',points:18,team:'home'},{name:'ΤΕΣΤ ΚΕΝΤΡΙΚΟΣ',points:12,team:'home'}] },
    { day:17, sport:'volleyball-women', location:'away', opponent:'ΑΕΛ (Γ)', time:'18:30',
      status:'played', score:'2-3', competition:'league', matchday:2,
      sets:[{home:25,away:23},{home:20,away:25},{home:25,away:21},{home:22,away:25},{home:13,away:15}] },
  ],
  november: [
    { day:7, sport:'football-men', location:'home', opponent:UNKNOWN, time:'',
      status:'upcoming', competition:'league', matchday:9, dateTbd:true },
    { day:21, sport:'football-men', location:'away', opponent:'ΑΕΚ ΛΑΡΝΑΚΑΣ', time:'15:00',
      venue:'AEK Arena', status:'upcoming', competition:'league', matchday:11 },
  ],
});

// July..December belong to the season start year, January..June to end year.
const seasonMonth = (d) => {
  const name = MONTHS[d.getMonth()];
  const inStartHalf = d.getMonth() + 1 >= 7;
  const expectedYear = inStartHalf ? SEASON_START_YEAR : SEASON_START_YEAR + 1;
  return d.getFullYear() === expectedYear ? name : null;
};

const upcomingSoon = () => {
  const out = {};
  const add = (offsetMs, event) => {
    const dt = new Date(Date.now() + offsetMs);
    const month = seasonMonth(dt);
    if (!month) return;
    (out[month] ??= []).push({
      ...event,
      day: dt.getDate(),
      time: `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
    });
  };
  add(40*60e3,   {sport:'football-men',  location:'home', opponent:'ΑΕΛ',        status:'upcoming', competition:'league', matchday:3});
  add(5*3600e3,  {sport:'volleyball-men',location:'away', opponent:'ΑΝΟΡΘΩΣΙΣ', status:'upcoming', competition:'league', matchday:4});
  add(3*86400e3, {sport:'football-men',  location:'home', opponent:'ΑΠΟΕΛ',      status:'upcoming', competition:'league', matchday:5});
  return out;
};

const only = (data, keep) => Object.fromEntries(
  Object.entries(data)
    .map(([m, evs]) => [m, evs.filter(keep)])
    .filter(([, evs]) => evs.length));

const name = process.argv[2] ?? 'full-season';
const data = {
  'full-season': fullSeason,
  'cup-penalties': () => only(fullSeason(), (e) => e.competition === 'cup'),
  'volleyball':    () => only(fullSeason(), (e) => e.sport.startsWith('volleyball')),
  'unknown-team':  () => only(fullSeason(), (e) => e.opponent === UNKNOWN),
  'no-upcoming':   () => only(fullSeason(), (e) => e.status === 'played'),
  'upcoming-soon': upcomingSoon,
  'empty': () => ({ september: [] }), // fully-empty payloads fall back to the bundled feed
}[name];
if (!data) { console.error(`unknown dataset: ${name}`); process.exit(2); }
process.stdout.write(JSON.stringify(data(), null, 2));
