import { ArrowLeft, Check, Target } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { APP_TEXT as A } from '../core/appTexts';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, useLang, useText } from '../core/lang';
import { RULE_TEXT } from '../core/texts';
import { bandRules, currentProfile } from '../profiles/store';
import { finishReview, nextUp, readProgress } from '../tajweed/progress';
import { gameUrl, surahInfo, surahName } from '../tajweed/surahs';
import { DISPLAY_FONT, MUSHAF_FONT } from '../tajweed/theme';
import { findExamples, makeRounds, type Examples } from './examples';
import { Game, useWords } from './Lesson';
import { missionRule } from './levels';
import '../tajweed/tajweed.css';
import './garden.css';

/** The questions of the daily review: three, or five for the oldest children. */
const REVIEW_ROUNDS = 3;

/** Today's review: a few quick questions on the rule that needs it most, then on to a verse. */
export default function Mission() {
  const tx = useText();
  const lang = useLang();
  const band = bandRules(currentProfile()?.band);
  const progress = useMemo(readProgress, []);
  const target = useMemo(() => missionRule(progress), [progress]);
  const [examples, setExamples] = useState<Examples | null>(null);
  const [done, setDone] = useState(false);
  const words = useWords(examples, band.slow);
  const verse = surahInfo(nextUp(progress));

  useEffect(() => {
    void ensureFonts([MUSHAF_FONT, DISPLAY_FONT]);
    document.title = `${tx(A.mission)} · Jana Tajweed`;
    void findExamples(target.rules).then(setExamples);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rounds = useMemo(() => (examples ? makeRounds(examples, band.rounds > 5 ? 5 : REVIEW_ROUNDS) : []), [examples, band.rounds]);

  return (
    <div className="tj jg" style={{ '--tj-display': fontStack(DISPLAY_FONT) } as CSSProperties} data-rule={target.rule}>
      <header className="tj-top">
        <a className="tj-btn tj-back" href={gameUrl()} aria-label={tx(A.toGarden)}><ArrowLeft size={22} strokeWidth={2.5} className="tj-flip" /></a>
        <div className="tj-heading">
          <h1>{tx(A.mission)}</h1>
          <p>{fill(tx(A.missionReview), { rule: tx(RULE_TEXT[target.rule].name) })}</p>
        </div>
      </header>
      <main className="jg-main" id="main">
        {done ? (
          <div className="jg-card jg-result" role="status">
            <span className="jg-hero" data-rule={target.rule}><Check size={44} strokeWidth={3} /></span>
            <h2>{tx(A.missionReviewDone)}</h2>
            <div className="jg-say-actions">
              {verse && <a className="tj-pill tj-pill-go" href={gameUrl(verse.n)}>{fill(tx(A.missionNext), { surah: surahName(verse, lang) })}</a>}
              <a className="tj-pill" href={gameUrl()}>{tx(A.toGarden)}</a>
            </div>
          </div>
        ) : !examples ? (
          <div className="jg-card jg-wait" role="status"><p><Target size={20} aria-hidden /> {tx(A.loading)}</p></div>
        ) : (
          <div className="jg-card">
            <Game examples={examples} rounds={rounds} practice hints={band.hints} words={words} onDone={() => { finishReview(); setDone(true); }} />
          </div>
        )}
      </main>
    </div>
  );
}
