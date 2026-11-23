import { useCallback, useEffect, useRef, useState } from 'react';

export type RecitationStatus = 'loading' | 'ready' | 'error';

interface PlayOptions {
  /** Start here instead of where the recording is. */
  fromMs?: number;
  /** Stop here, then call `onDone`. */
  untilMs?: number;
  onDone?: () => void;
}

/**
 * One audio element for the whole page. Phones only let a page play sound after a tap and remember that per
 * element, so the tap on Play is enough for every verse and every word listened to after it.
 *
 * `onTick` runs once a frame while the recording plays, with the time in ms; it is how the letters follow the voice.
 */
export function useRecitation(url: string, onTick: (ms: number) => void, onEnd: () => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const until = useRef<{ ms: number; done?: () => void } | null>(null);
  const tick = useRef(onTick);
  const end = useRef(onEnd);
  tick.current = onTick;
  end.current = onEnd;
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<RecitationStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const el = new Audio();
    el.preload = 'auto';
    el.src = url;
    audio.current = el;
    setStatus('loading');
    let frame = 0;

    // One look at where the recording is. False once it has been stopped at the place asked for.
    const step = () => {
      // While a jump to another verse is still landing, Safari can report the old time: wait for the new one.
      if (el.seeking) return true;
      const ms = el.currentTime * 1000;
      tick.current(ms);
      const stop = until.current;
      if (stop && ms >= stop.ms) {
        until.current = null;
        el.pause();
        stop.done?.();
        return false;
      }
      return true;
    };
    const loop = () => {
      if (step()) frame = requestAnimationFrame(loop);
    };
    // A browser stops drawing frames for a page it is not showing, but the recording plays on: its own clock, a
    // few times a second, keeps the page in step until the frames come back.
    const onTime = () => {
      if (!el.paused) step();
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(frame);
    };
    const onEnded = () => {
      until.current = null;
      end.current();
    };
    const onReady = () => setStatus('ready');
    const onError = () => setStatus('error');

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('canplay', onReady);
    el.addEventListener('error', onError);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('error', onError);
      el.pause();
      el.removeAttribute('src');
      el.load();
      audio.current = null;
    };
  }, [url, attempt]);

  const play = useCallback((options: PlayOptions = {}) => {
    const el = audio.current;
    if (!el) return;
    if (options.fromMs !== undefined) el.currentTime = Math.max(0, options.fromMs) / 1000;
    until.current = options.untilMs !== undefined ? { ms: options.untilMs, done: options.onDone } : null;
    // A refused play (no tap yet, or the file failed) leaves the page paused; the error event says why.
    void el.play().catch(() => setPlaying(false));
  }, []);

  const pause = useCallback(() => {
    until.current = null;
    audio.current?.pause();
  }, []);

  const seek = useCallback((ms: number) => {
    if (audio.current) audio.current.currentTime = Math.max(0, ms) / 1000;
  }, []);

  const setRate = useCallback((rate: number) => {
    if (audio.current) audio.current.playbackRate = rate;
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { playing, status, play, pause, seek, setRate, retry };
}
