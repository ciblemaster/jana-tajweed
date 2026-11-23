import { Brain, Flame, Lock, Medal, Play, Sprout, Star, Trophy, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, LANG_NAMES, LANGS, setLang, useLang, useText, type Lang } from '../core/lang';
import { AWARD_TEXT, TAJWEED_TEXT as T } from '../core/texts';
import { awards, isOpen, nextUp, readProgress, STARS, starsOf, streak, totalStars, won, writeProgress, type Star as StarKind } from './progress';
import { GAME_SURAHS, gameUrl, lessonUrl, profilesUrl, surahName, type SurahInfo } from './surahs';
import { APP_TEXT as A } from '../core/appTexts';
import { LEVELS, levelOpen } from '../garden/levels';
import { Avatar } from '../profiles/Avatar';
import { currentProfile } from '../profiles/profiles';
import { RuleMark } from './letters';
import '../garden/garden.css';
import { DISPLAY_FONT } from './theme';
import './tajweed.css';

/** How far apart the stones of the path are, and how the path sways from side to side (% of the width). */
const STEP = 132;
const SWAY = [50, 68, 76, 62, 40, 24, 18, 32];
const GOAL: Record<StarKind, keyof typeof T> = { listen: 'starListen', recite: 'starRecite', memorise: 'starMemorise' };

/**
 * The child's path: every surah is a stone, opened by finishing the one before it. Each stone shows the stars won on
 * it, and the awards wait on a shelf above. Everything is kept on this device.
 */
export default function TajweedMap() {
  const tx = useText();
  const lang = useLang();
  const [progress, setProgress] = useState(readProgress);
  const [picked, setPicked] = useState<SurahInfo | null>(null);
  const [award, setAward] = useState<string | null>(null);
  const upNext = nextUp(progress);
  const upNextStone = useRef<HTMLLIElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const shelf = useMemo(() => awards(progress), [progress]);
  /** Awards won since the path was last looked at: announced once. */
  const fresh = useMemo(() => shelf.filter((a) => won(a) && !progress.seen.includes(a.id)).map((a) => a.id), [shelf, progress.seen]);

  useEffect(() => {
    void ensureFonts([DISPLAY_FONT]);
    document.title = tx(T.title);
    // Once the journey has started, the path opens on the next surah; before that, on the garden at the top.
    if (Object.keys(progress.surahs).length) upNextStone.current?.scrollIntoView({ block: 'center' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!picked) return;
    sheet.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicked(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [picked]);

  const seeAwards = () => {
    if (!fresh.length) return;
    const next = { ...progress, seen: [...progress.seen, ...fresh] };
    writeProgress(next);
    setProgress(next);
  };

  const toggleUnlock = () => {
    const next = { ...progress, unlockAll: !progress.unlockAll };
    writeProgress(next);
    setProgress(next);
  };

  const points = GAME_SURAHS.map((_, i) => ({ x: SWAY[i % SWAY.length], y: i * STEP + STEP / 2 }));
  const goal = { x: SWAY[GAME_SURAHS.length % SWAY.length], y: GAME_SURAHS.length * STEP + STEP / 2 };
  const line = [...points, goal].map((p, i, all) => (i ? `C ${all[i - 1].x} ${all[i - 1].y + STEP / 2} ${p.x} ${p.y - STEP / 2} ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(' ');
  const height = (GAME_SURAHS.length + 1) * STEP;
  const done = GAME_SURAHS.filter((s) => progress.surahs[s.n]?.listen).length;
  const pickedAt = picked ? GAME_SURAHS.findIndex((s) => s.n === picked.n) : -1;
  const pickedOpen = picked ? isOpen(progress, picked.n) : false;
  const kid = currentProfile();
  const nextLevel = LEVELS.find((l) => l.rules.length && !progress.garden[l.id]?.done)?.id;

  return (
    <div className="tj tj-map" style={{ '--tj-display': fontStack(DISPLAY_FONT) } as CSSProperties}>
      <header className="tj-top">
        <div className="tj-heading">
          <h1>{tx(T.title)}</h1>
          <p>{tx(T.map)} · {done} / {GAME_SURAHS.length}</p>
        </div>
        {kid && <a className="tj-kid-btn" href={profilesUrl()} aria-label={tx(A.switchChild)}><Avatar kind={kid.avatar} size={22} />{kid.name}</a>}
        <select className="tj-lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label="Language">
          {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
        </select>
        <div className="tj-score">
          <span className="tj-score-chip" title={tx(T.stars)}><Star size={20} fill="currentColor" strokeWidth={2} aria-hidden /><b>{totalStars(progress)}</b><span className="tj-sr">{tx(T.stars)}</span></span>
          <span className="tj-score-chip tj-score-days" title={tx(T.daysInRow)}><Flame size={20} strokeWidth={2.5} aria-hidden /><b>{streak(progress)}</b><span className="tj-sr">{tx(T.daysInRow)}</span></span>
        </div>
      </header>

      <section className="jg-garden" aria-labelledby="jg-garden-title">
        <h2 id="jg-garden-title"><Sprout size={20} strokeWidth={2.5} aria-hidden />{tx(A.garden)}</h2>
        <p>{tx(A.gardenHint)}</p>
        <ol className="jg-levels">
          {LEVELS.map((l, i) => {
            const open = levelOpen(progress.garden, l.id, progress.unlockAll);
            const doneLevel = progress.garden[l.id]?.done;
            const face = (
              <>
                <span className="jg-hero" data-rule={l.colour}>{l.rules.length ? <RuleMark rule={l.colour} size={26} /> : <Lock size={24} strokeWidth={2.5} />}</span>
                <span>{tx(l.name)}</span>
                <small>{doneLevel ? <Star size={16} fill="currentColor" strokeWidth={0} className="jg-level-star" aria-label="★" /> : !l.rules.length ? tx(A.soon) : !open ? tx(A.locked) : fill(tx(A.level), { n: i + 1 })}</small>
              </>
            );
            return (
              <li key={l.id}>
                {open
                  ? <a className={['jg-level', l.id === nextLevel ? 'is-next' : ''].join(' ')} href={lessonUrl(l.id)} data-rule={l.colour}>{face}</a>
                  : <span className="jg-level" aria-disabled="true" data-rule={l.colour}>{face}</span>}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="tj-shelf" aria-labelledby="tj-shelf-title">
        <h2 id="tj-shelf-title"><Medal size={20} strokeWidth={2.5} aria-hidden />{tx(T.awards)}</h2>
        {fresh.length > 0 && (
          <button className="tj-fresh" onClick={seeAwards}>
            <strong>{tx(T.newAward)}</strong> {fresh.map((id) => tx(AWARD_TEXT[id].name)).join(' · ')}
          </button>
        )}
        <ul>
          {shelf.map((a) => (
            <li key={a.id}>
              <button
                className={['tj-medal', won(a) ? 'is-won' : '', fresh.includes(a.id) ? 'is-fresh' : '', award === a.id ? 'is-shown' : ''].join(' ')}
                aria-pressed={award === a.id}
                aria-label={tx(AWARD_TEXT[a.id].name)}
                onClick={() => setAward(award === a.id ? null : a.id)}
              >
                {a.id === 'all' ? <Trophy size={26} strokeWidth={2.2} aria-hidden /> : a.id.startsWith('memory') ? <Brain size={26} strokeWidth={2.2} aria-hidden /> : a.id === 'days3' ? <Flame size={26} strokeWidth={2.2} aria-hidden /> : a.id === 'gold' ? <Star size={26} strokeWidth={2.2} fill="currentColor" aria-hidden /> : <Medal size={26} strokeWidth={2.2} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
        {award && (
          <p className="tj-medal-text" role="status">
            <strong>{tx(AWARD_TEXT[award].name)}</strong> {tx(AWARD_TEXT[award].how)}
            <span>{shelf.find((a) => a.id === award)!.have} / {shelf.find((a) => a.id === award)!.need}</span>
          </p>
        )}
      </section>

      <h2 className="jg-section-title">{tx(A.surahPath)}</h2>
      <main className="tj-path" id="main" style={{ blockSize: height }}>
        <svg className="tj-trail" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
          <path d={line} />
        </svg>
        <ol>
          {GAME_SURAHS.map((s, i) => {
            const open = isOpen(progress, s.n);
            const stars = starsOf(progress, s.n);
            const state = !open ? 'is-locked' : stars ? 'is-done' : 'is-open';
            return (
              <li
                key={s.n}
                ref={s.n === upNext ? upNextStone : undefined}
                className={['tj-stone', state, s.n === upNext && open ? 'is-next' : '', points[i].x > 50 ? 'is-right' : 'is-left'].join(' ')}
                style={{ insetBlockStart: points[i].y, left: `${points[i].x}%` }}
              >
                <button onClick={() => setPicked(s)} aria-label={`${surahName(s, lang)} · ${fill(tx(T.versesCount), { n: s.verses })}`}>
                  <span className="tj-stone-face">
                    {!open ? <Lock size={28} strokeWidth={2.5} aria-hidden /> : stars ? <Star size={34} strokeWidth={2} fill="currentColor" aria-hidden /> : <Play size={30} strokeWidth={0} fill="currentColor" aria-hidden />}
                  </span>
                  <span className="tj-stone-label">
                    <b lang="ar" dir="rtl">{s.ar}</b>
                    {lang !== 'ar' && lang !== 'ur' && <span>{s.en}</span>}
                    <span className="tj-stone-stars" aria-hidden>
                      {STARS.map((star) => <Star key={star} size={14} strokeWidth={2.5} fill="currentColor" className={progress.surahs[s.n]?.[star] ? 'is-won' : ''} />)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          <li className={['tj-stone tj-goal', done === GAME_SURAHS.length ? 'is-done' : 'is-locked'].join(' ')} style={{ insetBlockStart: goal.y, left: `${goal.x}%` }} aria-hidden>
            <span className="tj-stone-face"><Trophy size={36} strokeWidth={2.2} /></span>
          </li>
        </ol>
      </main>

      <footer className="tj-map-foot">
        <button className="tj-pill tj-toggle tj-stops" onClick={toggleUnlock} aria-pressed={!!progress.unlockAll}>
          <span className="tj-switch" aria-hidden />{tx(T.unlockAll)}
        </button>
      </footer>

      {picked && (
        <div className="tj-card-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) setPicked(null); }}>
          <div ref={sheet} className="tj-card tj-surah-card" role="dialog" aria-modal aria-labelledby="tj-surah-title" tabIndex={-1}>
            <button className="tj-btn tj-card-close" onClick={() => setPicked(null)} aria-label={tx(T.close)}><X size={22} strokeWidth={2.5} /></button>
            <h2 id="tj-surah-title" className="tj-surah-name">
              <span lang="ar" dir="rtl">{picked.ar}</span>
              {lang !== 'ar' && lang !== 'ur' && <small>{picked.en}</small>}
            </h2>
            <p className="tj-surah-count">{fill(tx(T.versesCount), { n: picked.verses })}</p>
            {pickedOpen ? (
              <>
                <ul className="tj-goals">
                  {STARS.map((star) => (
                    <li key={star} className={progress.surahs[picked.n]?.[star] ? 'is-won' : ''}>
                      <Star size={26} strokeWidth={2} fill="currentColor" aria-hidden />
                      <span>{tx(T[GOAL[star]])}</span>
                    </li>
                  ))}
                </ul>
                <div className="tj-card-actions">
                  <a className="tj-pill tj-pill-go" href={gameUrl(picked.n)}><Play size={18} strokeWidth={0} fill="currentColor" />{tx(T.learn)}</a>
                  {progress.surahs[picked.n]?.listen
                    ? <a className="tj-pill tj-pill-mind" href={gameUrl(picked.n, 'memorise')}><Brain size={18} strokeWidth={2.5} />{tx(T.memorise)}</a>
                    : <span className="tj-pill is-off" aria-disabled><Lock size={16} strokeWidth={2.5} />{tx(T.memorise)}</span>}
                </div>
                {!progress.surahs[picked.n]?.listen && <p className="tj-surah-hint">{tx(T.memoriseLocked)}</p>}
              </>
            ) : (
              <p className="tj-surah-locked"><Lock size={22} strokeWidth={2.5} aria-hidden />{fill(tx(T.lockedHint), { name: surahName(GAME_SURAHS[pickedAt - 1], lang) })}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
