import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, SkipForward, Terminal, Code, Cpu, Activity, Clock, User, Loader2 } from 'lucide-react';
import type { LandingLang } from './LanguageFloater';

interface Props {
  lang: LandingLang;
  onComplete: () => void;
}

const SLOGANS: Record<LandingLang, string[]> = {
  en: ['Keep It Physically Outside of Your Reach', 'Your AI Workforce. One Dashboard.', 'From Vision to Execution in Seconds', 'Agents That Think. Systems That Scale.', 'EquityLabs — Build the Future.'],
  es: ['Mantenlo Físicamente Fuera de tu Alcance', 'Tu Fuerza Laboral IA. Un Solo Panel.', 'De la Visión a la Ejecución en Segundos', 'Agentes Que Piensan. Sistemas Que Escalan.', 'EquityLabs — Construye el Futuro.'],
  pt: ['Mantenha Fisicamente Fora do Seu Alcance', 'Sua Força de Trabalho IA. Um Único Painel.', 'Da Visão à Execução em Segundos', 'Agentes Que Pensam. Sistemas Que Escalam.', 'EquityLabs — Construa o Futuro.'],
  it: ['Tienilo Fisicamente Fuori dalla Tua Portata', 'La Tua Forza Lavoro AI. Una Sola Dashboard.', 'Dalla Visione all\'Esecuzione in Secondi', 'Agenti Che Pensano. Sistemi Che Scalano.', 'EquityLabs — Costruisci il Futuro.'],
  fr: ['Gardez-le Physiquement Hors de Portée', 'Votre Main-d\'Œuvre IA. Un Tableau de Bord.', 'De la Vision à l\'Exécution en Secondes', 'Des Agents Qui Pensent. Des Systèmes Qui Montent en Puissance.', 'EquityLabs — Construisez l\'Avenir.'],
  de: ['Halte es Physisch außerhalb deiner Reichweite', 'Deine KI-Belegschaft. Ein Dashboard.', 'Von der Vision zur Umsetzung in Sekunden', 'Agenten, die Denken. Systeme, die Skalieren.', 'EquityLabs — Baue die Zukunft.'],
  pl: ['Trzymaj to Fizycznie Poza Zasięgiem', 'Twoja Siła Robocza AI. Jeden Panel.', 'Od Wizji do Realizacji w Sekundach', 'Agenci, Którzy Myślą. Systemy, Które Skalują.', 'EquityLabs — Buduj Przyszłość.'],
  nl: ['Houd het Fysiek Buiten Handbereik', 'Je AI-Werknemers. Eén Dashboard.', 'Van Visie naar Uitvoering in Seconden', 'Agenten die Denken. Systemen die Schalen.', 'EquityLabs — Bouw de Toekomst.'],
};

const LOGO_SECONDS = 12;
const SLIDE_SECONDS = 12;
const TOTAL_CYCLES = 6;

/* ─── Scan line overlay ─── */
const ScanLines = () => (
  <div className="absolute inset-0 pointer-events-none z-[3]" style={{
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)'
  }} />
);

/* ─── Vignette + gradients ─── */
const Vignette = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-t from-[#050510]/90 via-transparent to-[#050510]/60 z-[2] pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#050510]/80 via-transparent to-[#050510]/80 z-[2] pointer-events-none" />
  </>
);

/* ─── HUD corner brackets ─── */
const HudCorners = () => (
  <div className="absolute inset-0 pointer-events-none z-[6]">
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M5 20V5H20" stroke="#00d4ff" strokeWidth="0.3" fill="none" opacity="0.4" />
      <path d="M5 15V5H15" stroke="#ff00ff" strokeWidth="0.2" fill="none" opacity="0.2" />
      <path d="M95 20V5H80" stroke="#00d4ff" strokeWidth="0.3" fill="none" opacity="0.4" />
      <path d="M95 15V5H85" stroke="#ff00ff" strokeWidth="0.2" fill="none" opacity="0.2" />
      <path d="M5 80V95H20" stroke="#00d4ff" strokeWidth="0.3" fill="none" opacity="0.4" />
      <path d="M5 85V95H15" stroke="#ff00ff" strokeWidth="0.2" fill="none" opacity="0.2" />
      <path d="M95 80V95H80" stroke="#00d4ff" strokeWidth="0.3" fill="none" opacity="0.4" />
      <path d="M95 85V95H85" stroke="#ff00ff" strokeWidth="0.2" fill="none" opacity="0.2" />
    </svg>
  </div>
);

/* ─── PANEL 1 (arriba derecha) — Onboarding Agent con loading bar ─── */
const OnboardingPane = () => {
  const [loadPct, setLoadPct] = useState(0);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    const loadTimer = setInterval(() => {
      setLoadPct(prev => Math.min(prev + Math.random() * 8, 100));
    }, 400);
    return () => { clearInterval(timer); clearInterval(loadTimer); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="absolute top-6 right-6 z-[7] w-80 md:w-96 rounded-lg border border-cyan-500/20 bg-black/70 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.08)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-cyan-400/70" />
          <span className="text-[10px] text-cyan-400/60 font-mono tracking-wider uppercase">Onboarding Agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-cyan-400/40" />
          <span className="text-[10px] text-cyan-400/50 font-mono">{timeStr || '--:--:--'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-3 space-y-2">
        {/* Title */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-[11px] font-display font-semibold text-white/80 flex items-center gap-2"
        >
          <Loader2 className="w-3 h-3 text-[#00d2ff] animate-spin" />
          Agent EquityLabs starting configuration
        </motion.p>

        {/* Steps */}
        <div className="space-y-1.5">
          {[
            { label: 'Loading system modules...', done: loadPct > 10 },
            { label: 'Configuring agent network...', done: loadPct > 30 },
            { label: 'Syncing model registry...', done: loadPct > 55 },
            { label: 'Initializing toolsets...', done: loadPct > 75 },
            { label: 'Agent ready — awaiting commands', done: loadPct > 92 },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.2 }}
              className="flex items-center gap-2"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${step.done ? 'bg-[#00d2ff] shadow-[0_0_6px_rgba(0,210,255,0.5)]' : 'bg-white/10'} transition-all duration-500`} />
              <span className={`text-[10px] font-mono ${step.done ? 'text-white/70' : 'text-white/30'} transition-all duration-500`}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Loading Bar */}
        <div className="pt-2">
          <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
            <span>Loading configuration</span>
            <span>{Math.round(loadPct)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#00d2ff] via-[#7b2ff7] to-[#ff007f]"
              style={{ width: `${loadPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── PANEL 2 (abajo izquierda, mismo tamaño) — JSON skills loading ─── */
const SkillsJsonPane = () => {
  const [visibleLines, setVisibleLines] = useState(0);
  const allLines = [
    '{',
    '  "agent": {',
    '    "skills": [',
    '      { "id": "web-search", "status": "loading" },',
    '      { "id": "github-pr", "status": "loading" },',
    '      { "id": "code-review", "status": "loading" },',
    '      { "id": "vision", "status": "loading" },',
    '      { "id": "humanizer", "status": "loading" },',
    '      { "id": "debugging", "status": "loading" },',
    '      { "id": "cronjobs", "status": "loading" },',
    '      { "id": "reports", "status": "loading" },',
    '      { "id": "planning", "status": "pending" },',
    '      { "id": "airtable", "status": "pending" }',
    '    ]',
    '  }',
    '}',
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setVisibleLines(prev => Math.min(prev + 1, allLines.length));
    }, 300);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="absolute left-6 bottom-6 z-[7] w-80 md:w-96 rounded-lg border border-[#ff007f]/20 bg-black/70 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(255,0,127,0.08)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#ff007f]/10">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-[#ff007f]/70" />
          <span className="text-[10px] text-[#ff007f]/60 font-mono tracking-wider uppercase">Agent Skills Registry</span>
        </div>
        <span className="text-[9px] text-white/20 font-mono">JSON v2.1</span>
      </div>

      {/* JSON content */}
      <div className="px-3 py-2 font-mono text-[11px] leading-relaxed max-h-40 overflow-hidden">
        {allLines.slice(0, visibleLines).map((line, i) => {
          let color = 'text-white/40';
          if (line.includes('"web-search"') || line.includes('"github-pr"') || line.includes('"code-review"')) color = 'text-cyan-300/70';
          else if (line.includes('"vision"') || line.includes('"humanizer"') || line.includes('"debugging"')) color = 'text-purple-300/70';
          else if (line.includes('"cronjobs"') || line.includes('"reports"') || line.includes('"planning"')) color = 'text-green-300/70';
          else if (line.includes('"status"')) color = 'text-yellow-300/60';
          else if (line.includes('{') || line.includes('}') || line.includes('[') || line.includes(']')) color = 'text-white/50';
          else if (line.includes('"agent"') || line.includes('"skills"')) color = 'text-[#ff007f]/70';

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={color}
            >
              {line}
            </motion.div>
          );
        })}
        {visibleLines < allLines.length && (
          <motion.span
            className="inline-block w-2 h-4 bg-[#ff007f]/50 ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>

      {/* Mini progress */}
      <div className="px-3 pb-2">
        <div className="h-[1px] bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#ff007f] to-[#00d2ff]"
            style={{ width: `${(visibleLines / allLines.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] font-mono text-white/20">
          <span>skills.json</span>
          <span>{visibleLines}/{allLines.length} lines</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── PANEL 3 (abajo derecha) — Leather image display ─── */
const LeatherPane = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1.8, duration: 0.8 }}
    className="absolute right-6 bottom-6 z-[7] w-48 md:w-56 rounded-lg border border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.04)]"
  >
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
      <span className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Texture</span>
      <span className="ml-auto text-[9px] text-white/20 font-mono">leather</span>
    </div>
    <div className="relative">
      <img
        src="/slides/leather-bg.jpg"
        alt="Leather texture"
        className="w-full h-32 md:h-40 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  </motion.div>
);

export const LandingIntro = ({ lang, onComplete }: Props) => {
  const [currentLang, setCurrentLang] = useState(lang);
  const [phase, setPhase] = useState<'logo' | 'slides'>('logo');
  const [slide, setSlide] = useState(0);
  const [showSlogan, setShowSlogan] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slogans = SLOGANS[currentLang] || SLOGANS.en;

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = (seconds: number, onDone: () => void) => {
    clearTimer();
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const pct = Math.min((Date.now() - start) / (seconds * 1000), 1);
      setProgress(pct);
      if (pct >= 1) { clearTimer(); onDone(); }
    }, 50);
  };

  useEffect(() => {
    if (phase === 'logo') {
      startTimer(LOGO_SECONDS, () => {
        setPhase('slides');
        setSlide(0);
        setShowSlogan(true);
      });
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'slides') {
      setShowSlogan(true);
      startTimer(SLIDE_SECONDS, () => {
        const next = slide + 1;
        if (next >= 5) onComplete();
        else { setSlide(next); setShowSlogan(false); setTimeout(() => setShowSlogan(true), 400); }
      });
    }
    return clearTimer;
  }, [phase, slide]);

  const go = (dir: 1 | -1) => {
    if (phase === 'logo') return;
    const next = slide + dir;
    if (next < 0) return;
    if (next >= 5) { onComplete(); return; }
    setSlide(next); setShowSlogan(false);
    setTimeout(() => setShowSlogan(true), 400);
  };

  useEffect(() => clearTimer, []);

  const isLogo = phase === 'logo';

  return (
    <div className="fixed inset-0 z-50 bg-[#050510] overflow-hidden">
      {/* ─── Background ─── */}
      <div className="absolute inset-0 z-0">
        <img src="/slides/leather-bg.jpg" alt="" className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-[#050510]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent bg-[length:200%_100%] animate-[sweep_8s_ease-in-out_infinite] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-500/[0.02] to-transparent bg-[length:100%_200%] animate-[sweepVertical_12s_ease-in-out_infinite] pointer-events-none" />
      </div>

      <ScanLines />
      <Vignette />
      <HudCorners />

      {/* ─── Paneles ─── */}
      {isLogo && (
        <>
          <OnboardingPane />
          <SkillsJsonPane />
          <LeatherPane />
        </>
      )}

      {/* ─── Language selector ─── */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector lang={currentLang} onChange={setCurrentLang} />
      </div>

      {/* ─── Skip ─── */}
      <button onClick={onComplete}
        className="absolute top-4 left-4 z-50 px-4 py-2 rounded-full border border-cyan-500/20 bg-black/40 backdrop-blur-xl text-cyan-400/50 text-xs font-mono tracking-wider hover:border-cyan-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5">
        <SkipForward className="w-3.5 h-3.5" /> SKIP
      </button>

      {/* ─── Main content ─── */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {isLogo && (
            <motion.div key="logo-phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6">
              <div className="relative">
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ boxShadow: '0 0 80px rgba(0,212,255,0.15)' }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.img src="/slides/leather-bg.jpg" alt="EquityLabs"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover ring-1 ring-cyan-500/20"
                  initial={{ scale: 0.3, opacity: 0, filter: 'blur(10px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
              </div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="text-[#00d2ff]">EQUITY</span><span className="text-white">LABS</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }}
                className="text-sm md:text-base text-cyan-400/50 font-mono tracking-[0.3em] uppercase">
                Multi-Agent AI Platform
              </motion.p>
              <motion.div className="h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent"
                initial={{ width: '0%' }} animate={{ width: ['0%', '50%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isLogo && (
            <motion.div key={`slide-${slide}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }} className="absolute inset-0 flex items-center justify-center px-8">
              <div className="relative z-10 max-w-6xl mx-auto text-center">
                <motion.div key={slogans[slide]}
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                  animate={showSlogan ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                  <h2 className="text-5xl md:text-[86px] font-display font-bold leading-[1.1] tracking-tight">
                    {slogans[slide].split(' ').map((word, i, arr) => {
                      const mid = Math.floor(arr.length / 2);
                      let colorClass = 'text-white';
                      if (i === 0) colorClass = 'text-[#00d2ff]';
                      else if (i === mid) colorClass = 'text-[#ff007f]';
                      else if (i === arr.length - 1) colorClass = 'text-[#00d2ff]';
                      return <span key={i} className={colorClass}>{word} </span>;
                    })}
                  </h2>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="mt-8 flex items-center justify-center gap-3">
                  <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500/30" />
                  <span className="text-xs text-cyan-400/40 font-mono tracking-[0.4em] uppercase">0{slide + 1} / 05</span>
                  <span className="h-[1px] w-8 bg-gradient-to-r from-cyan-500/30 to-transparent" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Navigation arrows ─── */}
      {!isLogo && (
        <>
          <button onClick={() => go(-1)} disabled={slide === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-cyan-500/20 bg-black/30 backdrop-blur-xl text-cyan-400 hover:border-cyan-400 hover:bg-black/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => go(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-cyan-500/20 bg-black/30 backdrop-blur-xl text-cyan-400 hover:border-cyan-400 hover:bg-black/50 transition-all cursor-pointer">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* ─── Progress ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: TOTAL_CYCLES }).map((_, i) => {
            const isActive = (isLogo && i === 0) || (!isLogo && i === slide + 1);
            const isPast = (!isLogo && i < slide + 1);
            return (
              <button key={i} onClick={() => { if (i > 0 && !isLogo) { setSlide(i - 1); setShowSlogan(false); setTimeout(() => setShowSlogan(true), 400); } }}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${isActive ? 'w-12 bg-gradient-to-r from-[#00d4ff] to-[#ff00ff]' : isPast ? 'w-3 bg-cyan-500/30' : 'w-3 bg-cyan-500/10 hover:bg-cyan-500/20'}`} />
            );
          })}
        </div>
        <motion.div className="h-[1.5px] bg-gradient-to-r from-[#00d4ff] via-[#7b2ff7] to-[#ff00ff]" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
};

/* ─── Language Selector ─── */
const LanguageSelector = ({ lang, onChange }: { lang: LandingLang; onChange: (l: LandingLang) => void }) => {
  const [open, setOpen] = useState(false);
  const flags: Record<LandingLang, string> = {
    en: '🇺🇸', es: '🇪🇸', it: '🇮🇹', pt: '🇧🇷', fr: '🇫🇷',
    de: '🇩🇪', pl: '🇵🇱', nl: '🇳🇱',
  };
  const allLangs = Object.keys(flags) as LandingLang[];
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-black/30 px-3 py-1.5 text-xs tracking-wide text-cyan-400/70 backdrop-blur-xl hover:border-cyan-400 hover:text-cyan-300 transition-all cursor-pointer">
        <span>{flags[lang]}</span><span className="uppercase font-mono">{lang}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="absolute right-0 top-10 min-w-[160px] overflow-hidden rounded-lg border border-cyan-500/20 bg-black/80 shadow-2xl backdrop-blur-xl">
              {allLangs.filter(l => l !== lang).map(l => (
                <button key={l} onClick={() => { onChange(l); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-cyan-300/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all">
                  <span className="text-sm">{flags[l]}</span><span className="font-mono uppercase">{l}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};