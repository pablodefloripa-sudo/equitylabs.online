import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, ChevronDown } from 'lucide-react';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { getLandingLang, setStoredLandingLang } from '@/components/landing/landingContent';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import data from '@/data/lifestyleAgents.json';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import {
  Lightbulb, GraduationCap, Rocket, Palette, TrendingUp, Target, Briefcase,
  DollarSign, Shield, Gem, Heart, Award, Compass, Crown as CrownIcon,
  Code, Megaphone, ShoppingBag, Layers, Search, Sparkles
} from 'lucide-react';

const agentsBg = '/slides/hero-bg.jpg';
const ACTIVE_AGENT_KEY = 'eq_active_agent_context';
const ENGINE = 'qwen/qwen3-vl-8b-thinking';

const agentIcons = [
  Lightbulb, GraduationCap, Rocket, Palette, TrendingUp, Target, Briefcase,
  DollarSign, Shield, Gem, Heart, Award, Compass, CrownIcon, Code, Megaphone,
  ShoppingBag, Layers, Search, Sparkles,
];

const BADGE_COLORS: Record<string, string> = {
  CAREER: 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10',
  ENTREPRENEURSHIP: 'border-[#ff007f]/30 text-[#ff007f] bg-[#ff007f]/10',
  BUSINESS: 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10',
  LIFESTYLE: 'border-white/20 text-white/60 bg-white/5',
  WELLNESS: 'border-[#ff007f]/30 text-[#ff007f] bg-[#ff007f]/10',
};

const landingLangToAppLanguage = (l: LandingLang): Language => {
  const map: Record<string, Language> = { es: 'ES', pt: 'PT', de: 'DE', it: 'IT', fr: 'FR', nl: 'NL', pl: 'PL' };
  return map[l] || 'EN';
};

const HERO_SLIDES = [
  { text: 'We use Advanced Artificial Intelligence to transform new ideas into high-performance, scalable products.',
    words: ['We', 'use', 'Advanced', 'Artificial', 'Intelligence', 'to', 'transform', 'new', 'ideas', 'into', 'high-performance,', 'scalable', 'products.'] },
  { text: 'We build advanced meta-learning systems that exponentially increase the speed and depth of knowledge acquisition, processing, and application for both humans and AI.',
    words: ['We', 'build', 'advanced', 'meta-learning', 'systems', 'that', 'exponentially', 'increase', 'the', 'speed', 'and', 'depth', 'of', 'knowledge', 'acquisition,', 'processing,', 'and', 'application', 'for', 'both', 'humans', 'and', 'AI.'] },
  { text: 'Global Model Routing Active · Authorization granted · System online · Strategic DNA integrated and mapped for COGNITIVE INTELLIGENCE',
    isStatus: true },
];

const HERO_SLIDE_SECONDS = 6;

/* ─── Hero ─── */
const HeroSection = ({ lang, onDone }: { lang: LandingLang; onDone: () => void }) => {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const doneRef = useRef(false);

  const nextSlide = useCallback(() => {
    setSlide(prev => {
      const next = prev + 1;
      if (next >= HERO_SLIDES.length) {
        if (!doneRef.current) { doneRef.current = true; setTimeout(onDone, 600); }
        return prev;
      }
      return next;
    });
  }, [onDone]);

  useEffect(() => {
    const t = setInterval(nextSlide, HERO_SLIDE_SECONDS * 1000);
    return () => clearInterval(t);
  }, [nextSlide]);

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      <div className="fixed inset-0 z-0">
        <img src={agentsBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent bg-[length:200%_100%] animate-[sweep_8s_ease-in-out_infinite] pointer-events-none" />
      </div>

      <div className="fixed inset-x-4 top-4 z-[100] flex justify-end">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/suscripciones')}
            className="flex h-10 items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 text-xs text-fuchsia-100 backdrop-blur-xl hover:border-fuchsia-300 transition">
            <Crown className="w-3.5 h-3.5" /> Ver suscripciones
          </button>
          <LanguageFloater className="relative" lang={lang} onChange={() => {}} />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center">
          <AnimatePresence mode="wait">
            {!HERO_SLIDES[slide].isStatus ? (
              <motion.h2 key={`t-${slide}`}
                initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl md:text-2xl lg:text-[36px] font-display font-bold leading-[1.2] tracking-tight mb-6 px-4">
                {HERO_SLIDES[slide].text.split(' ').map((w, i, arr) => {
                  const mid = Math.floor(arr.length / 2);
                  let c = 'text-white';
                  if (i === 0) c = 'text-[#00d2ff]';
                  else if (i === mid) c = 'text-[#ff007f]';
                  else if (i === arr.length - 1) c = 'text-[#00d2ff]';
                  return <span key={i} className={c}>{w} </span>;
                })}
              </motion.h2>
            ) : (
              <motion.div key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                  <span className="text-sm font-mono text-green-400/80 tracking-widest uppercase">System Status</span>
                </div>
                <div className="space-y-3">
                  {[
                    'Global Model Routing Active',
                    'Authorization granted',
                    'System online',
                    'Strategic DNA integrated and mapped for',
                  ].map((line, i) => (
                    <motion.p key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2, duration: 0.4 }}
                      className={`text-lg md:text-xl font-mono ${i === 0 ? 'text-[#00d2ff]' : i === 1 ? 'text-green-400/70' : i === 2 ? 'text-white/80' : 'text-white/60'}`}
                    >
                      <span className="text-[#00d2ff]/40 mr-3">{'>'}</span>
                      {line}
                    </motion.p>
                  ))}
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="text-2xl md:text-3xl font-display font-bold text-[#ff007f] mt-4"
                  >
                    COGNITIVE INTELLIGENCE
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-center gap-1.5 mt-8">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`h-1 rounded-full transition-all cursor-pointer ${i === slide ? 'w-8 bg-gradient-to-r from-[#00d4ff] to-[#ff00ff]' : 'w-1.5 bg-white/20'}`} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1 mt-6 opacity-40">
            <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">Select your Personal Agent</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/30 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Agent Card ─── */
interface AgentData {
  id: string; numId?: number; badge: string;
  name: Record<string, string>; mission: Record<string, string>;
}

const AgentCard = ({ agent, index, lang, onSelect }: {
  agent: AgentData; index: number; lang: string; onSelect: (a: AgentData) => void;
}) => {
  const Icon = agentIcons[index % agentIcons.length];
  const name = agent.name[lang] || agent.name.en;
  const mission = agent.mission[lang] || agent.mission.en;
  const badgeColor = BADGE_COLORS[agent.badge] || BADGE_COLORS.LIFESTYLE;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => onSelect(agent)}
      className="group flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition-all hover:border-[#00d2ff]/30 hover:bg-[#00d2ff]/5 hover:shadow-[0_0_20px_rgba(0,210,255,0.08)] cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] group-hover:bg-[#00d2ff]/20 transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-mono text-white/30">#{String(agent.numId || index + 1).padStart(2, '0')}</span>
      </div>
      <h3 className="text-sm font-display font-semibold text-white/90 leading-tight group-hover:text-white transition-colors">
        {name}
      </h3>
      <p className="text-[11px] text-white/40 leading-[1.3] line-clamp-2">{mission}</p>
      <span className={`self-start mt-0.5 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${badgeColor}`}>
        {agent.badge}
      </span>
    </motion.button>
  );
};

/* ─── Agent Grid ─── */
const AgentGrid = ({ lang }: { lang: LandingLang }) => {
  const agents = data.agents as AgentData[];
  const navigate = useNavigate();
  const activeLang = lang === 'en' ? 'en' : lang;

  const handleSelect = useCallback((agent: AgentData) => {
    const name = agent.name[activeLang] || agent.name.en;
    const persisted = { id: String(agent.id), name, engine: ENGINE, selectedAt: new Date().toISOString() };
    localStorage.setItem(ACTIVE_AGENT_KEY, JSON.stringify(persisted));
    navigate('/dashboard');
  }, [activeLang, navigate]);

  return (
    <div className="min-h-screen bg-black py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-display font-bold text-white/90">
            Select your <span className="text-[#00d2ff]">Personal</span> <span className="text-[#ff007f]">Agent</span>
          </h2>
          <p className="text-xs text-white/30 mt-1">Click on an agent to start working</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {agents.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} lang={activeLang} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Landing ─── */
const Landing = () => {
  const { setLanguage } = useLanguage();
  const [lang, setLang] = useState<LandingLang>(() => getLandingLang());
  const [phase, setPhase] = useState<'hero' | 'agents'>('hero');
  const visualScale = 1;

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {phase === 'hero' ? (
          <motion.div key="hero" exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.8 }}>
            <HeroSection lang={lang} onDone={() => setPhase('agents')} />
          </motion.div>
        ) : (
          <motion.div key="agents"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            {/* Top bar */}
            <div className="fixed inset-x-4 top-4 z-[100] flex justify-end">
              <div className="flex items-center gap-3">
                <button onClick={() => window.location.href = '/suscripciones'}
                  className="flex h-10 items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 text-xs text-fuchsia-100 backdrop-blur-xl hover:border-fuchsia-300 transition">
                  <Crown className="w-3.5 h-3.5" /> Ver suscripciones
                </button>
                <LanguageFloater className="relative" lang={lang}
                  onChange={(next) => { setStoredLandingLang(next); setLang(next); setLanguage(landingLangToAppLanguage(next)); }} />
              </div>
            </div>
            <AgentEliteCarousel lang={lang} visualScale={visualScale} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;