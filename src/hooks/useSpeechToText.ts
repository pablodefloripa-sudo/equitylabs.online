import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useSpeechToText — graba la voz del usuario y la transcribe a texto EN VIVO.
 *
 * - `interim`  : transcripción parcial mientras se habla (actualización instantánea)
 * - `onCommit` : se dispara con cada frase finalizada (se agrega al input)
 * - Al detener (`stop`) se commitea la cola pendiente para no perder la última frase
 * - Requiere Chrome/Edge (Web Speech API). HTTPS o localhost obligatorio.
 */

function getRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface SpeechToTextOptions {
  lang?: string; // default 'es-ES'
  onCommit?: (finalText: string) => void;
  onError?: (code: string) => void;
}

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const { lang = 'es-ES', onCommit, onError } = options;
  const handlersRef = useRef({ onCommit, onError });
  handlersRef.current = { onCommit, onError };

  const [supported] = useState<boolean>(() => !!getRecognitionCtor());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  const wantOnRef = useRef(false);
  const interimRef = useRef('');

  const stop = useCallback(() => {
    wantOnRef.current = false;
    const r = recRef.current;
    recRef.current = null;

    // Commitear la cola pendiente: no se pierde la última frase hablada.
    const tail = interimRef.current.trim();
    if (tail) handlersRef.current.onCommit?.(tail);

    if (r) {
      try {
        r.stop();
      } catch {
        /* noop */
      }
    }
    interimRef.current = '';
    setInterim('');
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('unsupported');
      handlersRef.current.onError?.('unsupported');
      return;
    }
    if (recRef.current) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (ev: any) => {
      let interimText = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      interimRef.current = interimText;
      if (finalText.trim()) {
        handlersRef.current.onCommit?.(finalText.trim());
      }
      setInterim(interimText);
    };

    rec.onerror = (ev: any) => {
      const code = ev?.error ?? 'error';
      setError(code);
      handlersRef.current.onError?.(code);
      // Errores fatales de permiso: apagar del todo.
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        wantOnRef.current = false;
        interimRef.current = '';
        setInterim('');
        setListening(false);
      }
    };

    rec.onend = () => {
      // Auto-reinicio mientras el usuario quiera seguir grabando
      // (Chrome corta solo la sesión cada ~30-60s).
      if (wantOnRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
        setInterim('');
      }
    };

    recRef.current = rec;
    wantOnRef.current = true;
    try {
      rec.start();
      setError(null);
      setListening(true);
    } catch (e: any) {
      setError(e?.message ?? 'failed to start');
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}
