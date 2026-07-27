import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Copy, Eye, FilePenLine, RefreshCw, Sparkles, Workflow } from 'lucide-react';
import {
  MindMap,
  MindMapTextEditor,
  toMarkdownMultiRoot,
  type MindMapData,
  type MindMapRef,
} from '@xiangfa/mindmap';
import '@xiangfa/mindmap/style.css';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'eq_project_mindmaps_v1';
const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';
const DEFAULT_ENGINE = 'qwen/qwen3-vl-8b-thinking';

type MapMode = 'private' | 'client';

type DashboardContext = {
  activeAgent?: {
    id?: string;
    name?: string;
    engine?: string;
    tasks?: string[];
  };
  subscription?: {
    displayPlan?: string;
    tier?: string;
  } | null;
};

type MindMapContext = {
  agentId: string;
  agentName: string;
  agentEngine: string;
  agentTasks: string[];
  subscriptionPlan: string;
  userName: string;
  language: 'ES' | 'EN';
};

type WorkspaceRecord = {
  privateMarkdown: string;
  clientMarkdown: string;
  updatedAt: string;
};

type StoredWorkspaceMap = Record<string, WorkspaceRecord>;

const readStore = (): StoredWorkspaceMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (store: StoredWorkspaceMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const formatLines = (lines: string[], fallback: string[]) => {
  const source = lines.length ? lines : fallback;
  return source.map((line) => `    - ${line}`).join('\n');
};

const buildPrivateTemplate = (context: MindMapContext) => {
  if (context.language === 'ES') {
    return [
      'EquityLabs // Documento raiz privado',
      '  - Raiz',
      '    - Maximizar personas ayudadas x magnitud del impacto via equity duradero',
      '  - Tronco operativo',
      '    - Primeros principios',
      '    - Materias primas: tiempo, atencion, capital, conocimiento, ejecucion',
      '    - Chunking extremo en bloques de 5 minutos',
      '    - Disciplina brutal y messy action',
      '    - Neuroplasticidad aplicada al dolor productivo',
      '  - Contexto activo',
      `    - Agente principal: ${context.agentName}`,
      `    - Suscripcion activa: ${context.subscriptionPlan}`,
      `    - Motor operativo: ${context.agentEngine}`,
      `    - Operador: ${context.userName}`,
      '  - Ramas grandes de EquityLabs',
      '    - 1. Primeros Principios & Pensamiento',
      '      - Descomposicion a materias primas',
      '      - Razonamiento fisico e incentivista',
      '      - Eliminar analogias y suposiciones',
      '    - 2. Construccion de Productos & Empresas',
      '      - Identificar dolor real pagado',
      '      - Solucion desde cero',
      '      - Iteracion rapida con bloques de 5 min',
      '    - 3. Equity & Alineacion de Incentivos',
      '      - Estructuras de propiedad',
      '      - Shared ownership / tokenizacion',
      '      - Incentivos de largo plazo',
      '    - 4. Ejecucion & Disciplina Operativa',
      '      - OBT diario',
      '      - Redireccion a alto valor',
      '      - Sistema anti-procrastinacion',
      '    - 5. Aprendizaje & Desarrollo',
      '      - Arbol semantico',
      '      - Entrenamiento del agente',
      '      - Entrenamiento del usuario',
      '    - 6. Comunidad & Network Effects',
      '      - Redes que generan equity mutuo',
      '      - Loops de colaboracion',
      '      - Distribucion de valor',
      '    - 7. Metricas de Impacto',
      '      - Personas ayudadas x magnitud',
      '      - Revenue / equity generado',
      '      - Retencion 6-12-24 meses',
      '  - Roles del agente actual',
      formatLines(context.agentTasks, [
        'Diagnosticar el norte estrategico',
        'Definir una ruta ejecutable',
        'Elegir el squad minimo de agentes',
      ]),
      '  - Neuroplasticidad aplicada',
      '    - [ ] Elegir una tarea justo por encima del nivel actual',
      '    - [ ] Ejecutar 5 minutos con timer',
      '    - [ ] Sostener 30-60 segundos extra en el punto de resistencia',
      '    - [ ] Registrar que cambio en la comprension',
      '  - Flujo operativo minimo',
      '    - [ ] Definir el tronco del proyecto del cliente',
      '    - [ ] Marcar tiempo maximo de finalizacion',
      '    - [ ] Marcar horas de trabajo semanal',
      '    - [ ] Elegir siguiente microtarea de 5 minutos',
      '    - [ ] Activar integraciones necesarias #calendar #drive #crm',
      '  - Datos criticos del proyecto',
      '    - Problema real a resolver',
      '    - Resultado economico esperado',
      '    - Restricciones actuales',
      '    - Recursos disponibles',
      '    - Riesgos y permisos pendientes',
      '  - Cadencia de seguimiento',
      '    - Diario: que tronco avance hoy',
      '    - Semanal: auditoria de ramas convertidas en produccion',
      '    - Mensual: impacto real vs burnout',
      '  - Metricas reales',
      '    - Personas ayudadas',
      '    - Magnitud promedio del impacto',
      '    - Equity total creado o distribuido',
      '    - ROI de tiempo y capital',
      '    - Ratio alto valor / bajo valor',
      '    - Dolor cognitivo vs progreso',
    ].join('\n');
  }

  return [
    'EquityLabs // Private root document',
    '  - Root',
    '    - Maximize people helped x magnitude of impact through durable equity',
    '  - Operating trunk',
    '    - First principles',
    '    - Raw materials: time, attention, capital, knowledge, execution',
    '    - Extreme chunking in 5-minute blocks',
    '    - Brutal discipline and messy action',
    '    - Neuroplasticity through productive discomfort',
    '  - Active context',
    `    - Main agent: ${context.agentName}`,
    `    - Active subscription: ${context.subscriptionPlan}`,
    `    - Engine: ${context.agentEngine}`,
    `    - Operator: ${context.userName}`,
    '  - EquityLabs branches',
    '    - First Principles & Thinking',
    '    - Product & Company Building',
    '    - Equity & Incentive Alignment',
    '    - Execution & Operating Discipline',
    '    - Learning & Development',
    '    - Community & Network Effects',
    '    - Impact Metrics',
    '  - Active agent capabilities',
    formatLines(context.agentTasks, [
      'Diagnose the strategic north star',
      'Define an executable route',
      'Choose the minimum agent squad',
    ]),
    '  - Neuroplasticity loop',
    '    - [ ] Choose a task just above current level',
    '    - [ ] Execute for 5 minutes with a timer',
    '    - [ ] Push 30-60 seconds through resistance',
    '    - [ ] Record what changed in understanding',
    '  - Core project flow',
    '    - [ ] Define the client project trunk',
    '    - [ ] Mark execution window',
    '    - [ ] Mark weekly work hours',
    '    - [ ] Choose next 5-minute micro-task',
    '    - [ ] Activate required integrations #calendar #drive #crm',
    '  - Real metrics',
    '    - People helped',
    '    - Average impact magnitude',
    '    - Total equity created or distributed',
    '    - Time and capital ROI',
    '    - High-value / low-value ratio',
    '    - Cognitive pain vs progress',
  ].join('\n');
};

const buildClientTemplate = (context: MindMapContext) => {
  if (context.language === 'ES') {
    return [
      'EquityLabs // Plantilla seria para cliente',
      '  - Mision del proyecto',
      '    - Objetivo final del cliente',
      '    - Dolor real que vamos a resolver',
      '    - Fecha objetivo y tiempo disponible',
      '  - Metodo EquityLabs',
      `    - Agente asignado: ${context.agentName}`,
      '    - Primeros principios antes que opinion',
      '    - Microtareas cortas y ejecutables',
      '    - Seguimiento visible con proximos pasos claros',
      '  - Estructura de trabajo',
      '    - Tronco del proyecto',
      '      - Problema central',
      '      - Resultado esperado',
      '      - Restriccion principal',
      '    - Ramas operativas',
      '      - Producto / servicio',
      '      - Ejecucion',
      '      - Aprendizaje',
      '      - Metricas',
      '  - Foco inicial del agente',
      formatLines(context.agentTasks.slice(0, 3), [
        'Definir el objetivo principal',
        'Acordar entregables visibles',
        'Elegir la primera accion de alto valor',
      ]),
      '  - Entregables visibles',
      '    - [ ] Documento raiz del proyecto',
      '    - [ ] Ruta de trabajo validada',
      '    - [ ] Checkpoint semanal con metricas',
      '  - Integraciones opcionales',
      '    - Calendar para compromisos y bloques',
      '    - Drive para activos y entregables',
      '    - Reportes periodicos del proyecto',
      '  - Proximo paso',
      '    - [ ] Confirmar la primera accion despues de esta reunion',
    ].join('\n');
  }

  return [
    'EquityLabs // Serious client template',
    '  - Project mission',
    '    - Client final objective',
    '    - Real pain point we will solve',
    '    - Target date and available time',
    '  - EquityLabs method',
    `    - Assigned agent: ${context.agentName}`,
    '    - First principles before opinion',
    '    - Short executable micro-tasks',
    '    - Visible follow-up with clear next steps',
    '  - Work structure',
    '    - Project trunk',
    '      - Central problem',
    '      - Expected result',
    '      - Main constraint',
    '    - Operating branches',
    '      - Product / service',
    '      - Execution',
    '      - Learning',
    '      - Metrics',
    '  - Agent starting focus',
    formatLines(context.agentTasks.slice(0, 3), [
      'Define the main objective',
      'Agree on visible deliverables',
      'Choose the first high-value action',
    ]),
    '  - Visible deliverables',
    '    - [ ] Project root document',
    '    - [ ] Validated work route',
    '    - [ ] Weekly metrics checkpoint',
    '  - Optional integrations',
    '    - Calendar for commitments and work blocks',
    '    - Drive for assets and deliverables',
    '    - Periodic project reporting',
    '  - Next step',
    '    - [ ] Confirm the first action after this meeting',
  ].join('\n');
};

const getUserName = (user: ReturnType<typeof useAuth>['user']) => {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const rawName = typeof meta?.full_name === 'string'
    ? meta.full_name
    : typeof meta?.name === 'string'
      ? meta.name
      : typeof user?.email === 'string'
        ? user.email.split('@')[0]
        : 'Operador';
  return rawName || 'Operador';
};

const buildContext = (
  language: 'ES' | 'EN',
  userName: string,
): MindMapContext => {
  let liveContext: DashboardContext | undefined;
  let cachedAgent: DashboardContext['activeAgent'];
  let cachedSubscription: DashboardContext['subscription'];

  try {
    liveContext = (window as unknown as { __eqDashboardContext?: DashboardContext }).__eqDashboardContext;
  } catch {
    liveContext = undefined;
  }

  try {
    const rawAgent = localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY);
    cachedAgent = rawAgent ? JSON.parse(rawAgent) : undefined;
  } catch {
    cachedAgent = undefined;
  }

  try {
    const rawSubscription = localStorage.getItem('eq_subscription_context');
    cachedSubscription = rawSubscription ? JSON.parse(rawSubscription) : null;
  } catch {
    cachedSubscription = null;
  }

  const agent = liveContext?.activeAgent || cachedAgent;
  const subscription = liveContext?.subscription || cachedSubscription;

  return {
    agentId: agent?.id || 'equitylabs-core',
    agentName: agent?.name || 'EquityLabs Core',
    agentEngine: DEFAULT_ENGINE,
    agentTasks: Array.isArray(agent?.tasks) ? agent.tasks : [],
    subscriptionPlan: subscription?.displayPlan || subscription?.tier || 'FREE',
    userName,
    language,
  };
};

const buildWorkspace = (context: MindMapContext): WorkspaceRecord => ({
  privateMarkdown: buildPrivateTemplate(context),
  clientMarkdown: buildClientTemplate(context),
  updatedAt: new Date().toISOString(),
});

const getStorageId = (context: MindMapContext, userId?: string) =>
  `${userId || 'anon'}::${context.agentId}`;

export function ProjectMindMapStudio({ isOpen }: { isOpen: boolean }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const privateMapRef = useRef<MindMapRef>(null);
  const clientMapRef = useRef<MindMapRef>(null);
  const activeLanguage = language === 'ES' ? 'ES' : 'EN';
  const userName = useMemo(() => getUserName(user), [user]);
  const [mode, setMode] = useState<MapMode>('private');
  const [readonlyPreview, setReadonlyPreview] = useState(false);
  const [context, setContext] = useState<MindMapContext>(() => buildContext(activeLanguage, userName));
  const [workspace, setWorkspace] = useState<WorkspaceRecord>(() => buildWorkspace(buildContext(activeLanguage, userName)));

  const storageId = useMemo(
    () => getStorageId(context, user?.id),
    [context, user?.id],
  );

  const locale = activeLanguage === 'ES' ? 'en-US' : 'en-US';
  const currentMarkdown = mode === 'private' ? workspace.privateMarkdown : workspace.clientMarkdown;

  const hydrateWorkspace = useCallback(() => {
    const nextContext = buildContext(activeLanguage, userName);
    const store = readStore();
    const nextStorageId = getStorageId(nextContext, user?.id);
    setContext(nextContext);
    setWorkspace(store[nextStorageId] || buildWorkspace(nextContext));
  }, [activeLanguage, userName, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    hydrateWorkspace();
  }, [hydrateWorkspace, isOpen]);

  useEffect(() => {
    const handleAgentSelected = () => {
      hydrateWorkspace();
      setMode('private');
    };

    window.addEventListener('eq:agent-selected', handleAgentSelected);
    return () => window.removeEventListener('eq:agent-selected', handleAgentSelected);
  }, [hydrateWorkspace]);

  useEffect(() => {
    if (!isOpen) return;
    const store = readStore();
    store[storageId] = workspace;
    writeStore(store);
  }, [isOpen, storageId, workspace]);

  const handleMarkdownChange = useCallback((nextData: MindMapData[]) => {
    const nextMarkdown = toMarkdownMultiRoot(nextData);
    setWorkspace((prev) => ({
      ...prev,
      [mode === 'private' ? 'privateMarkdown' : 'clientMarkdown']: nextMarkdown,
      updatedAt: new Date().toISOString(),
    }));
  }, [mode]);

  const handleResetCurrent = useCallback(() => {
    const next = buildWorkspace(context);
    setWorkspace((prev) => ({
      ...prev,
      [mode === 'private' ? 'privateMarkdown' : 'clientMarkdown']:
        mode === 'private' ? next.privateMarkdown : next.clientMarkdown,
      updatedAt: new Date().toISOString(),
    }));
    toast({
      title: activeLanguage === 'ES' ? 'Mapa reiniciado' : 'Map reset',
      description: activeLanguage === 'ES'
        ? 'Volvimos a la plantilla base para este agente.'
        : 'Returned to the base template for this agent.',
    });
  }, [activeLanguage, context, mode, toast]);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      const markdown = (mode === 'private' ? privateMapRef.current : clientMapRef.current)?.getMarkdown() || currentMarkdown;
      await navigator.clipboard.writeText(markdown);
      toast({
        title: activeLanguage === 'ES' ? 'Markdown copiado' : 'Markdown copied',
        description: activeLanguage === 'ES'
          ? 'Ya lo tenes listo para reutilizar o compartir.'
          : 'It is ready to reuse or share.',
      });
    } catch {
      toast({
        title: activeLanguage === 'ES' ? 'No se pudo copiar' : 'Could not copy',
        variant: 'destructive',
      });
    }
  }, [activeLanguage, currentMarkdown, mode, toast]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-400/15 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('private')}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              mode === 'private'
                ? 'border-cyan-300/60 bg-cyan-300/14 text-cyan-100'
                : 'border-white/10 bg-white/5 text-white/55 hover:border-cyan-400/30 hover:text-white/80'
            }`}
          >
            <FilePenLine className="mr-1 inline h-3.5 w-3.5" />
            Privado
          </button>
          <button
            type="button"
            onClick={() => setMode('client')}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              mode === 'client'
                ? 'border-fuchsia-300/60 bg-fuchsia-300/14 text-fuchsia-100'
                : 'border-white/10 bg-white/5 text-white/55 hover:border-fuchsia-400/30 hover:text-white/80'
            }`}
          >
            <Workflow className="mr-1 inline h-3.5 w-3.5" />
            Plantilla Cliente
          </button>
          <button
            type="button"
            onClick={() => setReadonlyPreview((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              readonlyPreview
                ? 'border-amber-300/60 bg-amber-300/12 text-amber-100'
                : 'border-white/10 bg-white/5 text-white/55 hover:border-amber-400/30 hover:text-white/80'
            }`}
          >
            <Eye className="mr-1 inline h-3.5 w-3.5" />
            {readonlyPreview ? 'Solo vista' : 'Editar'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/65">
            {context.agentName}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/65">
            {context.subscriptionPlan}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetCurrent}
            className="h-8 rounded-full border border-white/10 bg-white/5 px-3 text-[11px] text-white/75 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyMarkdown}
            className="h-8 rounded-full border border-white/10 bg-white/5 px-3 text-[11px] text-white/75 hover:bg-white/10 hover:text-white"
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Markdown
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div
          className="mindmap-container relative min-h-[560px] overflow-hidden rounded-[28px] border border-cyan-300/18 bg-slate-950/75 shadow-[0_0_40px_rgba(0,255,255,0.08)]"
          style={{
            '--mindmap-canvas-bg': 'rgba(4, 11, 21, 0.96)',
            '--mindmap-panel-bg': 'rgba(8, 16, 30, 0.88)',
            '--mindmap-panel-border': 'rgba(34, 211, 238, 0.18)',
            '--mindmap-root-bg': '#0f2e4b',
            '--mindmap-root-color': '#d6f8ff',
            '--mindmap-node-bg': 'rgba(16, 29, 50, 0.96)',
            '--mindmap-node-color': '#ebfbff',
            '--mindmap-node-border': 'rgba(87, 224, 255, 0.2)',
            '--mindmap-edge-width': '2.2',
            '--mindmap-edge-color': 'rgba(110, 238, 255, 0.65)',
          } as CSSProperties}
        >
          {mode === 'private' ? (
            <MindMap
              ref={privateMapRef}
              markdown={workspace.privateMarkdown}
              theme="dark"
              locale={locale}
              textEditor={MindMapTextEditor}
              readonly={readonlyPreview}
              toolbar={{ zoom: true, history: true, search: true, tags: true }}
              onDataChange={handleMarkdownChange}
            />
          ) : (
            <MindMap
              ref={clientMapRef}
              markdown={workspace.clientMarkdown}
              theme="dark"
              locale={locale}
              textEditor={MindMapTextEditor}
              readonly={readonlyPreview}
              toolbar={{ zoom: true, history: true, search: true, tags: true }}
              onDataChange={handleMarkdownChange}
            />
          )}
        </div>

        <div className="space-y-3 overflow-y-auto rounded-[26px] border border-white/10 bg-black/28 p-4">
          <div className="rounded-2xl border border-cyan-300/18 bg-cyan-300/8 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                {activeLanguage === 'ES' ? 'Contexto activo' : 'Active context'}
              </span>
            </div>
            <p className="text-sm text-white/88">{context.agentName}</p>
            <p className="mt-1 text-xs text-white/55">{context.agentEngine}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              {activeLanguage === 'ES' ? 'Capacidades del agente' : 'Agent capabilities'}
            </h3>
            <div className="mt-3 space-y-2">
              {(context.agentTasks.length ? context.agentTasks : (
                activeLanguage === 'ES'
                  ? ['Diagnosticar el proyecto', 'Definir ruta operativa', 'Ejecutar el siguiente bloque de valor']
                  : ['Diagnose the project', 'Define the operating route', 'Execute the next value block']
              )).slice(0, 4).map((task) => (
                <div key={task} className="rounded-xl border border-white/10 bg-black/24 px-3 py-2 text-sm text-white/82">
                  {task}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              {activeLanguage === 'ES' ? 'Uso recomendado' : 'Recommended use'}
            </h3>
            <div className="mt-3 space-y-2 text-sm text-white/72">
              <p>{activeLanguage === 'ES'
                ? 'Privado: estrategia, riesgos, squad, integraciones y microtareas reales.'
                : 'Private: strategy, risks, squad, integrations, and real micro-tasks.'}</p>
              <p>{activeLanguage === 'ES'
                ? 'Cliente: version limpia para mostrar metodo, entregables y proximo checkpoint.'
                : 'Client: clean version to show method, deliverables, and next checkpoint.'}</p>
              <p>{activeLanguage === 'ES'
                ? 'El mapa queda guardado por usuario y por agente, para que cada flujo tenga su propia raiz.'
                : 'The map is saved per user and per agent, so each flow has its own root.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
