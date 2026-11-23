import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'off' | 'asking' | 'ready' | 'recording' | 'denied';

/**
 * The child's voice, one take at a time. The microphone is asked for once, when recording is turned on, and kept open
 * until it is turned off. Takes stay in memory on this device only: nothing is uploaded or stored.
 */
export function useRecorder() {
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [status, setStatus] = useState<RecorderStatus>('off');

  const release = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
  }, []);

  useEffect(() => release, [release]);

  /** Opens the microphone. False if the child (or the browser) said no. */
  const enable = useCallback(async (): Promise<boolean> => {
    if (stream.current) return true;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('denied');
      return false;
    }
    setStatus('asking');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      setStatus('ready');
      return true;
    } catch {
      setStatus('denied');
      return false;
    }
  }, []);

  const disable = useCallback(() => {
    release();
    setStatus('off');
  }, [release]);

  const start = useCallback(() => {
    if (!stream.current || recorder.current?.state === 'recording') return;
    chunks.current = [];
    const rec = new MediaRecorder(stream.current);
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data);
    };
    recorder.current = rec;
    rec.start();
    setStatus('recording');
  }, []);

  /** Ends the take and hands back its sound, or null if nothing was recording. */
  const stop = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const rec = recorder.current;
        if (!rec || rec.state !== 'recording') return resolve(null);
        rec.onstop = () => {
          setStatus(stream.current ? 'ready' : 'off');
          resolve(chunks.current.length ? new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }) : null);
        };
        rec.stop();
      }),
    []
  );

  return { status, enable, disable, start, stop };
}
