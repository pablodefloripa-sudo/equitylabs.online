import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, ChevronLeft, ChevronRight, SkipForward, ArrowRight } from 'lucide-react';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { getLandingLang, setStoredLandingLang } from '@/components/landing/landingContent';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import HermesConsole from '@/components/landing/HermesConsole';

/* ─── Slides de la landing (Canva export, 1920×1080) ─── */
const LANDING_SLIDES = [
  '/slides/landing/1.png',
  '/slides/landing/2.png',
  '/slides/landing/3.png',
  '/slides/landing/4.png',
  '/slides/landing/5.png',
];
// Las slides 1-4 se muestran en secuencia; la 5 (dashboard operacional) queda FIJA.
const INTRO_SLIDE_COUNT = 4;
const SLIDE_SECONDS = 5;

const landingLangToAppLanguage = (l: LandingLang): Language => {
  const map: Record<string, Language> = { es: 'ES', pt: 'PT', de: 'DE', it: 'IT', fr: 'FR', nl: 'NL', pl: 'PL' };
  return map[l] || 'EN';
};

/* ─── Top bar (suscripciones + idioma) ─── */
const TopBar = ({ lang, onLangChange }: { lang: LandingLang; onLangChange: (l: LandingLang) => void }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-x-4 top-4 z-[100] flex justify-end">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/suscripciones')}
          className="flex h-10 items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 text-xs text-fuchsia-100 backdrop-blur-xl hover:border-fuchsia-300 transition">
          <Crown className="w-3.5 h-3.5" /> Ver suscripciones
        </button>
        <LanguageFloater className="relative" lang={lang} onChange={onLangChange} />
      </div>
    </div>
  );
};

/* ─── Fase 1: slides 1-4 en secuencia ─── */
const SlidesPhase = ({ lang, onLangChange, onDone }: {
  lang: LandingLang; onLangChange: (l: LandingLang) => void; onDone: () => void;
}) => {
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const doneRef = useRef(false);
  idxRef.current = idx;

  const go = useCallback((next: number) => {
    if (next >= INTRO_SLIDE_COUNT) {
      if (!doneRef.current) { doneRef.current = true; onDone(); }
      return;
    }
    setIdx(Math.max(0, next));
  }, [onDone]);

  useEffect(() => {
    const t = setInterval(() => go(idxRef.current + 1), SLIDE_SECONDS * 1000);
    return () => clearInterval(t);
  }, [go]);

  const img = LANDING_SLIDES[idx];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Slide actual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={img} alt={`EQuityLabs slide ${idx + 1}`} className="w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      {/* Barrido de luz sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent bg-[length:200%_100%] animate-[sweep_10s_ease-in-out_infinite] pointer-events-none" />

      <TopBar lang={lang} onLangChange={onLangChange} />

      {/* Flechas */}
      <button onClick={() => go(idx - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-md hover:border-[#00d2ff]/60 hover:text-[#00d2ff] transition disabled:opacity-20"
        disabled={idx === 0} aria-label="Anterior">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => go(idx + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-md hover:border-[#00d2ff]/60 hover:text-[#00d2ff] transition"
        aria-label="Siguiente">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Saltar intro */}
      <button onClick={onDone}
        className="absolute bottom-8 right-6 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-md hover:text-white hover:border-[#ff007f]/60 transition">
        Saltar intro <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* Dots de progreso (4 slides + dashboard final) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {LANDING_SLIDES.map((_, i) => (
          <button key={i} onClick={() => (i < INTRO_SLIDE_COUNT ? setIdx(i) : onDone())}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              i === idx ? 'w-9 bg-gradient-to-r from-[#00d4ff] to-[#ff00ff]'
              : i === INTRO_SLIDE_COUNT ? 'w-2 bg-white/25 hover:bg-white/50'
              : 'w-2 bg-white/25 hover:bg-white/50'
            }`} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      {/* Contador */}
      <div className="absolute bottom-8 left-6 z-20 font-mono text-[11px] text-white/40 tracking-widest">
        {String(idx + 1).padStart(2, '0')} / {String(INTRO_SLIDE_COUNT).padStart(2, '0')}
      </div>
    </div>
  );
};

/* ─── Fase 2: dashboard operacional (slide 5 fija) + communication center ─── */
const DashboardPhase = ({ lang, onLangChange, onAgents }: {
  lang: LandingLang; onLangChange: (l: LandingLang) => void; onAgents: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* Slide 5 fija = dashboard operacional (fondo con franja negra para la consola) */}
      <img src="/slides/landing/hermes-console-bg.png" alt="EQuityLabs Dashboard" className="fixed inset-0 w-full h-full object-cover object-top" />
      {/* Veladura sutil para legibilidad del chat */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />

      <TopBar lang={lang} onLangChange={onLangChange} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-5">
        {/* Encabezado */}
        <div className="mb-4 text-center">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#00d2ff]/90 mb-2 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00d2ff] animate-pulse" />
            Command Center · en vivo
          </p>
          <h1 className="font-display text-2xl md:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Probá el <span className="text-[#00d2ff]">dashboard</span> sin registrarte
          </h1>
        </div>

        {/* HERMES OS — consola de comandos sobre la franja negra */}
        <HermesConsole lang={lang === 'en' ? 'en' : 'es'} />

        {/* CTAs */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => navigate('/auth')}
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#8a2be2] to-[#ff007f] px-6 text-sm font-bold text-white border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.6)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.6)] hover:brightness-110 transition">
            Empezar gratis <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onAgents}
            className="flex h-11 items-center rounded-xl border-2 border-[#00d2ff]/60 bg-black/50 px-6 text-sm font-bold text-[#00d2ff] backdrop-blur-md hover:bg-[#00d2ff]/10 transition">
            Ver los 40 agentes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Landing ─── */
const Landing = () => {
  const { setLanguage } = useLanguage();
  const [lang, setLang] = useState<LandingLang>(() => getLandingLang());
  const [phase, setPhase] = useState<'slides' | 'dashboard' | 'agents'>('slides');

  const handleLangChange = useCallback((next: LandingLang) => {
    setStoredLandingLang(next);
    setLang(next);
    setLanguage(landingLangToAppLanguage(next));
  }, [setLanguage]);

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {phase === 'slides' && (
          <motion.div key="slides" exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.7 }}>
            <SlidesPhase lang={lang} onLangChange={handleLangChange} onDone={() => setPhase('dashboard')} />
          </motion.div>
        )}
        {phase === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <DashboardPhase lang={lang} onLangChange={handleLangChange} onAgents={() => setPhase('agents')} />
          </motion.div>
        )}
        {phase === 'agents' && (
          <motion.div key="agents"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <TopBar lang={lang} onLangChange={handleLangChange} />
            <AgentEliteCarousel lang={lang} visualScale={1} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
