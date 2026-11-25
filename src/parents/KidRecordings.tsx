import { Pause, Play, RotateCcw, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { APP_TEXT as A } from '../core/appTexts';
import { fill, useLang, useText } from '../core/lang';
import { GAME_SURAHS, surahInfo, surahName } from '../tajweed/surahs';
import type { Profile } from '../profiles/store';
import { loadTake, removeTakes } from './recordings';
import { addRequest, askAgain, listRequests, recordingMode, removeRequest, setRecordingMode, versesOf, wordsToWorkOn, type RecordingMode, type RecordingRequest } from './requests';
import { requestText } from './requestText';

/** On the grown-ups' page, for one child: whether they may record, a reading to ask for, and what they recorded. */
export function KidRecordings({ kid }: { kid: Profile }) {
  const tx = useText();
  const lang = useLang();
  const [mode, setMode] = useState<RecordingMode>(() => recordingMode(kid.id));
  const [requests, setRequests] = useState(() => listRequests(kid.id));
  const [surah, setSurah] = useState(GAME_SURAHS[0]?.n ?? 1);
  const verses = surahInfo(surah)?.verses ?? 1;
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(verses);
  const [note, setNote] = useState('');
  const refresh = () => setRequests(listRequests(kid.id));

  const pickSurah = (n: number) => {
    setSurah(n);
    setFrom(1);
    setTo(surahInfo(n)?.verses ?? 1);
  };

  const chooseMode = (m: RecordingMode) => {
    setRecordingMode(kid.id, m);
    setMode(m);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    addRequest(kid.id, { surah, from, to, note, verses });
    setNote('');
    refresh();
  };

  const range = Array.from({ length: verses }, (_, i) => i + 1);

  return (
    <div className="jparents-rec">
      <h3>{tx(A.recordings)}</h3>
      <fieldset>
        <legend>{tx(A.recordMode)}</legend>
        <div className="jp-choices">
          {(['ask', 'always'] as const).map((m) => (
            <button key={m} type="button" className="jp-choice" aria-pressed={mode === m} onClick={() => chooseMode(m)}>{tx(m === 'ask' ? A.modeAsk : A.modeAlways)}</button>
          ))}
        </div>
      </fieldset>

      <form className="jparents-ask" onSubmit={send}>
        <h4>{tx(A.askReading)}</h4>
        <label>
          {tx(A.surahLabel)}
          <select value={surah} onChange={(e) => pickSurah(Number(e.target.value))}>
            {GAME_SURAHS.map((s) => <option key={s.n} value={s.n}>{s.n}. {surahName(s, lang)}</option>)}
          </select>
        </label>
        <div className="jparents-range">
          <label>
            {tx(A.fromVerse)}
            <select value={from} onChange={(e) => { const n = Number(e.target.value); setFrom(n); if (to < n) setTo(n); }}>
              {range.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label>
            {tx(A.toVerse)}
            <select value={to} onChange={(e) => { const n = Number(e.target.value); setTo(n); if (from > n) setFrom(n); }}>
              {range.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <label>
          {tx(A.noteLabel)}
          <input type="text" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="tj-pill tj-pill-go" type="submit" style={{ justifyContent: 'center' }}><Send size={18} strokeWidth={2.5} />{tx(A.sendAsk)}</button>
      </form>

      {requests.length > 0 && (
        <ul className="jparents-requests">
          {requests.map((r) => <RequestRow key={r.id} kid={kid} r={r} onChange={refresh} />)}
        </ul>
      )}
      <p className="jp-note">{tx(A.requestsLocal)}</p>
    </div>
  );
}

function RequestRow({ kid, r, onChange }: { kid: Profile; r: RecordingRequest; onChange: () => void }) {
  const tx = useText();
  const lang = useLang();
  const work = wordsToWorkOn(r);
  const verses = versesOf(r);
  const status = r.recordedAt
    ? fill(tx(A.recordedOn), { date: new Date(r.recordedAt).toLocaleDateString(lang) })
    : r.recorded.length
      ? fill(tx(A.partlyRecorded), { n: r.recorded.length, m: verses.length })
      : fill(tx(A.waitingFor), { name: kid.name });

  const remove = () => {
    void removeTakes(r.id, verses);
    removeRequest(kid.id, r.id);
    onChange();
  };

  return (
    <li className="jparents-request" data-done={!!r.recordedAt || undefined}>
      <p className="jparents-request-title"><strong>{requestText(r, lang, tx)}</strong><span>{status}</span></p>
      {r.note && <p className="jp-note">“{r.note}”</p>}
      {r.recorded.length > 0 && (
        <>
          <div className="jparents-takes">
            {r.recorded.map((n) => <TakeButton key={n} requestId={r.id} ayah={n} />)}
          </div>
          {r.check !== 'checked' ? (
            <p className="jp-note">{tx(A.notChecked)}</p>
          ) : work.length ? (
            <div className="jparents-work">
              <p>{tx(A.workOn)}</p>
              <ul>
                {work.map((w) => (
                  <li key={w.ayah}><span>{fill(tx(A.verseN), { n: w.ayah })}</span> <span lang="ar" dir="rtl" className="jparents-words">{w.words.join(' · ')}</span></li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="jp-note">{tx(A.allClear)}</p>
          )}
        </>
      )}
      <div className="jp-choices">
        {r.recordedAt && (
          <button type="button" className="tj-pill" onClick={() => { askAgain(kid.id, r, surahInfo(r.surah)?.verses ?? r.to); onChange(); }}>
            <RotateCcw size={16} strokeWidth={2.5} />{tx(A.askAgain)}
          </button>
        )}
        <button type="button" className="tj-pill" onClick={remove}><Trash2 size={16} strokeWidth={2.5} />{tx(A.remove)}</button>
      </div>
    </li>
  );
}

/** Plays the child's take of one verse, read from this device. */
function TakeButton({ requestId, ayah }: { requestId: string; ayah: number }) {
  const tx = useText();
  const [state, setState] = useState<'idle' | 'playing' | 'missing'>('idle');
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);

  useEffect(() => () => {
    audio.current?.pause();
    if (url.current) URL.revokeObjectURL(url.current);
  }, []);

  const play = async () => {
    if (state === 'playing') {
      audio.current?.pause();
      return setState('idle');
    }
    if (!url.current) {
      const blob = await loadTake(requestId, ayah);
      if (!blob) return setState('missing');
      url.current = URL.createObjectURL(blob);
    }
    audio.current ??= new Audio();
    audio.current.src = url.current;
    audio.current.onended = () => setState('idle');
    setState('playing');
    void audio.current.play().catch(() => setState('idle'));
  };

  return (
    <button type="button" className="tj-pill" onClick={() => void play()} disabled={state === 'missing'} title={state === 'missing' ? tx(A.noRecording) : undefined}>
      {state === 'playing' ? <Pause size={16} strokeWidth={0} fill="currentColor" /> : <Play size={16} strokeWidth={0} fill="currentColor" />}
      {fill(tx(A.verseN), { n: ayah })}
    </button>
  );
}
