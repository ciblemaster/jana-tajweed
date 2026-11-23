import { Plus, X } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { APP_TEXT as A } from '../core/appTexts';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, LANG_NAMES, LANGS, setLang, useLang, useText, type Lang } from '../core/lang';
import { forgetChild } from '../account/sync';
import { gameUrl, parentsUrl } from '../tajweed/surahs';
import { DISPLAY_FONT } from '../tajweed/theme';
import { Avatar } from './Avatar';
import { addProfile, AVATARS, BANDS, canAddProfile, chooseProfile, currentProfile, listProfiles, removeProfile, type Avatar as Kind, type Band } from './store';
import '../tajweed/tajweed.css';
import '../garden/garden.css';

/** "Who is learning today?": pick a child, or add one. Shown first when there is nobody yet. */
export default function Profiles() {
  const tx = useText();
  const lang = useLang();
  const [kids, setKids] = useState(listProfiles);
  const [adding, setAdding] = useState(kids.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<Kind>('cat');
  const [band, setBand] = useState<Band>('young');
  const current = currentProfile();

  useEffect(() => {
    void ensureFonts([DISPLAY_FONT]);
    document.title = `${tx(A.whoIsLearning)} · Jana Tajweed`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id: string) => {
    chooseProfile(id);
    window.location.assign(gameUrl());
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile(name, avatar, band);
    window.location.assign(gameUrl());
  };

  const remove = (id: string, who: string) => {
    if (!window.confirm(fill(tx(A.removeAsk), { name: who }))) return;
    removeProfile(id);
    forgetChild(id);
    const left = listProfiles();
    setKids(left);
    if (!left.length) setAdding(true);
  };

  return (
    <div className="tj jp" style={{ '--tj-display': fontStack(DISPLAY_FONT) } as CSSProperties}>
      <select className="tj-lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label="Language">
        {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
      </select>
      <h1>Jana Tajweed</h1>

      {!adding && (
        <>
          <h2 className="jg-section-title" style={{ textAlign: 'center' }}>{tx(A.whoIsLearning)}</h2>
          <ul className="jp-kids">
            {kids.map((k) => (
              <li key={k.id} style={{ position: 'relative' }}>
                <button className={k.id === current?.id ? 'jp-kid is-current' : 'jp-kid'} onClick={() => pick(k.id)}>
                  <Avatar kind={k.avatar} size={40} />
                  <span>{k.name}</span>
                </button>
                <button className="jp-remove" onClick={() => remove(k.id, k.name)} aria-label={`${tx(A.remove)} ${k.name}`}><X size={16} strokeWidth={2.5} /></button>
              </li>
            ))}
            {canAddProfile() && (
              <li>
                <button className="jp-kid" onClick={() => setAdding(true)}>
                  <span className="jp-avatar"><Plus size={36} strokeWidth={2.5} /></span>
                  <span>{tx(A.addChild)}</span>
                </button>
              </li>
            )}
          </ul>
          <a className="jp-gate-link" href={parentsUrl()}>{tx(A.forGrownUps)}</a>
        </>
      )}

      {adding && (
        <form className="jp-form" onSubmit={save}>
          <h2>{tx(A.newChild)}</h2>
          <label>
            {tx(A.childName)}
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoComplete="off" required autoFocus />
          </label>
          <fieldset>
            <legend>{tx(A.pickAnimal)}</legend>
            <div className="jp-choices">
              {AVATARS.map((a) => (
                <button key={a} type="button" className="jp-choice" aria-pressed={avatar === a} aria-label={a} onClick={() => setAvatar(a)}>
                  <Avatar kind={a} size={28} />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{tx(A.age)}</legend>
            <div className="jp-choices">
              {BANDS.map((b) => (
                <button key={b} type="button" className="jp-choice" aria-pressed={band === b} onClick={() => setBand(b)}>{tx(A[b])}</button>
              ))}
            </div>
          </fieldset>
          <button className="tj-pill tj-pill-go" type="submit" disabled={!name.trim()} style={{ justifyContent: 'center' }}>{tx(A.save)}</button>
          {kids.length > 0 && <button className="tj-pill" type="button" onClick={() => setAdding(false)} style={{ justifyContent: 'center' }}>{tx(A.cancel)}</button>}
          <p className="jp-note">{tx(A.onDevice)}</p>
        </form>
      )}
    </div>
  );
}
