import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Target,
  Briefcase,
  Heart,
  Gem,
  GraduationCap,
  TrendingUp,
  Lightbulb,
  Rocket,
  Award,
  Compass,
  Palette,
  Crown,
  ShoppingBag,
  DollarSign,
  Code,
  Megaphone,
  Search,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GhostTyper } from './GhostTyper';
import type { LandingLang } from './LanguageFloater';
import data from '@/data/lifestyleAgents.json';
import { resolveLandingLang } from './landingContent';
import { getLandingPlanCopy } from './siteCopy';

const agentIcons = [
  Lightbulb,
  GraduationCap,
  Rocket,
  Palette,
  TrendingUp,
  Target,
  Briefcase,
  DollarSign,
  Shield,
  Gem,
  Heart,
  Award,
  Compass,
  Crown,
  Code,
  Megaphone,
  ShoppingBag,
  Layers,
  Search,
  Shield,
];

const badgeColors: Record<string, string> = {
  CAREER: 'from-cyan-400/20 to-cyan-500/10 text-cyan-200 border-cyan-300/35',
  ENTREPRENEURSHIP: 'from-yellow-400/20 to-yellow-500/10 text-yellow-200 border-yellow-300/35',
  BUSINESS: 'from-emerald-400/20 to-emerald-500/10 text-emerald-200 border-emerald-300/35',
  LIFESTYLE: 'from-red-400/20 to-red-500/10 text-red-200 border-red-300/35',
  WELLNESS: 'from-red-400/20 to-yellow-400/10 text-red-200 border-red-300/35',
};

const accentCards = [
  {
    border: 'border-emerald-300/25',
    bg: 'bg-emerald-300/10',
    title: 'text-emerald-200',
    body: 'text-emerald-50/68',
  },
  {
    border: 'border-yellow-300/25',
    bg: 'bg-yellow-300/10',
    title: 'text-yellow-200',
    body: 'text-yellow-50/68',
  },
  {
    border: 'border-red-300/25',
    bg: 'bg-red-300/10',
    title: 'text-red-200',
    body: 'text-red-50/68',
  },
];

interface Props {
  lang: LandingLang;
  visualScale: number;
}

const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';
const SINGLE_AGENT_ENGINE = 'qwen/qwen3-vl-8b-thinking';

type Agent = {
  id: string | number;
  numId?: string | number;
  badge: string;
  name: Record<string, string>;
  mission: Record<string, string>;
  freeModels?: string[];
  proModels?: string[];
  freeTasks?: Record<string, string[]>;
  proTasks?: Record<string, string[]>;
};

export const AgentEliteCarousel = ({ lang, visualScale }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const agents = data.agents as Agent[];
  const activeLang = resolveLandingLang(lang);
  const phrases = (data.heroPhrase as Record<string, string[]>)[activeLang] || data.heroPhrase.en;
  const ui = (data.ui as Record<string, Record<string, string>>)[activeLang] || data.ui.en;
  const planCopy = getLandingPlanCopy(activeLang);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (hoveredIdx !== null) return;
      setActiveIndex((previous) => (previous + 1) % agents.length);
    }, 6000);
  }, [agents.length, hoveredIdx]);

  useEffect(() => {
    resetAuto();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [resetAuto]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeIndex, activeLang]);

  const go = (dir: number) => {
    setActiveIndex((previous) => (previous + dir + agents.length) % agents.length);
    resetAuto();
  };

  const handleFree = () => {
    const agent = agents[activeIndex];
    const name = (agent.name as Record<string, string>)[activeLang] || agent.name.en;
    const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
    const freeTasks = freeTasksMap[activeLang] || freeTasksMap.en || [];
    const persistedAgent = {
      id: String(agent.id),
      name,
      engine: (agent.engines as Record<string, string> | undefined)?.free || SINGLE_AGENT_ENGINE,
      tasks: freeTasks,
      skills: (agent.skills as string[] | undefined) || [],
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify(persistedAgent));
    navigate('/dashboard');
  };

  const handleUpgrade = () => {
    const agent = agents[activeIndex];
    const name = (agent.name as Record<string, string>)[activeLang] || agent.name.en;
    const proTasksMap = (agent.proTasks || {}) as Record<string, string[]>;
    const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
    const tasks = proTasksMap[activeLang] || proTasksMap.en || freeTasksMap[activeLang] || freeTasksMap.en || [];
    const persistedAgent = {
      id: String(agent.id),
      name,
      engine: (agent.engines as Record<string, string> | undefined)?.pro || SINGLE_AGENT_ENGINE,
      tasks,
      skills: (agent.skills as string[] | undefined) || [],
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify(persistedAgent));
    navigate('/dashboard');
  };

  const getVisible = () => {
    const result = [];
    for (let i = -2; i <= 2; i += 1) {
      result.push((activeIndex + i + agents.length) % agents.length);
    }
    return result;
  };

  const visible = getVisible();
  const heroBandHeight = '15vh';
  const heroBandMinHeight = '108px';
  const heroBottomOffset = '12px';

  return (
    <div
      ref={viewportRef}
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto pb-4"
    >
      <div
        className="pointer-events-none relative z-0 flex items-start justify-center"
        style={{
          minHeight: heroBandMinHeight,
          height: heroBandHeight,
          marginBottom: heroBottomOffset,
        }}
      >
        <GhostTyper
          text={phrases[activeIndex % phrases.length]}
          isActive
          visualScale={visualScale}
          key={`${activeIndex}-${activeLang}-${visualScale}`}
        />
      </div>

      <div className="relative z-20 flex min-h-0 flex-1 flex-col items-center px-3">
        <div className="relative flex min-h-[660px] w-full max-w-7xl flex-1 items-start justify-center pb-2">
          <AnimatePresence mode="popLayout">
            {visible.map((idx, pos) => {
              const agent = agents[idx];
              const Icon = agentIcons[idx % agentIcons.length];
              const offset = pos - 2;
              const isCenter = offset === 0;
              const isHovered = hoveredIdx === idx;
              const name = (agent.name as Record<string, string>)[activeLang] || agent.name.en;
              const mission = (agent.mission as Record<string, string>)[activeLang] || agent.mission.en;
              const badge = badgeColors[agent.badge] || badgeColors.LIFESTYLE;
              const freeModels: string[] = agent.freeModels || [];
              const proModels: string[] = agent.proModels || [];
              const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
              const proTasksMap = (agent.proTasks || {}) as Record<string, string[]>;
              const freeTasks: string[] = freeTasksMap[activeLang] || freeTasksMap.en || [];
              const proTasks: string[] = proTasksMap[activeLang] || proTasksMap.en || [];
              const baseScale = isCenter ? visualScale : 0.56 - Math.abs(offset) * 0.04;
              const finalScale = baseScale;

              return (
                <motion.div
                  key={`${agent.id}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isCenter || isHovered ? 1 : 0.35 + 0.12 * (2 - Math.abs(offset)),
                    scale: finalScale,
                    x: offset * (isCenter ? 0 : 480),
                    zIndex: isHovered ? 40 : isCenter ? 30 : 20 - Math.abs(offset),
                    rotateY: offset * -5,
                  }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className="absolute"
                  style={{ perspective: '1000px' }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div
                    className={[
                      'w-full overflow-hidden rounded-lg border transition-all duration-500',
                      isCenter
                        ? 'border-cyan-300/45 bg-[linear-gradient(135deg,rgba(3,24,33,0.96),rgba(8,38,49,0.9)_45%,rgba(11,17,33,0.94))]'
                        : isHovered
                          ? 'border-yellow-300/45 bg-[#0b2029]/85'
                          : 'border-white/8 bg-[#071820]/78',
                    ].join(' ')}
                    style={
                      isCenter
                        ? { boxShadow: '0 22px 70px rgba(0,0,0,0.48), 0 0 34px rgba(34,211,238,0.22)', width: 'min(92vw, 1000px)' }
                        : isHovered
                          ? { boxShadow: '0 0 34px rgba(250,204,21,0.22)' }
                          : undefined
                    }
                  >
                    <div className="p-3.5 pb-3 sm:p-4 sm:pb-3">
                      <div className="mb-3 flex flex-col gap-2.5 border-b border-cyan-300/16 pb-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3.5">
                        <div
                          className={`flex shrink-0 items-center justify-center rounded-lg ${
                            isCenter ? 'h-12 w-12' : 'h-12 w-12'
                          } ${
                            isCenter ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-300/35' : 'bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <Icon className={isCenter ? 'h-6 w-6' : 'h-6 w-6'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-mono ${isCenter ? 'text-[13px] md:text-[14px] text-cyan-200/90' : 'text-[11px] text-yellow-200/78'}`}>
                              #{String(agent.numId || idx + 1).padStart(2, '0')}
                            </span>
                            <h3 className={`font-display font-bold leading-tight ${isCenter ? 'text-[24px] md:text-[28px] text-white' : 'text-[18px] md:text-[1.3rem] text-slate-300/85'}`}>
                              {name}
                            </h3>
                          </div>
                          <span className={`mt-1 inline-block rounded-full border bg-gradient-to-r font-bold uppercase ${isCenter ? 'px-2.5 py-0.5 text-[10px] tracking-[0.14em]' : 'px-2.5 py-1 text-[10px]'} ${badge}`}>
                            {agent.badge}
                          </span>
                        </div>
                        </div>

                        {isCenter ? (
                          <div className="grid shrink-0 grid-cols-3 gap-2">
                            {planCopy.paidHighlights.map((item, index) => (
                              <div
                                key={item}
                                className={[
                                  'rounded-lg border px-3 py-2 text-center',
                                  index === 0
                                    ? 'border-cyan-300/35 bg-cyan-300/12'
                                    : index === 1
                                      ? 'border-amber-300/40 bg-amber-300/13'
                                      : 'border-rose-300/40 bg-rose-300/13',
                                ].join(' ')}
                              >
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
                                  {index === 0 ? 'Start' : index === 1 ? 'Scale' : 'Lead'}
                                </p>
                                <p className="mt-1 text-[15px] font-black leading-none text-white md:text-[18px]">
                                  {item}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <p className={`mb-2.5 ${isCenter ? 'max-w-5xl text-[14px] md:text-[15px] leading-[1.4] text-cyan-50/92' : 'line-clamp-2 text-[14px] md:text-[15px] leading-relaxed text-slate-300/68'}`}>
                        {mission}
                      </p>

                      {isCenter ? (
                        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
                          <div className="flex h-full flex-col rounded-lg border border-emerald-300/35 bg-[linear-gradient(145deg,rgba(16,185,129,0.18),rgba(4,120,87,0.08))] p-3">
                            <div className="mb-2.5 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-emerald-300/18 px-2.5 py-1 text-[12px] md:text-[13px] font-bold tracking-wider text-emerald-100">
                                {planCopy.trialLabel}
                              </span>
                              <span className="rounded-full border border-cyan-300/25 px-2.5 py-1 text-[11px] md:text-[12px] font-semibold tracking-wide text-cyan-50/90">
                                {planCopy.freeLabel}
                              </span>
                            </div>

                            <ul className="space-y-1.5">
                              {freeTasks.map((task, index) => (
                                <li key={index} className="flex gap-2 text-[13px] md:text-[14px] leading-[1.35] text-emerald-50/92">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-200" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-auto grid gap-1.5 pt-2.5 sm:grid-cols-3">
                              {planCopy.freeHighlights.map((item, index) => {
                                const accent = accentCards[index % accentCards.length];
                                return (
                                <div
                                  key={item.title}
                                  className={`flex h-full flex-col rounded-lg border px-2 py-1.5 ${accent.border} ${accent.bg}`}
                                >
                                    <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.08em] ${accent.title}`}>
                                    {item.title}
                                  </p>
                                    <p className={`mt-0.5 text-[10px] md:text-[11px] leading-[1.3] ${accent.body}`}>
                                    {item.detail}
                                  </p>
                                </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex h-full flex-col rounded-lg border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(34,211,238,0.18),rgba(168,85,247,0.11)_55%,rgba(250,204,21,0.1))] p-3">
                            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                              <span className="rounded-md bg-cyan-300/18 px-2.5 py-1 text-[12px] md:text-[13px] font-bold tracking-wider text-cyan-100">
                                {planCopy.paidLabel}
                              </span>
                              <span className="rounded-full border border-amber-300/40 bg-amber-300/14 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">
                                Upgrade
                              </span>
                            </div>

                            <ul className="grid gap-x-4 gap-y-1.5 xl:grid-cols-2">
                              {proTasks.map((task, index) => (
                                <li key={index} className="flex gap-2 text-[13px] md:text-[14px] leading-[1.35] text-cyan-50/94">
                                  <CheckCircle2 className={index % 4 === 0 ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200' : index % 4 === 1 ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-200' : index % 4 === 2 ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200' : 'mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-200'} />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-auto grid gap-1.5 pt-2.5 sm:grid-cols-3">
                              {planCopy.paidHighlights.map((item, index) => (
                                <span
                                  key={item}
                                  className={[
                                    'rounded-lg border px-2 py-1.5 text-center text-[12px] md:text-[13px] font-black tracking-wide',
                                    index === 0
                                      ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100/90'
                                      : index === 1
                                        ? 'border-amber-300/25 bg-amber-300/10 text-amber-100/90'
                                        : 'border-rose-300/25 bg-rose-300/10 text-rose-100/90',
                                  ].join(' ')}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 opacity-60">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400">{ui.free}</span>
                            <span className="truncate font-mono text-slate-300/72">{freeModels.join(' - ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="rounded bg-cyan-400/20 px-2 py-0.5 font-bold text-cyan-300">{planCopy.paidLabel}</span>
                            <span className="truncate font-mono text-cyan-200/82">{proModels[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 px-2.5 pb-2.5 sm:flex-row sm:px-2.5"
                      >
                        <button
                          onClick={handleFree}
                          className="flex-1 rounded-lg border border-emerald-300/40 bg-emerald-300/15 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100 transition-all hover:bg-emerald-300/25"
                        >
                          {planCopy.freeCta}
                        </button>
                        <button
                          onClick={handleUpgrade}
                          className="flex-1 rounded-lg border border-cyan-300/70 bg-black/45 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100 transition-all hover:border-yellow-200/70 hover:text-yellow-100"
                          style={{ boxShadow: '0 0 18px rgba(34,211,238,0.4), inset 0 0 12px rgba(34,211,238,0.08)' }}
                        >
                          <span className="flex items-center justify-center gap-1">{planCopy.upgradeCta}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <button
            onClick={() => go(-1)}
            className="absolute left-2 md:left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:text-white hover:border-[#b49664]/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 md:right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:text-white hover:border-[#b49664]/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex gap-1.5">
          {agents.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                resetAuto();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
