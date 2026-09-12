import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, ChevronLeft, ChevronRight, SkipForward, ArrowRight } from 'lucide-react';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { getLandingLang, setStoredLandingLang } from '@/components/landing/landingContent';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import HermesConsole from '@/components/landing/HermesConsole';

const LANDING_SLIDES = [
  { src: '/slides/landing/1.png', alt: 'EquityLabs system architecture' },
  { src: '/slides/landing/2.png', alt: 'EquityLabs multi-agent capabilities' },
  { src: '/slides/landing/3.png', alt: 'EquityLabs registration workspace' },
  {
    src: '/slides/landing/4.png',
    alt: 'EquityLabs workspace modules',
    modules: true,
  },
];
const INTRO_SLIDE_COUNT = LANDING_SLIDES.length;
const SLIDE_SECONDS = 8;

const landingLangToAppLanguage = (lang: LandingLang): Language => {
  const map: Record<string, Language> = {
    es: 'ES',
    pt: 'PT',
    de: 'DE',
    it: 'IT',
    fr: 'FR',
    nl: 'NL',
    pl: 'PL',
  };
  return map[lang] || 'EN';
};

const TopBar = ({ lang, onLangChange }: { lang: LandingLang; onLangChange: (l: LandingLang) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-x-4 top-4 z-[100] flex justify-end">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/suscripciones')}
          className="flex h-10 items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 text-xs text-fuchsia-100 backdrop-blur-xl transition hover:border-fuchsia-300"
        >
          <Crown className="h-3.5 w-3.5" /> Ver suscripciones
        </button>
        <LanguageFloater className="relative" lang={lang} onChange={onLangChange} />
      </div>
    </div>
  );
};

const SlidesPhase = ({
  lang,
  onLangChange,
  onDone,
}: {
  lang: LandingLang;
  onLangChange: (l: LandingLang) => void;
  onDone: () => void;
}) => {
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const doneRef = useRef(false);
  idxRef.current = idx;

  const go = useCallback(
    (next: number) => {
      if (next >= INTRO_SLIDE_COUNT) {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
        return;
      }
      setIdx(Math.max(0, next));
    },
    [onDone],
  );

  useEffect(() => {
    const timer = setInterval(() => go(idxRef.current + 1), SLIDE_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [go]);

  const slide = LANDING_SLIDES[idx];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={slide.src} alt={slide.alt} className="h-full w-full object-cover" />
          {slide.modules && (
            <div aria-hidden="true" className="absolute inset-0">
              <img
                src="/slides/landing/modules/pequeno.png"
                alt=""
                className="absolute left-[8.8%] top-[11.2%] w-[31.6%] mix-blend-multiply"
              />
              <img
                src="/slides/landing/modules/grande.png"
                alt=""
                className="absolute left-[43.8%] top-[10.2%] w-[52.1%] mix-blend-multiply"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent bg-[length:200%_100%] animate-[sweep_10s_ease-in-out_infinite]" />

      <TopBar lang={lang} onLangChange={onLangChange} />

      <button
        onClick={() => go(idx - 1)}
        disabled={idx === 0}
        aria-label="Anterior"
        className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-md transition hover:border-[#00d2ff]/60 hover:text-[#00d2ff] disabled:opacity-20"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(idx + 1)}
        aria-label="Siguiente"
        className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-md transition hover:border-[#00d2ff]/60 hover:text-[#00d2ff]"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <button
        onClick={onDone}
        className="absolute bottom-8 right-6 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-md transition hover:border-[#ff007f]/60 hover:text-white"
      >
        Saltar intro <SkipForward className="h-3.5 w-3.5" />
      </button>

      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {LANDING_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-9 bg-gradient-to-r from-[#00d4ff] to-[#ff00ff]' : 'w-2 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-8 left-6 z-20 font-mono text-[11px] tracking-widest text-white/40">
        {String(idx + 1).padStart(2, '0')} / {String(INTRO_SLIDE_COUNT).padStart(2, '0')}
      </div>
    </div>
  );
};

const DashboardPhase = ({
  lang,
  onLangChange,
  onAgents,
}: {
  lang: LandingLang;
  onLangChange: (l: LandingLang) => void;
  onAgents: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <img
        src="/slides/landing/hermes-console-bg.png"
        alt="EquityLabs Dashboard"
        className="fixed inset-0 h-full w-full object-cover object-top"
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

      <TopBar lang={lang} onLangChange={onLangChange} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-5">
        <div className="mb-4 text-center">
          <p className="mb-2 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#00d2ff]/90">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00d2ff] animate-pulse" />
            Command Center · en vivo
          </p>
          <h1 className="font-display text-2xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] md:text-4xl">
            Proba el <span className="text-[#00d2ff]">dashboard</span> sin registrarte
          </h1>
        </div>

        <HermesConsole lang={lang === 'en' ? 'en' : 'es'} />

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/auth')}
            className="flex h-11 items-center gap-2 rounded-xl border-2 border-white bg-gradient-to-r from-[#00d2ff] via-[#8a2be2] to-[#ff007f] px-6 text-sm font-bold text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.6)] transition hover:brightness-110 hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.6)]"
          >
            Empezar gratis <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onAgents}
            className="flex h-11 items-center rounded-xl border-2 border-[#00d2ff]/60 bg-black/50 px-6 text-sm font-bold text-[#00d2ff] backdrop-blur-md transition hover:bg-[#00d2ff]/10"
          >
            Ver los 40 agentes
          </button>
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const { setLanguage } = useLanguage();
  const [lang, setLang] = useState<LandingLang>(() => getLandingLang());
  const [phase, setPhase] = useState<'slides' | 'dashboard' | 'agents'>('slides');

  const handleLangChange = useCallback(
    (next: LandingLang) => {
      setStoredLandingLang(next);
      setLang(next);
      setLanguage(landingLangToAppLanguage(next));
    },
    [setLanguage],
  );

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {phase === 'slides' && (
          <motion.div key="slides" exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.7 }}>
            <SlidesPhase lang={lang} onLangChange={handleLangChange} onDone={() => setPhase('dashboard')} />
          </motion.div>
        )}
        {phase === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <DashboardPhase lang={lang} onLangChange={handleLangChange} onAgents={() => setPhase('agents')} />
          </motion.div>
        )}
        {phase === 'agents' && (
          <motion.div
            key="agents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <TopBar lang={lang} onLangChange={handleLangChange} />
            <AgentEliteCarousel lang={lang} visualScale={1} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
