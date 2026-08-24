import { motion } from 'framer-motion';
import { Code2, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { modelDisplayName } from '@/lib/modelDisplay';

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
        className={`absolute -inset-1 rounded-[24px] blur-[10px] ${mascot ? 'bg-pink-400/15' : 'bg-[radial-gradient(ellipse_at_top,rgba(0,210,255,0.16),rgba(124,58,237,0.12)_55%,transparent)]'}`}
        animate={{ opacity: [0.24, 0.46, 0.24], scale: [0.998, 1.004, 0.998] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className={`relative overflow-hidden rounded-[22px] border px-4 py-4 backdrop-blur-2xl ${
          mascot
            ? 'border-pink-300/25 bg-[linear-gradient(170deg,rgba(30,10,40,0.75)_0%,rgba(20,8,32,0.55)_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.10)]'
            : 'border-white/10 bg-[linear-gradient(165deg,rgba(9,11,26,0.78)_0%,rgba(13,16,38,0.62)_45%,rgba(8,10,24,0.72)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-2px_0_rgba(0,0,0,0.45),inset_0_0_40px_rgba(0,210,255,0.05)]'
        }`}
        style={{
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
          ...(mascot ? {} : { backdropFilter: 'blur(14px) saturate(130%)' }),
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 20%, rgba(255,255,255,0.05) 36%, transparent 52%, rgba(255,255,255,0.08) 68%, transparent 84%), radial-gradient(circle at 18% 0%, rgba(0,210,255,0.14), transparent 30%), radial-gradient(circle at 82% 12%, rgba(124,58,237,0.10), transparent 26%)',
          }}
        />

        {isThinking && (
          <div className="relative z-10 mb-3 rounded-xl border border-cyan-300/20 bg-[#0a0c1c]/60 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
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

        <div className="relative z-10 mb-3 flex items-center gap-2 font-mono text-white/70">
          {(['bg-white/25', 'bg-white/15', 'bg-white/20'] as const).map((colorClass, index) => (
            <motion.div
              key={colorClass}
              className={`h-2 w-2 rounded-full ${colorClass}`}
              style={{ boxShadow: 'inset 0 0 3px rgba(0,0,0,0.55)' }}
              animate={isThinking ? { opacity: [0.3, 1, 0.3], scale: [0.9, 1.2, 0.9] } : { opacity: 0.75, scale: 1 }}
              transition={isThinking ? { duration: 0.85, repeat: Infinity, delay: index * 0.16 } : { duration: 0.2 }}
            />
          ))}

          <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 text-[10px] md:text-[11px] text-white/60">
            <span
              className="inline-flex shrink-0 items-center rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[11px] leading-none"
              title={countryCode ? `Country ${countryCode}` : 'Country'}
              aria-label={countryCode ? `Country ${countryCode}` : 'Country'}
            >
              {countryFlag}
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 uppercase tracking-[0.12em] text-white/55">{clock.day}</span>
            <span className="hidden rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-white/55 sm:inline">{clock.date}</span>
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 tabular-nums text-cyan-200/70">{clock.time}</span>
          </div>

          <span className="hidden rounded-md border border-cyan-300/20 bg-cyan-300/[0.08] px-2 py-0.5 text-[10px] md:text-[11px] font-semibold text-cyan-100/80 sm:inline">
            {modelDisplayName(model)}
          </span>
          <button
            type="button"
            onClick={() => setCoderMode((enabled) => !enabled)}
            title={coderMode ? 'Desactivar modo coder' : 'Activar modo coder'}
            aria-label={coderMode ? 'Desactivar modo coder' : 'Activar modo coder'}
            aria-pressed={coderMode}
            className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[9px] font-mono font-bold tracking-[0.12em] transition-all ${
              coderMode
                ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                : 'border-white/10 bg-white/[0.05] text-white/55 hover:border-white/25 hover:text-white/80'
            }`}
          >
            <Code2 className="h-3 w-3" />
            CODER
          </button>
          {onSpeak && (
            <button
              type="button"
              onClick={onSpeak}
              title="Reproducir respuesta"
              aria-label="Reproducir respuesta"
              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-white/55 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          ref={contentRef}
          className={`relative z-10 mt-1 min-h-[120px] overflow-visible rounded-2xl border px-4 py-3 backdrop-blur-md ${coderMode ? 'font-mono' : 'font-sans font-light tracking-tight'} text-[clamp(13px,calc(14px*var(--response-scale)),20px)] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
            mascot
              ? 'border-pink-300/15 bg-pink-950/25 text-pink-50/92'
            : coderMode
                ? 'border-emerald-300/25 bg-emerald-950/30 text-emerald-300'
              : 'border-white/[0.07] bg-black/45 text-slate-50 shadow-[inset_0_0_30px_rgba(0,0,0,0.35)]'
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
