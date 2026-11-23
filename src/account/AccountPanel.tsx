import { Cloud, RefreshCw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { APP_TEXT as A } from '../core/appTexts';
import { fill, useLang, useText } from '../core/lang';
import { ApiError, deleteAccount, readAccount, signIn, signOut, signUp, sync } from './sync';

const ERRORS: Record<string, keyof typeof A> = {
  wrong_login: 'errWrongLogin',
  email_taken: 'errEmailTaken',
  short_password: 'errShortPassword',
  bad_email: 'errBadEmail',
  too_many: 'errTooMany'
};

/** Signing in on the grown-ups' page, so progress follows the children between devices. */
export function AccountPanel({ onSynced }: { onSynced: () => void }) {
  const tx = useText();
  const lang = useLang();
  const [account, setAccount] = useState(readAccount);
  const [isNew, setIsNew] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof typeof A | null>(null);

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      setPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? (ERRORS[err.code] ?? 'errOffline') : 'errOffline');
    } finally {
      setAccount(readAccount());
      setBusy(false);
      onSynced();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => (isNew ? signUp(email, password) : signIn(email, password)));
  };

  const remove = () => {
    if (window.confirm(tx(A.deleteAsk))) void run(deleteAccount);
  };

  const when = account?.syncedAt ? new Date(account.syncedAt).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' }) : null;

  return (
    <section className="jp-form jaccount" aria-busy={busy}>
      <h2><Cloud size={26} strokeWidth={2.5} aria-hidden /> {tx(A.syncTitle)}</h2>
      {account ? (
        <>
          <p className="jp-note">{fill(tx(A.signedInAs), { email: account.email })}</p>
          {when && <p className="jp-note">{fill(tx(A.syncedAt), { time: when })}</p>}
          <button className="tj-pill tj-pill-go" type="button" disabled={busy} onClick={() => void run(sync)} style={{ justifyContent: 'center' }}>
            <RefreshCw size={18} strokeWidth={2.5} aria-hidden /> {tx(busy ? A.syncing : A.syncNow)}
          </button>
          {error && <p className="jp-note jaccount-error" role="alert">{tx(A[error])}</p>}
          <div className="jaccount-row">
            <button className="tj-pill" type="button" disabled={busy} onClick={() => void run(signOut)}>{tx(A.signOut)}</button>
            <button className="jaccount-danger" type="button" disabled={busy} onClick={remove}>{tx(A.deleteAccount)}</button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="jaccount-form">
          <p className="jp-note">{tx(A.syncWhy)}</p>
          <label>
            {tx(A.email)}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label>
            {tx(A.password)}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isNew ? 'new-password' : 'current-password'} minLength={isNew ? 8 : undefined} required />
          </label>
          {error && <p className="jp-note jaccount-error" role="alert">{tx(A[error])}</p>}
          <button className="tj-pill tj-pill-go" type="submit" disabled={busy || !email || !password} style={{ justifyContent: 'center' }}>{tx(isNew ? A.signUp : A.signIn)}</button>
          <button className="jaccount-switch" type="button" onClick={() => { setIsNew(!isNew); setError(null); }}>{tx(isNew ? A.haveAccount : A.newAccount)}</button>
        </form>
      )}
    </section>
  );
}
