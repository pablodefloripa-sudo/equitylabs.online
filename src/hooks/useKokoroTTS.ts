import { useState, useCallback, useRef, useEffect } from 'react';

type TTSProvider = 'local' | 'premium';

interface SpeakOptions {
  provider?: TTSProvider;
  voiceId?: string;
}

interface UseKokoroTTSReturn {
  speak: (text: string, voiceName?: string, options?: SpeakOptions) => Promise<void>;
  stop: () => void;
  voices: SpeechSynthesisVoice[];
  isLoading: boolean;
  isSpeaking: boolean;
  isReady: boolean;
  error: string | null;
  premiumConfigured: boolean;
}

const PREMIUM_PROXY_URL = import.meta.env.VITE_MASCOT_TTS_PROXY_URL as string | undefined;
const PREMIUM_VOICE_ID = import.meta.env.VITE_MASCOT_TTS_VOICE_ID as string | undefined;

const selectBritishVoice = (voices: SpeechSynthesisVoice[]) => {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const britishHints = [
    'en-gb',
    'british',
    'uk',
    'english united kingdom',
    'matthew',
    'daniel',
    'george',
    'hazel',
    'alice',
    'samantha',
    'victoria',
  ];

  return (
    englishVoices.find((voice) => britishHints.some((hint) => `${voice.name} ${voice.lang}`.toLowerCase().includes(hint))) ||
    englishVoices.find((voice) => voice.lang.toLowerCase().startsWith('en-gb')) ||
    englishVoices[0] ||
    voices[0] ||
    null
  );
};

// Web Speech API fallback with an optional premium proxy path for external voices.
export const useKokoroTTS = (): UseKokoroTTSReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [premiumConfigured] = useState(Boolean(PREMIUM_PROXY_URL || PREMIUM_VOICE_ID));
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const pendingSpeechRef = useRef<string | null>(null);

  // Autoplay policy unlock: la primera interaccion real del usuario (click,
  // tecla, touch) desbloquea speechSynthesis y reproduce el saludo pendiente.
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      const pending = pendingSpeechRef.current;
      pendingSpeechRef.current = null;
      if (pending) {
        setTimeout(() => speakLocal(pending), 250);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    const checkSupport = () => {
      if ('speechSynthesis' in window) {
        const loadVoices = () => {
          const loadedVoices = window.speechSynthesis.getVoices();
          if (loadedVoices.length > 0) {
            setVoices(loadedVoices);
            setIsReady(true);
            setIsLoading(false);
          }
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          setVoices(window.speechSynthesis.getVoices());
          setIsReady(true);
          setIsLoading(false);
        } else {
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
          setTimeout(() => {
            setIsReady(true);
            setIsLoading(false);
          }, 1000);
        }
      } else {
        setError('Speech synthesis no soportado en este navegador');
        setIsLoading(false);
      }
    };

    checkSupport();
  }, []);

  const speakLocal = useCallback(async (text: string, voiceName?: string): Promise<void> => {
    if (!isReady) {
      console.warn('TTS not ready yet');
      return;
    }

    if (!unlockedRef.current) {
      // Autoplay policy: el navegador bloquea audio sin interaccion previa.
      // Se registra el texto pendiente para reproducirlo en el primer click/key.
      pendingSpeechRef.current = text;
      return;
    }
    pendingSpeechRef.current = null;

    window.speechSynthesis.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const currentVoices = window.speechSynthesis.getVoices();
      const selectedVoice = voiceName ? currentVoices.find((voice) => voice.name === voiceName) : undefined;
      const preferredVoice = selectedVoice || selectBritishVoice(currentVoices);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.lang = preferredVoice?.lang || 'en-GB';
      utterance.rate = 0.96;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        // 'not-allowed' = el navegador bloquea TTS sin interaccion previa del
        // usuario (autoplay policy). NO es un error real: se ignora en silencio
        // y se reintenta en la proxima interaccion (ver unlockOnInteraction).
        if (event.error === 'canceled' || event.error === 'not-allowed' || event.error === 'interrupted') {
          resolve();
          return;
        }
        console.error('TTS Error:', event.error);
        reject(new Error(event.error));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isReady]);

  const speakPremium = useCallback(async (text: string, voiceName?: string, voiceId?: string): Promise<void> => {
    if (!PREMIUM_PROXY_URL && !PREMIUM_VOICE_ID) {
      return speakLocal(text, voiceName);
    }

    stop();
    setIsSpeaking(true);

    try {
      const response = await fetch(PREMIUM_PROXY_URL || '/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: voiceId || PREMIUM_VOICE_ID,
          voiceName,
          localeHint: 'en-GB',
        }),
      });

      if (!response.ok) {
        throw new Error(`Premium TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };
      await audio.play();
    } catch (premiumError) {
      console.warn('Premium TTS fallback:', premiumError);
      setIsSpeaking(false);
      return speakLocal(text, voiceName);
    }
  }, [speakLocal]);

  const speak = useCallback(async (text: string, voiceName?: string, options?: SpeakOptions): Promise<void> => {
    try {
      const provider = options?.provider || 'local';
      if (provider === 'premium') {
        return await speakPremium(text, voiceName, options?.voiceId);
      }
      return await speakLocal(text, voiceName);
    } catch (speakError) {
      // Nunca propagar errores TTS al resto de la app: el audio es un extra,
      // no debe romper el flujo del chat.
      console.warn('TTS speak blocked:', speakError);
      setIsSpeaking(false);
    }
  }, [speakLocal, speakPremium]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    voices,
    isLoading,
    isSpeaking,
    isReady,
    error,
    premiumConfigured,
  };
};
