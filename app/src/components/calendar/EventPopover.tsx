import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getMatchResult } from '@/lib/stats';
import { TEAM_NAME } from '@/data/constants';
import type { CalendarEvent, Scorer, Booking, LineupPlayer, Substitution, VolleyballSet, VolleyballScorer } from '@/types/events';
import { MatchReport } from './MatchReport';

interface EventPopoverProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

// ── Small presentational helpers ──────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-[rgba(224,37,32,0.3)]" />
      <span className="text-xs font-black text-[#E02520] uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-[rgba(224,37,32,0.3)]" />
    </div>
  );
}

function YellowCard() {
  return <span className="inline-block w-3 h-4 bg-yellow-400 rounded-[2px] shrink-0" aria-label="yellow card" />;
}

function RedCard() {
  return <span className="inline-block w-3 h-4 bg-red-600 rounded-[2px] shrink-0" aria-label="red card" />;
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// ── Goalscorers two-column layout ─────────────────────────────────────────────

function ScorersSection({ scorers, penLabel, ogLabel, isHome }: {
  scorers: Scorer[];
  penLabel: string;
  ogLabel: string;
  isHome: boolean;
}) {
  // isLeft: whether a scorer appears in the left column (match home team side)
  const isLeft = (s: Scorer) => isHome ? s.team === 'home' : s.team === 'away';
  const sorted = [...scorers].sort((a, b) => parseInt(a.minute) - parseInt(b.minute));

  return (
    <div className="space-y-1">
      {sorted.map((s, i) => {
        const onLeft = isLeft(s);
        return (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 text-sm">
            <div className="flex items-center justify-end gap-1 min-w-0">
              {onLeft ? (
                <>
                  {s.type === 'pen' && <span className="text-xs text-yellow-400 shrink-0">({penLabel})</span>}
                  {s.type === 'og' && <span className="text-xs text-red-400 shrink-0">({ogLabel})</span>}
                  <span className="text-foreground font-medium text-right">{s.name}</span>
                  <span className="text-base leading-none shrink-0">⚽</span>
                </>
              ) : null}
            </div>
            <div className="text-center text-xs text-muted-foreground shrink-0 w-10">{s.minute}'</div>
            <div className="flex items-center gap-1 min-w-0">
              {!onLeft ? (
                <>
                  <span className="text-base leading-none shrink-0">⚽</span>
                  <span className="text-foreground font-medium">{s.name}</span>
                  {s.type === 'pen' && <span className="text-xs text-yellow-400 shrink-0">({penLabel})</span>}
                  {s.type === 'og' && <span className="text-xs text-red-400 shrink-0">({ogLabel})</span>}
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Bookings two-column layout ────────────────────────────────────────────────

function BookingsSection({ bookings, isHome }: { bookings: Booking[]; isHome: boolean }) {
  const isLeft = (b: Booking) => isHome ? b.team === 'home' : b.team === 'away';
  const sorted = [...bookings].sort((a, b) => parseInt(a.minute) - parseInt(b.minute));

  return (
    <div className="space-y-1">
      {sorted.map((b, i) => {
        const onLeft = isLeft(b);
        return (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 text-sm">
            <div className="flex items-center justify-end gap-1.5 min-w-0">
              {onLeft ? (
                <>
                  <span className="text-foreground font-medium text-right">{b.name}</span>
                  {b.card === 'yellow' ? <YellowCard /> : <RedCard />}
                </>
              ) : null}
            </div>
            <div className="text-center text-xs text-muted-foreground shrink-0 w-10">{b.minute}'</div>
            <div className="flex items-center gap-1.5 min-w-0">
              {!onLeft ? (
                <>
                  {b.card === 'yellow' ? <YellowCard /> : <RedCard />}
                  <span className="text-foreground font-medium">{b.name}</span>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Lineups two-column layout ─────────────────────────────────────────────────

function LineupsSection({
  lineup,
  homeTeam,
  awayTeam,
  isHome,
}: {
  lineup: { home: LineupPlayer[]; away: LineupPlayer[] };
  homeTeam: string;
  awayTeam: string;
  isHome: boolean;
}) {
  // left = match home team players, right = match away team players
  const left  = isHome ? lineup.home : lineup.away;
  const right = isHome ? lineup.away : lineup.home;
  const rows = Math.max(left.length, right.length);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <span className="text-xs font-bold text-muted-foreground truncate">{homeTeam}</span>
        <span className="text-xs font-bold text-muted-foreground truncate text-right">{awayTeam}</span>
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: rows }).map((_, i) => {
          const h = left[i];
          const a = right[i];
          return (
            <div key={i} className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 text-xs">
                {h ? (
                  <>
                    {h.number !== undefined && (
                      <span className="text-muted-foreground w-5 shrink-0 text-right">{h.number}.</span>
                    )}
                    <span className="text-foreground font-medium truncate">{h.name}</span>
                    {h.position && (
                      <span className="text-muted-foreground/60 shrink-0">{h.position}</span>
                    )}
                  </>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-1 text-xs">
                {a ? (
                  <>
                    {a.position && (
                      <span className="text-muted-foreground/60 shrink-0">{a.position}</span>
                    )}
                    <span className="text-foreground font-medium truncate">{a.name}</span>
                    {a.number !== undefined && (
                      <span className="text-muted-foreground w-5 shrink-0">{a.number}.</span>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Substitutions two-column layout ──────────────────────────────────────────

function SubstitutionsSection({ subs, isHome }: { subs: Substitution[]; isHome: boolean }) {
  const isLeft = (s: Substitution) => isHome ? s.team === 'home' : s.team === 'away';
  const sorted = [...subs].sort((a, b) => parseInt(a.minute) - parseInt(b.minute));

  return (
    <div className="space-y-1">
      {sorted.map((s, i) => {
        const onLeft = isLeft(s);
        return (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 text-xs">
            <div className="flex items-center justify-end gap-1 min-w-0">
              {onLeft ? (
                <>
                  <span className="text-muted-foreground truncate">{s.playerOff}</span>
                  <span className="text-red-400 font-bold shrink-0">↓</span>
                  <span className="text-foreground font-medium truncate">{s.playerOn}</span>
                  <span className="text-green-400 font-bold shrink-0">↑</span>
                </>
              ) : null}
            </div>
            <div className="text-center text-xs text-muted-foreground shrink-0 w-10">{s.minute}'</div>
            <div className="flex items-center gap-1 min-w-0">
              {!onLeft ? (
                <>
                  <span className="text-green-400 font-bold shrink-0">↑</span>
                  <span className="text-foreground font-medium truncate">{s.playerOn}</span>
                  <span className="text-red-400 font-bold shrink-0">↓</span>
                  <span className="text-muted-foreground truncate">{s.playerOff}</span>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Volleyball sets layout ────────────────────────────────────────────────────

function SetsSection({ sets, setLabel }: { sets: VolleyballSet[]; setLabel: string }) {
  return (
    <div className="space-y-1">
      {sets.map((set, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 text-sm">
          <div className="text-right font-bold text-foreground">{set.home}</div>
          <div className="text-center text-xs text-muted-foreground shrink-0 w-14">{setLabel} {i + 1}</div>
          <div className="text-left font-bold text-foreground">{set.away}</div>
        </div>
      ))}
    </div>
  );
}

// ── Volleyball top scorers layout ─────────────────────────────────────────────

function VbScorersSection({ scorers, isHome }: { scorers: VolleyballScorer[]; isHome: boolean }) {
  const isLeft = (s: VolleyballScorer) => isHome ? s.team === 'home' : s.team === 'away';
  const sorted = [...scorers].sort((a, b) => b.points - a.points);
  return (
    <div className="space-y-1">
      {sorted.map((s, i) => {
        const onLeft = isLeft(s);
        return (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 text-sm">
            <div className="flex items-center justify-end gap-1 min-w-0">
              {onLeft && (
                <>
                  <span className="text-foreground font-medium text-right truncate">{s.name}</span>
                  <span className="text-base leading-none shrink-0">🏐</span>
                </>
              )}
            </div>
            <div className="text-center text-xs text-muted-foreground shrink-0 w-10">{s.points}pts</div>
            <div className="flex items-center gap-1 min-w-0">
              {!onLeft && (
                <>
                  <span className="text-base leading-none shrink-0">🏐</span>
                  <span className="text-foreground font-medium truncate">{s.name}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EventPopover({ event, open, onClose }: EventPopoverProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!event) return null;

  const result = event.status === 'played'
    ? getMatchResult(event.score, event.location, event.penalties)
    : null;

  const isHome = event.location === 'home';
  const homeTeam = isHome ? TEAM_NAME : event.title.replace(` vs ${TEAM_NAME}`, '');
  const ownLogo = event.sport === 'volleyball-men' || event.sport === 'volleyball-women'
    ? '/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ_ΒΟΛΛΕΥ.webp'
    : '/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp';
  const awayTeam = isHome ? event.title.replace(`${TEAM_NAME} vs `, '') : TEAM_NAME;
  const opponent = isHome ? awayTeam : homeTeam;

  const subtitleParts = event.subtitle.split(' - ');
  const rawTime = subtitleParts[1];
  const hasValidTime = rawTime && rawTime.includes(':');
  const time = hasValidTime ? rawTime : t('popover.tbd');

  const resultBadge = event.status === 'played'
    ? result === 'win'
      ? { bg: 'bg-[#1a6b1a]', border: 'border-[#2d8a2d]', text: t('popover.win'), textColor: 'text-green-300' }
      : result === 'draw'
        ? { bg: 'bg-[#6b5a00]', border: 'border-[#8a7500]', text: t('popover.draw'), textColor: 'text-yellow-300' }
        : { bg: 'bg-[#6b1a1a]', border: 'border-[#8a2020]', text: t('popover.loss'), textColor: 'text-red-300' }
    : { bg: 'bg-[#2a1a1a]', border: 'border-[#E02520]/40', text: t('popover.upcoming'), textColor: 'text-red-300' };

  function handleShare() {
    const text = `${homeTeam} ${event!.score ?? ''} ${awayTeam}`;
    if (navigator.share) {
      navigator.share({ title: text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text} ${window.location.href}`).catch(() => {});
    }
  }

  // ── Meeting layout ──────────────────────────────────────────────────────────
  if (event.isMeeting) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-gradient-to-br from-[#1a0f0f] to-[#0a1810] border-3 border-[rgba(224,37,32,0.6)] rounded-3xl max-w-lg shadow-[0_25px_50px_rgba(0,0,0,0.8),0_0_100px_rgba(224,37,32,0.3)]">
          <DialogTitle className="sr-only">{event.title}</DialogTitle>
          <DialogDescription className="sr-only">{event.subtitle}</DialogDescription>
          <div className="text-center py-4">
            <div className="text-6xl mb-4">📅</div>
            <div className="text-2xl font-extrabold text-foreground mb-4">{event.title}</div>
            <div className="bg-white/5 border-2 border-[rgba(224,37,32,0.2)] rounded-xl p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t('popover.time')}
              </div>
              <div className="text-lg font-bold text-foreground">⏰ {time}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Match layout ────────────────────────────────────────────────────────────
  const isFootballPlayed = event.sport === 'football-men' && event.status === 'played';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#1a0f0f] to-[#0a0a0a] border border-[rgba(224,37,32,0.5)] rounded-3xl max-w-lg sm:max-w-2xl shadow-[0_25px_50px_rgba(0,0,0,0.9),0_0_80px_rgba(224,37,32,0.2)] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{event.title}</DialogTitle>
        <DialogDescription className="sr-only">{event.subtitle}</DialogDescription>

        {/* ── Top bar ── */}
        <div className="flex items-center justify-center px-5 pt-5 pb-3">
          <span className="text-xs font-black text-white/60 uppercase tracking-widest">
            {isFootballPlayed ? t('popover.matchResult') : event.title}
          </span>
        </div>

        <div className="px-5 pb-5 space-y-0">

          {/* ── Teams + result badge ── */}
          <div className="flex items-center justify-between gap-3 py-2">
            {/* Home team */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {isHome ? (
                  <img
                    src={ownLogo}
                    alt={TEAM_NAME}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : event.logo ? (
                  <img
                    src={`/${event.logo}`}
                    alt={opponent}
                    loading="lazy"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-2xl">🛡️</span>
                )}
              </div>
              <span className="text-xs font-bold text-foreground text-center leading-tight truncate w-full text-center">
                {homeTeam}
              </span>
            </div>

            {/* VS + result badge */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span className="text-lg font-black text-white/40 uppercase tracking-widest">VS</span>
              <span className={`${resultBadge.bg} border ${resultBadge.border} ${resultBadge.textColor} text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full`}>
                {resultBadge.text}
              </span>
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {!isHome ? (
                  <img
                    src={ownLogo}
                    alt={TEAM_NAME}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : event.logo ? (
                  <img
                    src={`/${event.logo}`}
                    alt={opponent}
                    loading="lazy"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-2xl">🛡️</span>
                )}
              </div>
              <span className="text-xs font-bold text-foreground text-center leading-tight truncate w-full text-center">
                {awayTeam}
              </span>
            </div>
          </div>

          {/* ── Score ── */}
          {event.status === 'played' && event.score && (
            <div className="text-center py-2">
              <div className="text-5xl font-black text-yellow-300 tracking-tight">
                {event.score.replace('-', ' - ')} <span className="text-4xl">{event.sport === 'volleyball-men' || event.sport === 'volleyball-women' ? '🏐' : '⚽'}</span>
              </div>
              {event.penalties && (
                <div className="text-sm font-bold text-yellow-300/70 mt-1">
                  {t('calendar.penalties')}: {event.penalties}
                </div>
              )}
            </div>
          )}

          {/* ── Competition / matchday line ── */}
          {isFootballPlayed && (
            <div className="text-center">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                {t('popover.competition')}
                {event.matchday !== undefined && (
                  <> · {t('popover.matchday')} {event.matchday}</>
                )}
              </span>
            </div>
          )}

          {/* ── Info chips + share ── */}
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {event.duration && <InfoChip icon="🕐" label={event.duration} />}
            <InfoChip icon={isHome ? '🏠' : '✈️'} label={isHome ? t('popover.homeGround') : t('popover.awayGround')} />
            {event.venue && <InfoChip icon="📍" label={event.venue} />}
            {!isFootballPlayed && hasValidTime && <InfoChip icon="⏰" label={time} />}
            {event.competition === 'cup' && (
              <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-400">
                🏆 {t('calendar.cup')}
              </span>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              aria-label={t('popover.shareMatch')}
            >
              <span>⤴</span>
            </button>
          </div>

          {/* ── Goalscorers ── */}
          {event.scorers && event.scorers.length > 0 && (
            <>
              <SectionHeading label={t('popover.goalscorers')} />
              <ScorersSection
                scorers={event.scorers}
                penLabel={t('popover.pen')}
                ogLabel={t('popover.og')}
                isHome={isHome}
              />
            </>
          )}

          {/* ── Bookings ── */}
          {event.bookings && event.bookings.length > 0 && (
            <>
              <SectionHeading label={t('popover.bookings')} />
              <BookingsSection bookings={event.bookings} isHome={isHome} />
            </>
          )}

          {/* ── Lineups ── */}
          {event.lineup && (event.lineup.home.length > 0 || event.lineup.away.length > 0) && (
            <>
              <SectionHeading label={t('popover.lineup')} />
              <LineupsSection
                lineup={event.lineup}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                isHome={isHome}
              />
            </>
          )}

          {/* ── Substitutions ── */}
          {event.subs && event.subs.length > 0 && (
            <>
              <SectionHeading label={t('popover.substitutions')} />
              <SubstitutionsSection subs={event.subs} isHome={isHome} />
            </>
          )}

          {/* ── Volleyball sets ── */}
          {event.sets && event.sets.length > 0 && (
            <>
              <SectionHeading label={t('popover.sets')} />
              <SetsSection sets={event.sets} setLabel={t('popover.set')} />
            </>
          )}

          {/* ── Volleyball top scorers ── */}
          {event.vbScorers && event.vbScorers.length > 0 && (
            <>
              <SectionHeading label={t('popover.vbScorers')} />
              <VbScorersSection scorers={event.vbScorers} isHome={isHome} />
            </>
          )}

          {/* ── Match report ── */}
          {event.status === 'played' && (
            <div className="mt-3">
              <MatchReport reportEN={event.reportEN} reportEL={event.reportEL} />
            </div>
          )}

          {/* ── View All Statistics CTA ── */}
          {isFootballPlayed && (
            <button
              onClick={() => { navigate('/stats'); onClose(); }}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#E02520] to-[#b91c1c] hover:from-[#c41e19] hover:to-[#991b1b] text-white font-black text-sm uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all shadow-[0_4px_20px_rgba(224,37,32,0.4)] active:scale-[0.98]"
            >
              <span>📊</span>
              {t('popover.viewAllStats')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
