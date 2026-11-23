import { ArrowLeft, Lock } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { TAJWEED_RULES } from '../core';
import { APP_TEXT as A } from '../core/appTexts';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, useLang, useText, type Lang } from '../core/lang';
import { RULE_TEXT } from '../core/texts';
import { LEVELS } from '../garden/levels';
import { Avatar } from '../profiles/Avatar';
import { BANDS, listProfiles, updateProfile, type Band, type Profile } from '../profiles/store';
import { daysThisWeek, readProgressOf, strengthOf, streak, type Strength } from '../tajweed/progress';
import { gameUrl, GAME_SURAHS } from '../tajweed/surahs';
import { DISPLAY_FONT } from '../tajweed/theme';
import '../tajweed/tajweed.css';
import '../garden/garden.css';

const NUMBERS: Partial<Record<Lang, string[]>> = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
  ar: ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'],
  fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
};
const TIMES: Partial<Record<Lang, string>> = { en: 'times', ar: 'ضرب', fr: 'fois' };

/** A sum a young child cannot read or work out: two numbers from 3 to 9, written in words, multiplied. */
export function newSum() {
  const pick = () => 3 + Math.floor(Math.random() * 7);
  return { a: pick(), b: pick() };
}

/** In the app's language where we have its number words, else in English. */
export function sumInWords(sum: { a: number; b: number }, lang: Lang) {
  const l = NUMBERS[lang] ? lang : 'en';
  return `${NUMBERS[l]![sum.a]} ${TIMES[l]} ${NUMBERS[l]![sum.b]}`;
}

/** The answer as typed: digits in any script, spaces ignored. */
export function answerOk(sum: { a: number; b: number }, typed: string) {
  const digits = typed.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
  return /^\d+$/.test(digits) && Number(digits) === sum.a * sum.b;
}

const STRENGTH_TEXT: Record<Strength, keyof typeof A> = { strong: 'strong', growing: 'growing', practise: 'practise', new: 'notYet' };

/** The grown-ups' page: behind a sum, how each child is doing, and their age group. */
export default function Parents() {
  const tx = useText();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [sum, setSum] = useState(newSum);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const [kids, setKids] = useState(listProfiles);

  useEffect(() => {
    void ensureFonts([DISPLAY_FONT]);
    document.title = `${tx(A.forGrownUps)} · Jana Tajweed`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (answerOk(sum, typed)) return setOpen(true);
    setWrong(true);
    setTyped('');
    setSum(newSum());
  };

  const setBand = (kid: Profile, band: Band) => {
    updateProfile(kid.id, { band });
    setKids(listProfiles());
  };

  return (
    <div className="tj jp jparents" style={{ '--tj-display': fontStack(DISPLAY_FONT) } as CSSProperties}>
      <header className="tj-top">
        <a className="tj-btn tj-back" href={gameUrl()} aria-label={tx(A.backToApp)}><ArrowLeft size={22} strokeWidth={2.5} className="tj-flip" /></a>
        <div className="tj-heading"><h1>{tx(open ? A.parentsTitle : A.gateTitle)}</h1></div>
      </header>

      {!open ? (
        <form className="jp-form" onSubmit={check}>
          <span className="jg-hero"><Lock size={36} strokeWidth={2.5} /></span>
          <label>
            {fill(tx(A.gateAsk), { sum: sumInWords(sum, lang) })}
            <input type="text" inputMode="numeric" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" required autoFocus />
          </label>
          {wrong && <p className="jp-note" role="alert">{tx(A.gateWrong)}</p>}
          <button className="tj-pill tj-pill-go" type="submit" disabled={!typed.trim()} style={{ justifyContent: 'center' }}>{tx(A.gateGo)}</button>
        </form>
      ) : (
        <main className="jparents-list" id="main">
          {!kids.length && <p className="jp-note">{tx(A.noKids)}</p>}
          {kids.map((kid) => {
            const p = readProgressOf(kid.id);
            const stats: [keyof typeof A, string][] = [
              ['daysWeek', `${daysThisWeek(p)} / 7`],
              ['streakDays', String(streak(p))],
              ['surahsDone', `${GAME_SURAHS.filter((s) => p.surahs[s.n]?.listen).length} / ${GAME_SURAHS.length}`],
              ['byHeart', String(GAME_SURAHS.filter((s) => p.surahs[s.n]?.memorise).length)],
              ['levelsDone', `${LEVELS.filter((l) => p.garden[l.id]?.done).length} / ${LEVELS.length}`]
            ];
            const rules = TAJWEED_RULES.filter((r) => p.rules[r]?.tries);
            return (
              <section key={kid.id} className="jp-form jparents-kid">
                <h2><Avatar kind={kid.avatar} size={32} /> {kid.name}</h2>
                <dl className="jparents-stats">
                  {stats.map(([key, value]) => <div key={key}><dt>{tx(A[key])}</dt><dd>{value}</dd></div>)}
                </dl>
                <h3>{tx(A.strengths)}</h3>
                {rules.length ? (
                  <ul className="jparents-rules">
                    {rules.map((r) => {
                      const s = strengthOf(p.rules[r]);
                      return <li key={r} data-strength={s}><span>{tx(RULE_TEXT[r].name)}</span><span>{tx(A[STRENGTH_TEXT[s]])}</span></li>;
                    })}
                  </ul>
                ) : <p className="jp-note">{tx(A.notYet)}</p>}
                <fieldset>
                  <legend>{tx(A.ageGroup)}</legend>
                  <div className="jp-choices">
                    {BANDS.map((b) => (
                      <button key={b} type="button" className="jp-choice" aria-pressed={kid.band === b} onClick={() => setBand(kid, b)}>{tx(A[b])}</button>
                    ))}
                  </div>
                </fieldset>
              </section>
            );
          })}
          <p className="jp-note">{tx(A.privacyNote)}</p>
          <a className="tj-pill" href={gameUrl()} style={{ justifyContent: 'center' }}>{tx(A.backToApp)}</a>
        </main>
      )}
    </div>
  );
}
