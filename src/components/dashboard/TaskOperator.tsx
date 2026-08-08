import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Brain,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Code2,
  Copy,
  Folder,
  FolderOpen,
  Megaphone,
  Plus,
  Rocket,
  Sparkles,
  Star,
  Target,
  Thermometer,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { useLanguage } from '@/hooks/useLanguage';

type OperationMode = 'seo' | 'fullstack' | 'copywriter' | 'debug';
type CreativityLevel = 'precision' | 'balanced' | 'brainstorm';

type DashboardContext = {
  activeAgent?: {
    id?: string;
    name?: string;
    engine?: string;
    tasks?: string[];
  };
  subscription?: {
    key?: string;
    tier?: string;
    displayPlan?: string;
    agentLimit?: string;
    models?: string[];
  } | null;
  updatedAt?: string;
};

type SavedMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type RecentProject = {
  id: string;
  name: string;
  date: string;
  messages: SavedMessage[];
  context?: DashboardContext;
  kickoff?: ProjectKickoffData;
};

type ProjectKickoffData = {
  name: string;
  mission: string;
  targetEquityTime: string;
  weeklyHours: string;
  completionDate: string;
  agentRole: string;
  goals: string;
  pains: string;
};

interface QuickInjectors {
  concise: boolean;
  humanExplain: boolean;
  markdown: boolean;
}

interface WinningPrompt {
  id: number;
  text: string;
  mode: OperationMode;
  timestamp: string;
}

const PROJECTS_STORAGE_KEY = 'eq_recent_projects';
const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';

const initialProjects: RecentProject[] = [
  { id: '1', name: 'EQuityLabs Core v1', date: '2026-07-01', messages: [] },
  { id: '2', name: 'SEO Cluster Finanzas', date: '2026-06-28', messages: [] },
];

const MODES: { key: OperationMode; labelKey: string; icon: React.ComponentType<{ className?: string }>; descKey: string; color: string }[] = [
  { key: 'seo', labelKey: 'op.mode.seo', icon: Target, descKey: 'op.mode.seo.desc', color: 'from-cyan-400 to-blue-500' },
  { key: 'fullstack', labelKey: 'op.mode.fullstack', icon: Code2, descKey: 'op.mode.fullstack.desc', color: 'from-green-400 to-emerald-500' },
  { key: 'copywriter', labelKey: 'op.mode.copywriter', icon: Megaphone, descKey: 'op.mode.copywriter.desc', color: 'from-orange-400 to-amber-500' },
  { key: 'debug', labelKey: 'op.mode.debug', icon: Bug, descKey: 'op.mode.debug.desc', color: 'from-red-400 to-rose-500' },
];

const CREATIVITY: { key: CreativityLevel; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'precision', labelKey: 'op.creat.precision', icon: Target },
  { key: 'balanced', labelKey: 'op.creat.balanced', icon: Brain },
  { key: 'brainstorm', labelKey: 'op.creat.brainstorm', icon: Sparkles },
];

const AGENT_ROLES = [
  'Orquestador de Equity',
  'Builder de Producto',
  'Operador de Ejecucion',
  'Arquitecto de Incentivos',
];

const PROJECT_BRANCHES = [
  {
    title: 'Primeros Principios & Pensamiento',
    bullets: [
      'Descomposicion a materias primas',
      'Razonamiento fisico e incentivista',
      'Eliminacion de analogias y suposiciones',
    ],
  },
  {
    title: 'Construccion de Productos & Empresas',
    bullets: [
      'Identificar dolor real pagado',
      'Solucion desde cero',
      'Iteracion rapida con bloques de 5 min',
    ],
  },
  {
    title: 'Equity & Alineacion de Incentivos',
    bullets: [
      'Estructuras de propiedad',
      'Shared ownership',
      'Alineacion de largo plazo',
    ],
  },
  {
    title: 'Ejecucion & Disciplina Operativa',
    bullets: [
      'Chunking extremo',
      'Redireccion a alto valor',
      'Sistema anti-procrastinacion',
    ],
  },
  {
    title: 'Aprendizaje & Desarrollo',
    bullets: [
      'Arbol semantico',
      'Entrenamiento del agente',
      'Entrenamiento del usuario',
    ],
  },
  {
    title: 'Comunidad & Network Effects',
    bullets: [
      'Redes que generan equity mutuo',
      'Loops de colaboracion',
      'Distribucion de valor',
    ],
  },
  {
    title: 'Metricas de Impacto',
    bullets: [
      'Personas ayudadas x magnitud',
      'Equity y revenue generado',
      'ROI de tiempo y capital',
    ],
  },
];

const SYSTEM_METRICS = [
  'Valor real creado por usuario',
  'Retencion 6-12-24 meses',
  'Profundidad del arbol por sesion',
  'Velocidad de ejecucion semanal',
  'Ratio alto valor / bajo valor',
  'Dolor cognitivo vs progreso',
];

const ORCHESTRATOR_ROLES = [
  {
    title: '1. SEO Estrategico (Architect)',
    phase: 'Planificacion y estructura',
    raw: 'Intencion de busqueda, volumen, grafos de conocimiento, clusters de contenido.',
    action: 'Mapear el arbol semantico de palabras clave y disenar la arquitectura de informacion en bloques de 5 min.',
  },
  {
    title: '2. Full-Stack Developer (Engineer)',
    phase: 'Construccion y codigo',
    raw: 'React, Remix, Node, TypeScript, APIs, bases de datos y rendimiento.',
    action: 'Escribir codigo limpio, modular y tipado, minimizando re-renders y deuda tecnica.',
  },
  {
    title: '3. Copywriter de Conversion (Persuader)',
    phase: 'Cierre y landing',
    raw: 'Psicologia humana, gatillos mentales, micro-copy y propuesta de valor.',
    action: 'Redactar hooks, titulares y CTAs directos eliminando fluff corporativo.',
  },
  {
    title: '4. Debug Mode / QA (Scout)',
    phase: 'Optimizacion y error fix',
    raw: 'Stack traces, consola, breakpoints, memory leaks y Core Web Vitals.',
    action: 'Aislar bugs desde primeros principios y corregir el fallo atomico en el menor numero de lineas posible.',
  },
  {
    title: '5. Hacker de Productividad & Neuroplasticidad (Enforcer)',
    phase: 'Gestion del dolor y enfoque',
    raw: 'Gestion de energia, bloques de tiempo, atencion y fatiga cognitiva.',
    action: 'Bloquear multitasking, forzar messy action y sostener el dolor productivo con timer.',
  },
  {
    title: '6. Growth & Tokenomics Designer (Strategist)',
    phase: 'Escalabilidad y red',
    raw: 'Incentivos economicos, network effects, retencion LTV y distribucion de equity.',
    action: 'Disenar loops virales y propiedad compartida para que cada usuario incremente el valor del ecosistema.',
  },
  {
    title: '7. Auditor de Metricas de Impacto (Analyst)',
    phase: 'Rendimiento semanal',
    raw: 'Datos duros de uso, retencion, valor lifetime y velocidad de despliegue.',
    action: 'Descartar vanity metrics y medir solo personas ayudadas x magnitud del impacto.',
  },
];

const PRODUCTIVITY_LOOP = [
  'Ejercicio y foco: descarga fisica diaria para limpiar fatiga y subir BDNF antes de sesiones de codigo.',
  'The Alignment Loop: auditoria semanal de 15 minutos sobre ramas convertidas en produccion y tareas eliminadas.',
  'Gestion del dolor cognitivo: si algo rompe o cae, activar Debug Mode de inmediato; la friccion es senal de optimizacion.',
];

export function TaskOperator() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<OperationMode>('fullstack');
  const [creativity, setCreativity] = useState<CreativityLevel>('balanced');
  const [selectedOrchestratorRole, setSelectedOrchestratorRole] = useState(0);
  const [injectors, setInjectors] = useState<QuickInjectors>({ concise: false, humanExplain: true, markdown: true });
  const [mission, setMission] = useState('');
  const [projectView, setProjectView] = useState<'list' | 'new'>('new');
  const [panelWidth, setPanelWidth] = useState(82);
  const [projects, setProjects] = useState<RecentProject[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialProjects;
    } catch {
      return initialProjects;
    }
  });
  const [dashboardContext, setDashboardContext] = useState<DashboardContext>(() => {
    try {
      const saved = localStorage.getItem('eq_subscription_context');
      const activeAgentRaw = localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY);
      return {
        subscription: saved ? JSON.parse(saved) : null,
        activeAgent: activeAgentRaw ? JSON.parse(activeAgentRaw) : undefined,
      };
    } catch {
      return { subscription: null };
    }
  });
  const [formData, setFormData] = useState({
    name: '',
    mission: 'Ayudar a usuarios a construir valor real en equity usando primeros principios.',
    targetEquityTime: '',
    weeklyHours: '',
    completionDate: '',
    agentRole: AGENT_ROLES[0],
    goals: '',
    pains: '',
  });
  const [winningPrompts, setWinningPrompts] = useState<WinningPrompt[]>([
    { id: 1, text: 'Optimizar SEO para landing de SaaS B2B', mode: 'seo', timestamp: 'Hoy' },
    { id: 2, text: 'Refactorizar auth flow con Supabase', mode: 'fullstack', timestamp: 'Ayer' },
  ]);

  const activeCreativity = CREATIVITY.findIndex(c => c.key === creativity);
  const activeOrchestratorRole = ORCHESTRATOR_ROLES[selectedOrchestratorRole];
  const assignedAgents = useMemo(() => {
    const limit = dashboardContext.subscription?.agentLimit || '3';
    return limit.includes('+') ? '8+ agentes' : `${limit} agentes`;
  }, [dashboardContext.subscription?.agentLimit]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    const handleAgentSelected = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; name?: string; engine?: string; tasks?: string[] }>).detail || {};
      localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify({
        id: detail.id,
        name: detail.name,
        engine: detail.engine,
        tasks: detail.tasks || [],
        selectedAt: new Date().toISOString(),
      }));
      setDashboardContext(prev => ({
        ...prev,
        activeAgent: {
          id: detail.id,
          name: detail.name,
          engine: detail.engine,
          tasks: detail.tasks || [],
        },
        updatedAt: new Date().toISOString(),
      }));
    };

    window.addEventListener('eq:agent-selected', handleAgentSelected);
    return () => window.removeEventListener('eq:agent-selected', handleAgentSelected);
  }, []);

  useEffect(() => {
    try {
      const activeAgentRaw = localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY);
      if (!activeAgentRaw) return;
      const activeAgent = JSON.parse(activeAgentRaw);
      setDashboardContext(prev => ({
        ...prev,
        activeAgent,
      }));
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    const enlargePanel = () => setPanelWidth((value) => Math.min(90, value + 4));
    const reducePanel = () => setPanelWidth((value) => Math.max(64, value - 4));

    window.addEventListener('eq:task-panel-zoom-in', enlargePanel);
    window.addEventListener('eq:task-panel-zoom-out', reducePanel);
    return () => {
      window.removeEventListener('eq:task-panel-zoom-in', enlargePanel);
      window.removeEventListener('eq:task-panel-zoom-out', reducePanel);
    };
  }, []);

  const toggleInjector = (key: keyof QuickInjectors) => {
    setInjectors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveWinningPrompt = () => {
    if (!mission.trim()) return;
    setWinningPrompts(prev => [
      { id: Date.now(), text: mission, mode, timestamp: 'Ahora' },
      ...prev,
    ]);
    setMission('');
  };

  const deletePrompt = (id: number) => {
    setWinningPrompts(prev => prev.filter(p => p.id !== id));
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setProjects(prev => [
      {
        id: Date.now().toString(),
        name: formData.name.trim(),
        date: new Date().toISOString().slice(0, 10),
        messages: [],
        context: dashboardContext,
        kickoff: formData,
      },
      ...prev,
    ]);
    setFormData({
      name: '',
      mission: 'Ayudar a usuarios a construir valor real en equity usando primeros principios.',
      targetEquityTime: '',
      weeklyHours: '',
      completionDate: '',
      agentRole: AGENT_ROLES[0],
      goals: '',
      pains: '',
    });
    setProjectView('list');
  };

  const getLiveProjectSnapshot = (project: RecentProject): RecentProject => {
    const liveMessages = ((window as unknown as {
      __eqMessages?: Array<{ id?: string; role: string; content: string; timestamp?: Date | string }>;
    }).__eqMessages || [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
      .map(m => ({
        id: m.id || crypto.randomUUID(),
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
      }));

    const liveContext = (window as unknown as { __eqDashboardContext?: DashboardContext }).__eqDashboardContext;
    return {
      ...project,
      date: new Date().toISOString().slice(0, 10),
      messages: liveMessages.length ? liveMessages : project.messages,
      context: liveContext || dashboardContext || project.context,
    };
  };

  const openProject = (project: RecentProject) => {
    const snapshot = getLiveProjectSnapshot(project);
    setProjects(prev => prev.map(item => (item.id === project.id ? snapshot : item)));
    sessionStorage.setItem('eq_resume_session', JSON.stringify({
      project_id: snapshot.id,
      project_name: snapshot.name,
      messages: snapshot.messages,
      context: snapshot.context,
    }));
    window.dispatchEvent(new CustomEvent('eq:resume-session', {
      detail: {
        project_id: snapshot.id,
        project_name: snapshot.name,
        messages: snapshot.messages,
        context: snapshot.context,
      },
    }));
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };

  return (
    <CollapsibleSidebar
      side="left"
      title="CoreSettings"
      icon={<Rocket className="w-4 h-4" />}
      tabPosition="var(--dashboard-sidebar-top)"
      alignment="center"
      hideClosedTab
      openEventName="eq:open-task-panel"
      widthClassName=""
      panelWidth={`${panelWidth}vw`}
      maxWidth={`${panelWidth}vw`}
    >
      <div className="space-y-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-cyan-400/20 bg-black/35 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/70">Agente seleccionado</p>
            <strong className="mt-2 block text-xl font-semibold text-cyan-100">
              {dashboardContext.activeAgent?.name || 'Sin seleccionar'}
            </strong>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Ruta activa: {assignedAgents} usando {dashboardContext.activeAgent?.engine || 'modelo disponible'}.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-300/20 bg-black/35 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300/70">Suscripcion</p>
            <strong className="mt-2 block text-xl font-semibold text-emerald-100">
              {dashboardContext.subscription?.displayPlan || 'FREE'}
            </strong>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Plan operativo actual y capacidad de agentes disponible para la ejecucion.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-violet-400/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.10),rgba(15,23,42,0.88))] p-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-violet-300" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-200/75">
              Roles del Agente Orquestador
            </p>
          </div>

          <div className="mt-4 grid gap-2 xl:grid-cols-4">
            {ORCHESTRATOR_ROLES.map((role, index) => {
              const isActive = index === selectedOrchestratorRole;
              return (
                <button
                  key={role.title}
                  type="button"
                  onClick={() => setSelectedOrchestratorRole(index)}
                  className={[
                    'rounded-xl border px-3 py-3 text-left transition-all duration-200',
                    isActive
                      ? 'border-cyan-300/45 bg-cyan-300/12 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                      : 'border-white/10 bg-black/20 hover:border-violet-300/28 hover:bg-white/5',
                  ].join(' ')}
                >
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100">
                    {role.title}
                  </span>
                  <span className="mt-2 block text-[12px] text-cyan-200/82">
                    {role.phase}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-white/10 bg-black/22 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-100">
                {activeOrchestratorRole.title}
              </h4>
              <p className="mt-3 text-sm font-medium text-cyan-200/88">
                Fase: {activeOrchestratorRole.phase}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300/86">
                <span className="text-slate-100/90">Materia prima:</span> {activeOrchestratorRole.raw}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300/86">
                <span className="text-slate-100/90">Operacion 5 min:</span> {activeOrchestratorRole.action}
              </p>
            </div>

            <div className="rounded-xl border border-amber-300/16 bg-amber-300/6 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/75">
              Bloque de productividad personal e integracion semanal
            </p>
            <div className="mt-3 grid gap-2">
              {PRODUCTIVITY_LOOP.map((item) => (
                <div key={item} className="rounded-lg border border-amber-200/10 bg-black/18 px-3 py-2 text-xs leading-relaxed text-slate-200/82">
                  {item}
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-xl border border-amber-400/20 bg-[linear-gradient(145deg,rgba(251,191,36,0.08),rgba(15,23,42,0.78))] p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300/80">Tronco del proyecto</p>
            <h3 className="mt-2 text-lg font-semibold text-amber-50">{t('task.fixed_mission')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-200/85">
              Ayudar a usuarios a construir valor real en equity: startups, inversiones, productos y conocimiento,
              usando primeros principios, ejecucion disciplinada y alineacion de incentivos.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200/70">
                  {t('task.completion')}
                </span>
                <Input
                  value={formData.targetEquityTime}
                  onChange={(e) => setFormData({ ...formData, targetEquityTime: e.target.value })}
                  placeholder="Ej. 12 semanas / 6 meses"
                  className="border-0 bg-transparent px-0 text-sm text-slate-100 focus-visible:ring-0"
                />
              </label>
              <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200/70">
                  {t('task.weekly_hours')}
                </span>
                <Input
                  value={formData.weeklyHours}
                  onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value })}
                  placeholder="Ej. 10h, 20h, 40h"
                  className="border-0 bg-transparent px-0 text-sm text-slate-100 focus-visible:ring-0"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-[linear-gradient(145deg,rgba(34,211,238,0.08),rgba(15,23,42,0.82))] p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/80">Salud del sistema</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SYSTEM_METRICS.map((metric) => (
                <div key={metric} className="rounded-lg border border-cyan-300/12 bg-black/18 px-3 py-2 text-xs text-slate-200/80">
                  {metric}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-cyan-400/25 bg-[linear-gradient(140deg,rgba(8,145,178,0.18),rgba(15,23,42,0.62)_48%,rgba(30,41,59,0.82))] p-4 shadow-[0_0_28px_rgba(34,211,238,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300" />
          <div className="mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.mode')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(m => {
              const Icon = m.icon;
              const isActive = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
                      : 'border-border/20 bg-muted/20 hover:border-primary/30 hover:bg-muted/40'
                  }`}
                >
                  {isActive && <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-[0.07]`} />}
                  <div className="relative mb-1 flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`} />
                    <span className={`text-[11px] font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t(m.labelKey)}
                    </span>
                  </div>
                  <p className="relative text-[9px] leading-tight text-muted-foreground/50">{t(m.descKey)}</p>
                  {isActive && <CheckCircle2 className="absolute right-1.5 top-1.5 w-3 h-3 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-fuchsia-400/20 bg-[linear-gradient(140deg,rgba(59,130,246,0.12),rgba(8,13,27,0.78)_48%,rgba(34,211,238,0.08))] p-4">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-400 via-emerald-300 to-orange-300" />
          <div className="mb-3 flex items-center gap-2">
            <Thermometer className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.creativity')}</span>
          </div>
          <div className="flex gap-1.5">
            {CREATIVITY.map(c => {
              const Icon = c.icon;
              const isActive = creativity === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCreativity(c.key)}
                  className={`flex-1 rounded-xl border p-2 text-center transition-all duration-300 ${
                    isActive
                      ? 'border-accent/60 bg-accent/10 shadow-[0_0_12px_rgba(var(--accent-rgb),0.12)]'
                      : 'border-border/20 bg-muted/20 hover:border-accent/30'
                  }`}
                >
                  <Icon className={`mx-auto mb-1 w-4 h-4 ${isActive ? 'text-accent' : 'text-muted-foreground/50'}`} />
                  <span className={`block text-[9px] font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {t(c.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(activeCreativity + 1) * 33.3}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-fuchsia-400/20 bg-[linear-gradient(145deg,rgba(168,85,247,0.10),rgba(15,23,42,0.84))] p-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-fuchsia-300" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-fuchsia-200/75">Ramas grandes</p>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {PROJECT_BRANCHES.map((branch) => (
              <div key={branch.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-100">{branch.title}</h4>
                <div className="mt-2 space-y-1">
                  {branch.bullets.map((bullet) => (
                    <p key={bullet} className="text-[11px] leading-relaxed text-slate-300/78">
                      {bullet}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-cyan-400/20 bg-[#08111f]/90">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-300 via-violet-400 to-rose-300" />
          <div className="flex items-center justify-between border-b border-cyan-400/15 bg-[#0d1527] px-4 py-3">
            {projectView === 'new' ? (
              <button onClick={() => setProjectView('list')} className="flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-100">
                <ChevronLeft size={16} /> Volver a proyectos
              </button>
            ) : (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Gestion de Proyectos</h3>
                <p className="mt-1 text-[10px] text-slate-400">Metas, dolores y tiempo equity</p>
              </div>
            )}

            {projectView === 'list' && (
              <Button onClick={() => setProjectView('new')} size="sm" className="h-8 gap-1 bg-cyan-600 text-xs text-white hover:bg-cyan-500">
                <Plus size={14} /> Nuevo
              </Button>
            )}
          </div>

          <div className="p-4">
            {projectView === 'list' ? (
              <div className="space-y-3">
                <p className="px-1 text-xs font-medium text-slate-400">{t('task.recent')}</p>
                {projects.map(project => (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#111827] p-3 transition-all hover:border-cyan-500/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-slate-800 p-2 text-cyan-400 transition-colors group-hover:bg-cyan-950/50">
                        <Folder size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 transition-colors group-hover:text-cyan-300">{project.name}</h4>
                        <p className="text-[11px] text-slate-500">{t('task.modified')} {project.date}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openProject(project)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 text-cyan-200 transition hover:border-cyan-200/50 hover:bg-cyan-300/14"
                        title={t('task.open')}
                      >
                        <FolderOpen size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(project.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300/20 bg-red-400/8 text-red-200 transition hover:border-red-200/50 hover:bg-red-400/14"
                        title={t('task.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleProjectSubmit} className="space-y-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">{t('task.project_name')}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('task.project_name_ph')}
                    className="border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-cyan-500"
                    required
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                      <Clock size={14} /> {t('task.equity_time')}
                    </span>
                    <Input
                      value={formData.targetEquityTime}
                      onChange={(e) => setFormData({ ...formData, targetEquityTime: e.target.value })}
                      placeholder={t('task.equity_time_ph')}
                      className="border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-amber-500"
                    />
                  </label>

                  <label className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      {t('task.completion')}
                    </span>
                    <Input
                      value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                      placeholder={t('task.completion_ph')}
                      className="border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-cyan-500"
                    />
                  </label>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      {t('task.weekly_hours')}
                    </span>
                    <Input
                      value={formData.weeklyHours}
                      onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value })}
                      placeholder={t('task.weekly_hours_ph')}
                      className="border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-emerald-500"
                    />
                  </label>

                  <label className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                      {t('task.agent_role')}
                    </span>
                    <select
                      value={formData.agentRole}
                      onChange={(e) => setFormData({ ...formData, agentRole: e.target.value })}
                      className="h-10 w-full rounded-md border border-[#1e293b] bg-[#111827] px-3 text-sm text-slate-100 outline-none"
                    >
                      {AGENT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    {t('task.mission')}
                  </label>
                  <Textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    className="min-h-[84px] border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <Target size={14} /> {t('task.goals')}
                  </label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder={'1. Automatizar indexacion diaria.\n2. Reducir costos de API en 30%.'}
                    className="min-h-[80px] border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400">
                    <AlertCircle size={14} /> {t('task.pains')}
                  </label>
                  <Textarea
                    value={formData.pains}
                    onChange={(e) => setFormData({ ...formData, pains: e.target.value })}
                    placeholder={'- Carga lenta en el dashboard actual.\n- Dependencia manual de WordPress.'}
                    className="min-h-[80px] border-[#1e293b] bg-[#111827] text-sm focus-visible:ring-rose-500"
                  />
                </div>

                  <Button type="submit" className="mt-2 w-full bg-cyan-600 text-sm font-medium text-white hover:bg-cyan-500">
                    {t('task.init')}
                  </Button>
                </form>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Brain className="w-3 h-3 text-success" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.injectors')}</span>
          </div>
          <div className="space-y-1.5">
            {([
              { key: 'concise' as const, labelKey: 'op.inj.concise', descKey: 'op.inj.concise.desc' },
              { key: 'humanExplain' as const, labelKey: 'op.inj.human', descKey: 'op.inj.human.desc' },
              { key: 'markdown' as const, labelKey: 'op.inj.markdown', descKey: 'op.inj.markdown.desc' },
            ]).map(inj => (
              <button
                key={inj.key}
                onClick={() => toggleInjector(inj.key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 ${
                  injectors[inj.key] ? 'border-success/40 bg-success/5' : 'border-border/20 bg-muted/20 hover:border-border/40'
                }`}
              >
                <div className={`flex w-4 h-4 shrink-0 items-center justify-center rounded border-2 transition-all ${
                  injectors[inj.key] ? 'border-success bg-success' : 'border-muted-foreground/30'
                }`}>
                  {injectors[inj.key] && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
                </div>
                <div className="text-left">
                  <span className={`block text-[11px] font-bold ${injectors[inj.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(inj.labelKey)}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">{t(inj.descKey)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            value={mission}
            onChange={e => setMission(e.target.value)}
            placeholder={t('op.mission_placeholder')}
            rows={3}
            className="w-full resize-none rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]"
          />
          <button
            onClick={saveWinningPrompt}
            disabled={!mission.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/20 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Star className="w-3.5 h-3.5" />
            {t('op.save_prompt')}
          </button>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Star className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.winning')}</span>
          </div>
          <div className="max-h-[180px] space-y-1.5 overflow-y-auto scrollbar-thin">
            {winningPrompts.map(p => {
              const pMode = MODES.find(m => m.key === p.mode);
              return (
                <div key={p.id} className="group rounded-xl border border-border/20 bg-muted/20 p-2.5 transition-colors hover:border-warning/20">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-[11px] leading-tight text-foreground/80">{p.text}</p>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => copyPrompt(p.text)} className="text-muted-foreground/50 hover:text-primary">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => deletePrompt(p.id)} className="text-muted-foreground/50 hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-mono text-primary/70">
                      {pMode ? t(pMode.labelKey) : ''}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40">{p.timestamp}</span>
                  </div>
                </div>
              );
            })}
            {winningPrompts.length === 0 && (
              <p className="py-4 text-center text-[10px] text-muted-foreground/40">{t('op.no_prompts')}</p>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
  );
}
