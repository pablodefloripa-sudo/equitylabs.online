import { motion } from 'framer-motion';
import { Code2, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AgentResponsePanelProps {
  content: string;
  model?: string;
  mascot?: boolean;
  responseScale?: number;
  isThinking?: boolean;
  onSpeak?: () => void;
}

let cachedCountryCode: string | null = null;
let countryLookupPromise: Promise<string | null> | null = null;

const sanitize = (value: string): string => {
  if (!value) return value;
  return value
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/\uFE0F/g, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/[*#]+/g, '')
    .replace(/^\s*(Razonamiento|Ejecuci[oó]n|Next Step)\s*:\s*/gim, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const getBrowserCountryCode = () => {
  if (typeof navigator === 'undefined') return null;

  const locale = navigator.languages?.[0] || navigator.language || '';
  const region = locale.includes('-')
    ? locale.split('-')[1]
    : locale.includes('_')
      ? locale.split('_')[1]
      : '';

  return region ? region.toUpperCase() : null;
};

const countryCodeToFlag = (countryCode: string) => {
  const code = countryCode.toUpperCase().replace(/[^A-Z]/g, '');
  if (code.length !== 2) return '🌐';

  return code
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
};

const getDetectedCountryCode = async () => {
  if (cachedCountryCode) return cachedCountryCode;
  if (countryLookupPromise) return countryLookupPromise;

  countryLookupPromise = (async () => {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json() as { country_code?: string };
        const detected = typeof data.country_code === 'string' ? data.country_code.toUpperCase() : null;
        return detected || getBrowserCountryCode();
      }
    } catch {
      // fall through to browser locale
    }

    return getBrowserCountryCode();
  })();

  try {
    cachedCountryCode = await countryLookupPromise;
    return cachedCountryCode;
  } finally {
    countryLookupPromise = null;
  }
};

export const AgentResponsePanel = ({
  content,
  model = 'qwen/qwen3-vl-8b-thinking',
  mascot = false,
  responseScale = 1,
  isThinking = false,
  onSpeak,
}: AgentResponsePanelProps) => {
  const clean = sanitize(content);
  const [displayedContent, setDisplayedContent] = useState('');
  const [coderMode, setCoderMode] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [countryCode, setCountryCode] = useState<string | null>(cachedCountryCode);
  const contentRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    void getDetectedCountryCode().then((code) => {
      if (!active) return;
      setCountryCode(code);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDisplayedContent('');

    if (!clean) return;

    let index = 0;
    let timer: number | undefined;

    const typeNextCharacter = () => {
      index += 1;
      setDisplayedContent(clean.slice(0, index));

      if (!/[\s\n]/.test(clean.charAt(index - 1))) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = audioContextRef.current || new AudioContextClass();
          audioContextRef.current = audioContext;
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const time = audioContext.currentTime;
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(1450 + (index % 3) * 70, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.exponentialRampToValueAtTime(0.008, time + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start(time);
          oscillator.stop(time + 0.02);
        }
      }

      if (contentRef.current) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight;
        contentRef.current.scrollIntoView({ block: 'end', behavior: 'auto' });
      }

      if (index >= clean.length) {
        return;
      }

      const character = clean.charAt(index - 1);
      const pause = coderMode
        ? /[.!?,:;\n]/.test(character)
          ? 360
          : /\s/.test(character)
            ? 75
            : 58
            : 6;
      timer = window.setTimeout(typeNextCharacter, pause);
    };

    timer = window.setTimeout(typeNextCharacter, coderMode ? 180 : 6);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [clean, coderMode]);

  useEffect(() => () => {
    if (audioContextRef.current) void audioContextRef.current.close();
  }, []);

  const clock = useMemo(() => {
    const day = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(now);
    const date = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);
    const time = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);

    return { day, date, time };
  }, [now]);

  const countryFlag = countryCode ? countryCodeToFlag(countryCode) : '🌐';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full max-w-[min(100%,1080px)] group"
      style={{ '--response-scale': responseScale } as CSSProperties}
    >
      <motion.div
        className={`absolute -inset-1 rounded-[24px] blur-[8px] ${mascot ? 'bg-white/20' : 'bg-slate-200/35'}`}
        animate={{ opacity: [0.28, 0.52, 0.28], scale: [0.998, 1.004, 0.998] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className={`relative overflow-hidden rounded-[22px] border px-4 py-4 backdrop-blur-2xl ${
          mascot
            ? 'border-pink-300/30 bg-[linear-gradient(180deg,rgba(226,232,240,0.22)_0%,rgba(148,163,184,0.10)_100%)] shadow-[0_0_32px_rgba(236,72,153,0.18),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.22)]'
            : 'border-white/90 bg-[linear-gradient(145deg,rgba(248,250,252,0.94)_0%,rgba(203,213,225,0.82)_24%,rgba(100,116,139,0.72)_52%,rgba(226,232,240,0.92)_78%,rgba(255,255,255,0.96)_100%)] shadow-[0_24px_52px_rgba(15,23,42,0.48),0_0_0_1px_rgba(255,255,255,0.9),inset_0_2px_0_rgba(255,255,255,0.98),inset_0_-3px_0_rgba(51,65,85,0.35)]'
        }`}
        style={{
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
          ...(mascot ? {} : { backdropFilter: 'blur(10px) saturate(115%)' }),
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(115deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.10) 18%, rgba(255,255,255,0.32) 34%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.26) 66%, rgba(255,255,255,0.08) 82%, rgba(255,255,255,0.42) 100%), radial-gradient(circle at 20% 0%, rgba(34,211,238,0.12), transparent 26%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.07), transparent 22%)',
          }}
        />

        {isThinking && (
          <div className="relative z-10 mb-3 rounded-xl border border-cyan-200/30 bg-slate-900/55 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-100/80">
              <span className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
                AGENT THINKING
              </span>
              <span className="text-emerald-200/75">TYPING...</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-950/80">
              <motion.div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300"
                animate={{ x: ['-110%', '310%'] }}
                transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        <div className="relative z-10 mb-3 flex items-center gap-2 font-mono text-yellow-200">
          {([
            ['bg-red-500/80', 'rgba(239,68,68,0.75)'],
            ['bg-yellow-500/80', 'rgba(234,179,8,0.75)'],
            ['bg-green-500/80', 'rgba(34,197,94,0.75)'],
          ] as const).map(([colorClass, glow], index) => (
            <motion.div
              key={colorClass}
              className={`h-2.5 w-2.5 rounded-full ${colorClass}`}
              style={{ boxShadow: `0 0 6px ${glow}` }}
              animate={isThinking ? { opacity: [0.25, 1, 0.25], scale: [0.88, 1.15, 0.88] } : { opacity: 0.85, scale: 1 }}
              transition={isThinking ? { duration: 0.85, repeat: Infinity, delay: index * 0.16 } : { duration: 0.2 }}
            />
          ))}

          <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 text-[10px] md:text-[12px] text-slate-950">
            <span
              className="inline-flex shrink-0 items-center rounded-full border border-emerald-200/80 bg-emerald-400 px-2 py-1 text-base leading-none shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
              title={countryCode ? `Country ${countryCode}` : 'Country'}
              aria-label={countryCode ? `Country ${countryCode}` : 'Country'}
            >
              {countryFlag}
            </span>
            <span className="rounded-full border border-yellow-200/80 bg-yellow-400 px-2.5 py-1 font-semibold tracking-[0.14em] uppercase shadow-[0_2px_8px_rgba(234,179,8,0.35)]">{clock.day}</span>
            <span className="rounded-full border border-red-200/80 bg-red-400 px-2.5 py-1 shadow-[0_2px_8px_rgba(239,68,68,0.35)]">{clock.date}</span>
            <span className="rounded-full border border-emerald-200/80 bg-emerald-400 px-2.5 py-1 font-semibold tabular-nums shadow-[0_2px_8px_rgba(16,185,129,0.35)]">{clock.time}</span>
          </div>

          <span className="rounded-full border border-yellow-200/80 bg-yellow-400 px-2.5 py-1 text-[10px] md:text-[12px] font-semibold text-slate-950 shadow-[0_2px_8px_rgba(234,179,8,0.35)]">
            {model}
          </span>
          <button
            type="button"
            onClick={() => setCoderMode((enabled) => !enabled)}
            title={coderMode ? 'Desactivar modo coder' : 'Activar modo coder'}
            aria-label={coderMode ? 'Desactivar modo coder' : 'Activar modo coder'}
            aria-pressed={coderMode}
            className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[9px] font-mono font-bold tracking-[0.12em] transition-all ${
              coderMode
                ? 'border-emerald-100 bg-emerald-500 text-slate-950 shadow-[0_0_14px_rgba(52,211,153,0.5)]'
                : 'border-red-200/90 bg-red-400 text-slate-950 shadow-[0_2px_8px_rgba(239,68,68,0.35)] hover:bg-red-300'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            CODER
          </button>
          {onSpeak && (
            <button
              type="button"
              onClick={onSpeak}
              title="Reproducir respuesta"
              aria-label="Reproducir respuesta"
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 transition hover:border-emerald-300/55 hover:bg-emerald-300/15 hover:text-emerald-200"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          ref={contentRef}
          className={`relative z-10 mt-1 min-h-[120px] overflow-visible rounded-2xl border px-4 py-3 ${coderMode ? 'font-mono' : 'font-sans font-light tracking-tight'} text-[clamp(13px,calc(14px*var(--response-scale)),20px)] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
            mascot
              ? 'border-pink-300/20 bg-black/92 text-pink-50/92'
            : coderMode
                ? 'border-emerald-300/35 bg-black text-emerald-300'
              : 'border-slate-300/45 bg-slate-950/90 text-slate-50 shadow-[inset_0_0_24px_rgba(148,163,184,0.08)]'
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              code: ({ children }) => <code className="rounded bg-white/10 px-1 py-0.5 text-[0.95em]">{children}</code>,
            }}
          >
            {displayedContent}
          </ReactMarkdown>
          <span className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current opacity-70 animate-pulse" />
        </div>

        <div className="absolute top-0 left-0 h-3 w-3 rounded-tl-[22px] border-l border-t border-cyan-400/45" />
        <div className="absolute top-0 right-0 h-3 w-3 rounded-tr-[22px] border-r border-t border-cyan-400/35" />
        <div className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-[22px] border-b border-l border-cyan-400/35" />
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-br-[22px] border-b border-r border-cyan-400/45" />
      </div>
    </motion.div>
  );
};
