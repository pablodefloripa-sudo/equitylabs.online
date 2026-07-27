import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface GhostTyperProps {
  text: string;
  isActive: boolean;
  visualScale: number;
}

export const GhostTyper = ({ text, isActive, visualScale }: GhostTyperProps) => {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioEnabledRef = useRef(false);
  const lastPulseRef = useRef(0);
  const textScale = 1.02;

  const ensureAudioReady = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    const AudioCtx = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

    if (!AudioCtx) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {
        return null;
      }
    }

    audioEnabledRef.current = audioContextRef.current.state === 'running';
    return audioContextRef.current;
  }, []);

  const playSynthKeyPulse = useCallback((char: string) => {
    if (!audioEnabledRef.current || /\s/.test(char)) return;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - lastPulseRef.current < 0.022) return;
    lastPulseRef.current = now;

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1450 + Math.random() * 550, now);
    filter.Q.setValueAtTime(6 + Math.random() * 2, now);

    oscA.type = 'triangle';
    oscB.type = 'sawtooth';

    const base = 760 + Math.random() * 280;
    oscA.frequency.setValueAtTime(base, now);
    oscA.frequency.exponentialRampToValueAtTime(base * 1.22, now + 0.045);
    oscB.frequency.setValueAtTime(base * 1.9, now);
    oscB.frequency.exponentialRampToValueAtTime(base * 2.25, now + 0.03);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.055);
    oscB.stop(now + 0.04);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      void ensureAudioReady();
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [ensureAudioReady]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setDisplayed('');
    if (!isActive || !text) return;

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        const nextChar = text.charAt(i);
        setDisplayed(text.slice(0, i + 1));
        playSynthKeyPulse(nextChar);
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 35 + Math.random() * 25);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, isActive, playSynthKeyPulse]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full px-4 py-3 font-mono tracking-normal sm:px-6"
    >
      <div
        className="mx-auto w-full max-w-[1320px] rounded-lg border border-cyan-400/30 bg-black/50 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5"
        style={{
          boxShadow: '0 0 25px rgba(34,211,238,0.15)',
          maxWidth: '100%',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <div className="w-2 h-2 rounded-full bg-green-500/70" />
          <span className="text-[10px] sm:text-xs text-cyan-300/50 ml-2 font-mono">equitylabs://agent-core</span>
        </div>
        <div
          className="min-h-[2.4em] font-mono leading-tight text-cyan-300"
          style={{
            textShadow: '0 0 12px rgba(34,211,238,0.5)',
            fontSize: `clamp(1.3rem, ${2.7 * textScale}vw, ${3.3 * textScale}rem)`,
          }}
        >
          <span className="text-cyan-400/70 mr-2">{'>'}</span>
          <span>{displayed}</span>
          <span className={`inline-block w-[3px] h-[1em] bg-cyan-300 ml-[2px] align-middle transition-opacity ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>
    </motion.div>
  );
};
