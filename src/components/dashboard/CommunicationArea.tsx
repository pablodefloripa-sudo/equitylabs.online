import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { modelDisplayName } from '@/lib/modelDisplay';
import {
  Zap,
  Loader2,
  ThumbsUp,
  Trash2,
  Cpu,
  Plus,
  ShieldCheck,
  BarChart3,
  Image as ImageIcon,
  Layout,
  Telescope,
  Clapperboard,
  Music,
  GraduationCap,
  Sparkles,
  FileBarChart,
  TrendingUp,
  Cat,
  X,
  FileText,
  Paperclip,
  Volume2,
  VolumeX,
  ChevronDown,
  Mic,
  MicOff,
  Send,
  Link2,
  Copy,
  Smartphone,
} from 'lucide-react';
import { InlineToolsPanel } from './InlineToolsPanel';
import { AgentResponsePanel } from './AgentResponsePanel';
import { MascotGreeting } from './MascotGreeting';
import { MascotTaskDialog } from './MascotTaskDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAIChat } from '@/hooks/useAIChat';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { getDefaultModelForPlan } from '@/lib/subscription-plans';
import { AGENT_UI_COPY, INLINE_TOOLS_COPY, type DashboardToolKey } from './dashboardI18n';
import mascotImage from '@/assets/mascot/assistant-dog.png';
import {
  emitMascotEvent,
  MASCOT_EVENTS,
  detectProgressMilestone,
} from '@/lib/mascot-events';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  model?: string;
  toolLabel?: string;
  reaction?: 'up' | null;
  route?: string;
  agentId?: string;
  agentRoute?: string;
  provider?: string;
  attachments?: ChatAttachment[];
  mascot?: boolean;
  agentCommand?: {
    agentName: string;
    userName?: string;
    selectedRole?: string;
    proposals: string[];
  };
}

interface CommunicationAreaProps {
  onEnterFocusMode: () => void;
}

type InlineToolKey = DashboardToolKey;

type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

const MAX_CHAT_ATTACHMENTS = 4;
const MAX_CHAT_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const SOUND_PREFERENCE_KEY = 'eq_sound_enabled';
const SOUND_VOICE_KEY = 'eq_sound_voice';
const SOUND_LANGUAGES = ['es', 'en', 'pt', 'it', 'fr', 'de', 'el'];

const speechText = (value: string) => value
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/[*_#>`~-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const ACCEPTED_CHAT_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const isAcceptedChatAttachment = (file: File) => (
  ACCEPTED_CHAT_ATTACHMENT_TYPES.includes(file.type)
  || /\.pdf$/i.test(file.name)
  || /\.(png|jpe?g|webp|gif)$/i.test(file.name)
);

const formatAttachmentSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileToChatAttachment = (file: File): Promise<ChatAttachment> => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo leer el archivo.'));
        return;
      }

      resolve({
        id: crypto.randomUUID(),
        name: file.name || (file.type === 'application/pdf' ? 'document.pdf' : 'image.jpg'),
        mimeType: file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'image/jpeg'),
        size: file.size,
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  })
);

type AgentProjectForm = {
  projectName: string;
  objective: string;
  mainMetric: string;
  targetValue: string;
  deadline: string;
  dataSource: string;
};

const emptyAgentProjectForm: AgentProjectForm = {
  projectName: '',
  objective: '',
  mainMetric: '',
  targetValue: '',
  deadline: '',
  dataSource: '',
};

const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';
const PROJECT_ROOTS_STORAGE_KEY = 'eq_project_roots';
const INLINE_TOOL_ICONS: Record<InlineToolKey, React.ComponentType<{ className?: string }>> = {
  create_image: ImageIcon,
  canvas_organize: Layout,
  deep_research: Telescope,
  create_video_brief: Clapperboard,
  create_music_brief: Music,
  learn: GraduationCap,
  prompt_engineer: Sparkles,
  generate_report: FileBarChart,
  market_analysis: TrendingUp,
  project_metrics: BarChart3,
  mascot: Cat,
};

type ProjectRootRecord = {
  id: string;
  agentName: string;
  userName: string;
  selectedRole: string;
  subscriptionPlan: string;
  projectName: string;
  projectTrunk: string;
  completionWindow: string;
  weeklyHours: string;
  nextTask: string;
  createdAt: string;
};

const ORCHESTRATOR_ROLE_OPTIONS = [
  'SEO Estrategico',
  'Full-Stack Developer',
  'Copywriter de Conversion',
  'Debug Mode / QA',
  'Productividad & Neuroplasticidad',
  'Growth & Tokenomics',
  'Auditor de Metricas de Impacto',
];

const OPERATION_MODES = [
  'SEO EstratÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gico',
  'Full-Stack Dev',
  'Copywriter',
  'Debug Mode',
  'Creatividad',
  'PrecisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n QuirÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºrgica',
] as const;

const STYLE_MODES = [
  'Equilibrado',
  'Lluvia de Ideas',
  'ConcisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Extrema',
  'ExplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Humana',
  'Formato Markdown',
] as const;

const metricFields: Array<{
  key: keyof AgentProjectForm;
  label: string;
  placeholder: string;
}> = [
  { key: 'projectName', label: 'Proyecto', placeholder: 'Ej: Velvet Revenue Sprint' },
  { key: 'objective', label: 'Objetivo', placeholder: 'Resultado que queres lograr' },
  { key: 'mainMetric', label: 'Metrica principal', placeholder: 'Ej: conversion, ingresos, leads' },
  { key: 'targetValue', label: 'Meta', placeholder: 'Ej: +18%, 50 leads, $10k' },
  { key: 'deadline', label: 'Fecha limite', placeholder: 'Ej: 30 dias, 2026-08-15' },
  { key: 'dataSource', label: 'Fuente de datos', placeholder: 'Sheets, CRM, manual, Analytics' },
];

const STARTUP_WORK_PRESETS = [
  {
    label: 'Generar ideas',
    icon: Sparkles,
    prompt: 'Generame 5 a 8 ideas de alto potencial con foco en ROI, claridad y velocidad de ejecucion.',
  },
  {
    label: 'Chequear viabilidad',
    icon: ShieldCheck,
    prompt: 'Haceme un chequeo rapido de viabilidad del concepto con riesgos, supuestos y alerta de permisos.',
  },
  {
    label: 'Crear outline',
    icon: FileText,
    prompt: 'Armame un outline claro del proyecto con diferenciador competitivo, pasos y entregables.',
  },
  {
    label: 'Mapear mercado',
    icon: TrendingUp,
    prompt: 'Haceme un mapa rapido de mercado, competidores, oportunidad y hueco estrategico.',
  },
  {
    label: 'Revisar permisos',
    icon: ShieldCheck,
    prompt: 'Decime que permisos necesito conectar si quiero usar Gmail, Calendar, Drive o Sheets.',
  },
  {
    label: 'Definir KPI',
    icon: BarChart3,
    prompt: 'Definime KPI y una mini hoja de ruta operativa para medir avance y retorno.',
  },
] as const;

const StatusLEDs = ({ isThinking }: { isThinking: boolean }) => (
  <div className="flex items-center gap-2">
    {(['#FF5F57', '#FEBC2E', '#28C840'] as const).map((color, i) => (
      <motion.div
        key={color}
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
        animate={isThinking ? {
          opacity: [0.3, 1, 0.3],
          scale: [0.9, 1.1, 0.9],
        } : {
          opacity: [0.7, 1, 0.7],
        }}
        transition={isThinking ? {
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.2,
        } : {
          duration: 2,
          repeat: Infinity,
        }}
      />
    ))}
  </div>
);

const buildAgentCommand = (
  agentName: string,
  tasks: string[],
  engine: string,
  userName: string,
  language: Language,
) => {
  const copy = AGENT_UI_COPY[language];
  const safeTasks = tasks.length ? tasks : copy.defaultTasks;
  const proposals = Array.from(new Set([...safeTasks, ...copy.defaultTasks])).slice(0, 5);

  return {
    prompt: [
      copy.immediateExecution(agentName),
      copy.initialEngine(engine),
      '',
      copy.agentContext(safeTasks.join(' | ')),
      '',
      copy.objective,
      '',
      copy.startHint,
    ].join('\n'),
    content: [
      copy.ready(agentName),
      '',
      copy.greeting(userName),
      '',
      copy.beforeExecute,
      '',
      copy.kickoff,
    ].join('\n'),
    proposals,
  };
};

const announceTaskSuggestions = (
  agentName: string,
  proposals: string[],
  source: string,
) => {
  if (!proposals.length) return;

  emitMascotEvent(MASCOT_EVENTS.TASK_SUGGESTED, {
    agentName,
    proposals,
    source,
    message: `Te propongo ${proposals.length} tareas para ${agentName}.`,
  });
};

const announceProgress = (response: string, source: string) => {
  const milestone = detectProgressMilestone(response);
  if (!milestone) return;

  emitMascotEvent(MASCOT_EVENTS.PROGRESS_DETECTED, {
    milestone,
    source,
  });
};

const getOperatorName = (user: ReturnType<typeof useAuth>['user']) => {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  if (typeof meta?.full_name === 'string' && meta.full_name.trim()) return meta.full_name;
  if (typeof meta?.name === 'string' && meta.name.trim()) return meta.name;
  if (typeof user?.email === 'string' && user.email.trim()) return user.email.split('@')[0];
  return 'Operador';
};

const KickoffDialogCard = ({
  agentName,
  userName,
  selectedRole,
  subscriptionPlan,
  onSave,
}: {
  agentName: string;
  userName: string;
  selectedRole: string;
  subscriptionPlan: string;
  onSave: (record: ProjectRootRecord) => void;
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectTrunk, setProjectTrunk] = useState('');
  const [completionWindow, setCompletionWindow] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [nextTask, setNextTask] = useState('');
  const [role, setRole] = useState(selectedRole);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!projectName.trim() || !projectTrunk.trim()) return;

    onSave({
      id: crypto.randomUUID(),
      agentName,
      userName,
      selectedRole: role,
      subscriptionPlan,
      projectName: projectName.trim(),
      projectTrunk: projectTrunk.trim(),
      completionWindow: completionWindow.trim(),
      weeklyHours: weeklyHours.trim(),
      nextTask: nextTask.trim(),
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border border-cyan-300/22 bg-black/55 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/70">Documento raiz del proyecto</p>
          <h3 className="mt-1 text-base font-semibold text-cyan-50">{userName}, definamos el tronco y la proxima tarea</h3>
        </div>
        <div className="rounded-full border border-emerald-300/18 bg-emerald-300/8 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100/75">
          {subscriptionPlan}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-300/14 bg-cyan-300/6 px-3 py-2">
          <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-200/70">Agente seleccionado</span>
          <strong className="mt-1 block text-sm text-cyan-50">{agentName}</strong>
        </div>
        <div className="rounded-2xl border border-violet-300/14 bg-violet-300/6 px-3 py-2">
          <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-violet-200/70">Rol operativo</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ORCHESTRATOR_ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                  role === option
                    ? 'border-cyan-300/60 bg-cyan-300/14 text-cyan-50'
                    : 'border-white/10 bg-white/5 text-slate-300/75 hover:border-cyan-300/30'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Proyecto</span>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Ej. Job Booster Sprint" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Tiempo disponible</span>
          <input value={completionWindow} onChange={(e) => setCompletionWindow(e.target.value)} placeholder="Ej. 30 dias / 12 semanas" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Horas semanales</span>
          <input value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="Ej. 10h / 20h" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Proxima micro-tarea</span>
          <input value={nextTask} onChange={(e) => setNextTask(e.target.value)} placeholder="Ej. mapear keyword clusters" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
      </div>

      <div className="mt-3">
        <Textarea
          value={projectTrunk}
          onChange={(e) => setProjectTrunk(e.target.value)}
          placeholder="Defini el tronco del proyecto: problema real, impacto, restriccion y resultado esperado."
          className="min-h-[110px] border-white/10 bg-black/18 text-sm text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">Esto queda guardado para volver a buscarlo en el futuro.</p>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saved || !projectName.trim() || !projectTrunk.trim()}
          className="rounded-xl bg-cyan-600 px-4 text-sm text-white hover:bg-cyan-500"
        >
          {saved ? 'Guardado' : 'Guardar documento raiz'}
        </Button>
      </div>
    </div>
  );
};

export const CommunicationArea = ({ onEnterFocusMode }: CommunicationAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [mascotTask, setMascotTask] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [responseScale, setResponseScale] = useState(1);
  const [selectedInlineTool, setSelectedInlineTool] = useState<{ key: InlineToolKey; label: string } | null>(null);
  const [chatAttachments, setChatAttachments] = useState<ChatAttachment[]>([]);
  const [mascotPrompt, setMascotPrompt] = useState('');
  const [liveVoicePrompt, setLiveVoicePrompt] = useState('');
  const [paseoOpen, setPaseoOpen] = useState(false);
  const [paseoQr, setPaseoQr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem(SOUND_PREFERENCE_KEY) === 'true'
  ));
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => (
    typeof window !== 'undefined' ? window.localStorage.getItem(SOUND_VOICE_KEY) || '' : ''
  ));
  const [activeAgentName, setActiveAgentName] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeAgentEngine, setActiveAgentEngine] = useState<string>('');
  const [activeAgentSkills, setActiveAgentSkills] = useState<string[]>([]);
  const [agentProjectForm, setAgentProjectForm] = useState<AgentProjectForm>(emptyAgentProjectForm);
  const [operationMode, setOperationMode] = useState<(typeof OPERATION_MODES)[number]>('SEO EstratÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gico');
  const [styleMode, setStyleMode] = useState<(typeof STYLE_MODES)[number]>('ExplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Humana');
  const [missionToday, setMissionToday] = useState('');
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitDate, setTimeLimitDate] = useState('');
  const [fundsAvailable, setFundsAvailable] = useState<'si' | 'no'>('si');
  const [winnerPrompts, setWinnerPrompts] = useState<Array<{ id: string; title: string; prompt: string; savedAt: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  const agentUiCopy = AGENT_UI_COPY[language];
  const inlineToolsCopy = INLINE_TOOLS_COPY[language];
  const inlineToolLabels = inlineToolsCopy.tools;
  const { toast } = useToast();
  const { user, subscriptionPlan } = useAuth();
  const planEngine = useMemo(() => getDefaultModelForPlan(subscriptionPlan), [subscriptionPlan]);
  
  const { sendMessage, isLoading: aiLoading } = useAIChat();
  const { speak, stop, voices } = useKokoroTTS();
  const {
    isListening: isMascotVoiceListening,
    transcript: mascotVoiceTranscript,
    isSupported: isMascotVoiceSupported,
    toggleListening: toggleMascotVoice,
  } = useVoiceCommands({
    onCommand: (command) => {
      const cleaned = command.trim();
      if (!cleaned) return;
      setMascotPrompt((current) => {
        const existing = current.trim();
        return existing ? `${existing} ${cleaned}` : cleaned;
      });
      forceFocus();
    },
  });
  const spokenMessageRef = useRef<string | null>(null);
  useEffect(() => {
    setActiveAgentEngine(current => current || planEngine);
  }, [planEngine]);

  // Permanent auto-focus
  const forceFocus = useCallback(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => { forceFocus(); }, [forceFocus]);

  useEffect(() => {
    const handleFocusConsole = () => forceFocus();
    window.addEventListener('eq:focus-console', handleFocusConsole);
    return () => window.removeEventListener('eq:focus-console', handleFocusConsole);
  }, [forceFocus]);

  useEffect(() => {
    if (isMascotVoiceListening) {
      setLiveVoicePrompt(mascotVoiceTranscript);
      return;
    }

    setLiveVoicePrompt('');
  }, [isMascotVoiceListening, mascotVoiceTranscript]);

  useEffect(() => {
    const zoomIn = () => setResponseScale(value => Math.min(1.45, Number((value + 0.08).toFixed(2))));
    const zoomOut = () => setResponseScale(value => Math.max(0.86, Number((value - 0.08).toFixed(2))));

    window.addEventListener('eq:response-zoom-in', zoomIn);
    window.addEventListener('eq:response-zoom-out', zoomOut);
    return () => {
      window.removeEventListener('eq:response-zoom-in', zoomIn);
      window.removeEventListener('eq:response-zoom-out', zoomOut);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('eq_winner_prompts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWinnerPrompts(parsed);
        }
      }
    } catch {
      // ignore malformed local cache
    }
  }, []);

  useEffect(() => {
    const handleAgentSelected = (event: Event) => {
      const detail = (event as CustomEvent<{
        id?: string;
        name?: string;
        tasks?: string[];
        engine?: string;
      }>).detail || {};
      const agentName = detail.name || 'Agente';
      const engine = planEngine;
      const operatorName = getOperatorName(user);
      const command = buildAgentCommand(agentName, detail.tasks || [], engine, operatorName, language);
      const subscriptionRaw = localStorage.getItem('eq_subscription_context');
      const subscription = subscriptionRaw ? JSON.parse(subscriptionRaw) : null;
      localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify({
        id: detail.id,
        name: agentName,
        engine,
        tasks: detail.tasks || [],
        selectedAt: new Date().toISOString(),
      }));
      (window as unknown as {
        __eqDashboardContext?: unknown;
      }).__eqDashboardContext = {
        activeAgent: {
          id: detail.id,
          name: agentName,
          engine,
          tasks: detail.tasks || [],
        },
        subscription,
        updatedAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: command.content,
        timestamp: new Date(),
        model: engine,
        agentCommand: {
          agentName,
          userName: operatorName,
          proposals: command.proposals,
        },
      }]);
      announceTaskSuggestions(agentName, command.proposals, 'agent-selected');
      setInputValue('');
      setActiveAgentName(agentName);
      setActiveAgentId(detail.id || null);
      setActiveAgentEngine(engine);
      setAgentProjectForm(emptyAgentProjectForm);
      setToolsOpen(false);
      forceFocus();
    };

    window.addEventListener('eq:agent-selected', handleAgentSelected);
    return () => window.removeEventListener('eq:agent-selected', handleAgentSelected);
  }, [forceFocus, language, planEngine, user]);

  useEffect(() => {
    // Si ya hay mensajes del usuario, no tocar el historial.
    // Si solo existe el saludo inicial del agente (agentCommand sin respuesta del
    // usuario), regenerarlo al cambiar idioma para que la bienvenida se reinicie.
    if (messages.length > 1) return;
    if (messages.length === 1 && messages[0].role === 'user') return;

    try {
      const rawActiveAgent = localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY);
      if (!rawActiveAgent) return;

      const activeAgent = JSON.parse(rawActiveAgent) as {
        id?: string;
        name?: string;
        engine?: string;
        tasks?: string[];
        skills?: string[];
      };

      if (!activeAgent.name) return;

      const operatorName = getOperatorName(user);
      const command = buildAgentCommand(
        activeAgent.name,
        activeAgent.tasks || [],
        planEngine,
        operatorName,
        language,
      );

      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: command.content,
        timestamp: new Date(),
        model: planEngine,
        agentCommand: {
          agentName: activeAgent.name,
          userName: operatorName,
          proposals: command.proposals,
        },
      }]);
      announceTaskSuggestions(activeAgent.name, command.proposals, 'cached-agent');
      setActiveAgentName(activeAgent.name);
      setActiveAgentId(activeAgent.id || null);
      setActiveAgentEngine(planEngine);
      setActiveAgentSkills(activeAgent.skills || []);
    } catch {
      // ignore malformed active agent cache
    }
  }, [language, messages.length, planEngine, user]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      const lineH = 28;
      const maxH = lineH * 5 + 24;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
    }
  }, []);

  useEffect(() => { autoResize(); }, [inputValue, autoResize]);

  // Voz → texto en vivo: graba y transcribe al instante dentro del input
  const { supported: micSupported, listening: isMicListening, interim: micInterim, toggle: toggleMic, stop: stopMic } = useSpeechToText({
    onCommit: (text) => {
      setInputValue(prev => (prev ? `${prev.trimEnd()} ${text}` : text));
      forceFocus();
    },
    onError: (code) => {
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast({ title: 'Micrófono bloqueado', description: 'Habilitá el micrófono en el navegador para usar voz a texto.' });
      } else if (code === 'unsupported') {
        toast({ title: 'Voz no soportada', description: 'Usá Chrome o Edge para la transcripción por voz.' });
      }
      // 'no-speech' / 'aborted' / 'network' = ruido normal del reconocedor, se ignora
    },
  });

  useEffect(() => { autoResize(); }, [micInterim, autoResize]);

  const addChatFiles = useCallback(async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    const remainingSlots = MAX_CHAT_ATTACHMENTS - chatAttachments.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Adjuntos completos',
        description: `Maximo ${MAX_CHAT_ATTACHMENTS} archivos por mensaje.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    for (const file of incoming) {
      if (!isAcceptedChatAttachment(file)) {
        toast({
          title: 'Archivo no compatible',
          description: `${file.name || 'archivo'} no es imagen ni PDF.`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
        toast({
          title: 'Archivo muy pesado',
          description: `${file.name || 'archivo'} supera ${formatAttachmentSize(MAX_CHAT_ATTACHMENT_BYTES)}.`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    const selectedFiles = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      toast({
        title: 'Adjuntos limitados',
        description: `Solo agregue ${remainingSlots} archivo(s) mas.`,
      });
    }

    if (selectedFiles.length === 0) return;

    try {
      const nextAttachments = await Promise.all(selectedFiles.map(fileToChatAttachment));
      setChatAttachments(prev => [...prev, ...nextAttachments].slice(0, MAX_CHAT_ATTACHMENTS));
      toast({
        title: 'Adjunto listo',
        description: `${nextAttachments.length} archivo(s) preparado(s) para Qwen VL.`,
      });
    } catch (error) {
      toast({
        title: 'No pude leer el archivo',
        description: error instanceof Error ? error.message : 'Error de lectura.',
        variant: 'destructive',
      });
    } finally {
      forceFocus();
    }
  }, [chatAttachments.length, forceFocus, toast]);

  const handleChatPaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files || []);
    const itemFiles = Array.from(event.clipboardData.items || [])
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    const pastedFiles = [...files, ...itemFiles].filter((file, index, allFiles) => (
      allFiles.findIndex(candidate => (
        candidate.name === file.name
        && candidate.type === file.type
        && candidate.size === file.size
      )) === index
    ));

    if (pastedFiles.length === 0) return;

    event.preventDefault();
    void addChatFiles(pastedFiles);
  }, [addChatFiles]);

  const handleChatDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const files = event.dataTransfer.files;
    if (!files?.length) return;

    event.preventDefault();
    void addChatFiles(files);
  }, [addChatFiles]);

  const handleChatDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
    }
  }, []);

  const handleChatFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files?.length) void addChatFiles(files);
    event.target.value = '';
  }, [addChatFiles]);

  const removeChatAttachment = useCallback((id: string) => {
    setChatAttachments(prev => prev.filter(item => item.id !== id));
    forceFocus();
  }, [forceFocus]);

  // Resume saved session from HistoryModal
  useEffect(() => {
    const loadResume = (detail?: { messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string; model?: string }>; context?: any }) => {
      let msgs = detail?.messages;
      let resumeContext = detail?.context;
      if (!msgs) {
        try {
          const raw = sessionStorage.getItem('eq_resume_session');
          if (raw) {
            const parsed = JSON.parse(raw);
            msgs = parsed.messages;
            resumeContext = parsed.context;
          }
        } catch { /* ignore */ }
      }
      if (msgs && msgs.length) {
        setMessages(msgs.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          model: m.model,
        })));
        if (resumeContext) {
          (window as unknown as { __eqDashboardContext?: unknown }).__eqDashboardContext = resumeContext;
          const restoredAgent = resumeContext.activeAgent;
          if (restoredAgent) {
            setActiveAgentName(restoredAgent.name || null);
            setActiveAgentId(restoredAgent.id || null);
            setActiveAgentEngine(restoredAgent.engine || planEngine);
          }
        }
        sessionStorage.removeItem('eq_resume_session');
        forceFocus();
      }
    };
    loadResume();
    const handler = (e: Event) => loadResume((e as CustomEvent).detail);
    window.addEventListener('eq:resume-session', handler);
    return () => window.removeEventListener('eq:resume-session', handler);
  }, [forceFocus, inlineToolsCopy.tools, planEngine]);

  // Listen for tool prompts/results from ToolsMenu
  useEffect(() => {
    const onPrompt = (e: Event) => {
      const { tool, prompt } = (e as CustomEvent).detail || {};
      if (!prompt) return;
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'user',
        content: `**${tool}** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ${prompt}`,
        timestamp: new Date(),
      }]);
      forceFocus();
    };
    const onResult = (e: Event) => {
      const { tool, model, content, imageUrl } = (e as CustomEvent).detail || {};
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: content || (imageUrl ? `Imagen generada para: ${tool}` : ''),
        imageUrl,
        model,
        toolLabel: tool,
        timestamp: new Date(),
      }]);
      forceFocus();
    };
    const onMascot = () => {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        toolLabel: 'Mascota',
        mascot: true,
        timestamp: new Date(),
      }]);
      forceFocus();
    };
    window.addEventListener('eq:tool-user-prompt', onPrompt);
    window.addEventListener('eq:tool-result', onResult);
    window.addEventListener('eq:mascot-greeting', onMascot);
    return () => {
      window.removeEventListener('eq:tool-user-prompt', onPrompt);
      window.removeEventListener('eq:tool-result', onResult);
      window.removeEventListener('eq:mascot-greeting', onMascot);
    };
  }, [forceFocus, inlineToolsCopy.tools]);

  useEffect(() => {
    const handleInlineToolSelected = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: InlineToolKey; label?: string }>).detail || {};
      if (!detail.key || !INLINE_TOOL_ICONS[detail.key]) return;
      setSelectedInlineTool({
        key: detail.key,
        label: detail.label || inlineToolLabels[detail.key].label,
      });
      forceFocus();
    };

    const handleInlineToolCleared = () => {
      setSelectedInlineTool(null);
      forceFocus();
    };

    window.addEventListener('eq:inline-tool-selected', handleInlineToolSelected);
    window.addEventListener('eq:inline-tool-cleared', handleInlineToolCleared);
    return () => {
      window.removeEventListener('eq:inline-tool-selected', handleInlineToolSelected);
      window.removeEventListener('eq:inline-tool-cleared', handleInlineToolCleared);
    };
  }, [forceFocus, inlineToolLabels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Publish current messages so ExitModal can snapshot the full session
    (window as unknown as { __eqMessages?: Message[] }).__eqMessages = messages;
  }, [messages]);

  useEffect(() => {
    if (!soundEnabled) {
      stop();
      return;
    }

    const latestAssistant = [...messages].reverse().find(
      (message) => message.role === 'assistant' && message.content.trim(),
    );

    if (!latestAssistant || spokenMessageRef.current === latestAssistant.id) return;

    spokenMessageRef.current = latestAssistant.id;
    const cleanText = speechText(latestAssistant.content);

    if (cleanText) void speak(cleanText, selectedVoiceName || undefined);
  }, [messages, selectedVoiceName, soundEnabled, speak, stop]);

  const toggleSound = () => {
    setSoundEnabled((enabled) => {
      const next = !enabled;
      localStorage.setItem(SOUND_PREFERENCE_KEY, String(next));
      if (!next) stop();
      return next;
    });
  };

  const voiceOptions = voices
    .filter((voice) => SOUND_LANGUAGES.some((languageCode) => voice.lang.toLowerCase().startsWith(languageCode)))
    .slice(0, 6);
  const voiceLanguageNames: Record<string, string> = {
    es: 'ES', en: 'EN', pt: 'PT', it: 'IT', fr: 'FR', de: 'DE', el: 'GR',
  };

  const chooseVoice = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem(SOUND_VOICE_KEY, voiceName);
    setSoundMenuOpen(false);
  };

  const toggleLike = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction: m.reaction === 'up' ? null : 'up' } : m));
    forceFocus();
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    forceFocus();
  };

  const sendComposerMessage = async (currentInput: string, currentAttachments: ChatAttachment[] = []) => {
    if ((!currentInput && currentAttachments.length === 0) || aiLoading) return;

    if (selectedInlineTool && currentAttachments.length === 0) {
      setInputValue('');
      setMascotPrompt('');
      forceFocus();
      window.dispatchEvent(new CustomEvent('eq:run-selected-tool', {
        detail: {
          prompt: currentInput,
          preferredModel: activeAgentEngine || planEngine,
          agentId: activeAgentId || undefined,
        },
      }));
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput || 'Analizar archivo adjunto.',
      timestamp: new Date(),
      attachments: currentAttachments,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setChatAttachments([]);
    setMascotPrompt('');
    forceFocus();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(
        currentInput,
        history,
        activeAgentId || undefined,
        currentAttachments,
        activeAgentEngine || planEngine,
        undefined,
        activeAgentSkills,
      );
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        model: typeof result.meta?.effectiveModel === 'string'
          ? result.meta.effectiveModel
          : typeof result.meta?.model === 'string'
            ? result.meta.model
            : undefined,
        route: typeof result.meta?.route === 'string' ? result.meta.route : undefined,
        agentId: typeof result.meta?.agentId === 'string' ? result.meta.agentId : undefined,
        agentRoute: typeof result.meta?.agentRoute === 'string' ? result.meta.agentRoute : undefined,
        provider: typeof result.meta?.provider === 'string' ? result.meta.provider : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
      announceProgress(result.response, 'handleSend');
      forceFocus();

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'AI no disponible',
        description: errorMessageText,
        variant: 'destructive',
      });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('chat.error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      forceFocus();
    }
  };

  const handleSend = async () => {
    // Si la voz está grabando, commitear lo hablado antes de enviar
    const currentInput = isMicListening && micInterim
      ? (inputValue ? `${inputValue} ${micInterim}` : micInterim).trim()
      : inputValue.trim();
    if (isMicListening) stopMic();
    await sendComposerMessage(currentInput, chatAttachments);
  };

  const handleMascotPromptSend = async () => {
    const currentInput = mascotPrompt.trim();
    if (!currentInput || aiLoading) return;
    await sendComposerMessage(currentInput, []);
  };

  const updateAgentProjectField = (key: keyof AgentProjectForm, value: string) => {
    setAgentProjectForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAgentProjectSubmit = async () => {
    if (!activeAgentName || aiLoading) return;

    const filled = metricFields
      .map(field => `${field.label}: ${agentProjectForm[field.key].trim() || 'Pendiente'}`)
      .join('\n');
    const instructionOne = [
      `Modo de Operacion: ${operationMode}.`,
      `Estilo de respuesta: ${styleMode}.`,
      `Mision de hoy: ${missionToday.trim() || 'Pendiente'}.`,
      `Time limit: ${timeLimitEnabled ? (timeLimitDate || 'Definido por el usuario') : 'Sin limite'}.`,
      `Fondos disponibles: ${fundsAvailable === 'si' ? 'Si' : 'No'}.`,
    ].join('\n');
    const currentAgentName = activeAgentName;
    const currentAgentId = activeAgentId;
    const currentAgentEngine = activeAgentEngine || planEngine;
    const currentInput = [
      `Activar ${currentAgentName} con este proyecto y llevar metricas operativas.`,
      `Motor configurado: ${currentAgentEngine}.`,
      '',
      'Instruccion 1:',
      instructionOne,
      '',
      'Instruccion 2:',
      filled,
      '',
      'Devolve checkpoints, riesgos, permisos necesarios y primera accion medible.',
    ].join('\n');

    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: [
        `**${currentAgentName} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tablero de metricas**`,
        '',
        filled,
      ].join('\n'),
      timestamp: new Date(),
    }]);
    setActiveAgentName(null);
    setInputValue('');
    forceFocus();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(currentInput, history, currentAgentId || undefined, [], currentAgentEngine, undefined, activeAgentSkills);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        model: typeof result.meta?.effectiveModel === 'string'
          ? result.meta.effectiveModel
          : typeof result.meta?.model === 'string'
            ? result.meta.model
            : currentAgentName,
        route: typeof result.meta?.route === 'string' ? result.meta.route : undefined,
        agentId: typeof result.meta?.agentId === 'string' ? result.meta.agentId : undefined,
        agentRoute: typeof result.meta?.agentRoute === 'string' ? result.meta.agentRoute : undefined,
        provider: typeof result.meta?.provider === 'string' ? result.meta.provider : undefined,
      }]);
      announceProgress(result.response, 'agent-metrics');
    } catch (error) {
      console.error('Error sending agent metrics:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'AI no disponible',
        description: errorMessageText,
        variant: 'destructive',
      });
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('chat.error'),
        timestamp: new Date(),
      }]);
    } finally {
      forceFocus();
    }
  };

  const saveWinnerPrompt = () => {
    const prompt = [
      `Modo: ${operationMode}`,
      `Estilo: ${styleMode}`,
      `Mision: ${missionToday.trim() || 'Pendiente'}`,
      `Time limit: ${timeLimitEnabled ? (timeLimitDate || 'Definido por el usuario') : 'Sin limite'}`,
      `Fondos: ${fundsAvailable === 'si' ? 'Si' : 'No'}`,
    ].join(' | ');

    const nextEntry = {
      id: crypto.randomUUID(),
      title: `${operationMode} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${styleMode}`,
      prompt,
      savedAt: new Date().toISOString(),
    };

    setWinnerPrompts(prev => {
      const next = [nextEntry, ...prev].slice(0, 6);
      localStorage.setItem('eq_winner_prompts', JSON.stringify(next));
      return next;
    });
    toast({ title: 'Prompt ganador guardado', description: operationMode });
  };

  const requestIntegration = (provider: string, reason: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: [
        agentUiCopy.permissionRequired(provider),
        '',
        reason,
        '',
        agentUiCopy.permissionFallback,
      ].join('\n'),
      timestamp: new Date(),
      model: 'permission-router',
    }]);
    window.dispatchEvent(new CustomEvent('eq:open-integration-center', { detail: { provider, reason } }));
    forceFocus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedInlineToolMeta = selectedInlineTool
    ? {
        label: inlineToolsCopy.tools[selectedInlineTool.key].label,
        icon: INLINE_TOOL_ICONS[selectedInlineTool.key],
      }
    : null;
  const SelectedInlineToolIcon = selectedInlineToolMeta?.icon;
  const activeResponseMessage = [...messages].reverse().find((msg) => msg.role === 'assistant') || null;
  const historyMessages = activeResponseMessage
    ? messages.filter((msg) => msg.id !== activeResponseMessage.id && msg.role === 'assistant')
    : messages.filter((msg) => msg.role === 'assistant');
  const paseoLink = useMemo(() => {
    if (typeof window === 'undefined') return '/mascota-paseo';
    const agentName = activeResponseMessage?.agentCommand?.agentName || activeAgentName || 'Mascota';
    const params = new URLSearchParams({ agent: agentName });
    return `${window.location.origin}/mascota-paseo?${params.toString()}`;
  }, [activeAgentName, activeResponseMessage?.agentCommand?.agentName]);

  useEffect(() => {
    if (!paseoOpen) return;
    let cancelled = false;

    void QRCode.toDataURL(paseoLink, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#06101a', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!cancelled) setPaseoQr(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setPaseoQr('');
      });

    return () => {
      cancelled = true;
    };
  }, [paseoLink, paseoOpen]);
  const historyTitleByLanguage: Record<Language, string> = {
    ES: 'Historial',
    EN: 'History',
    PT: 'Historico',
    DE: 'Verlauf',
    IT: 'Cronologia',
    FR: 'Historique',
    NL: 'Geschiedenis',
    PL: 'Historia',
  };

  return (
    <div className="relative mx-auto h-full w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Messages */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden px-1"
        style={{
          bottom: 'calc(var(--dashboard-console-height) + var(--dashboard-console-gap) + 18px)',
        }}
      >
        <div className="flex h-full flex-col justify-end min-h-0">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <p className="text-muted-foreground/40 text-xs font-mono tracking-widest">{agentUiCopy.focusMode}</p>
          </motion.div>
        ) : (
          <div className="flex-1 min-h-0 pb-6">
            <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-0">
              {false && historyMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="min-h-[5.25rem] max-h-[32%] overflow-hidden rounded-[22px] border border-emerald-300/18 bg-black/42 px-3 py-2 backdrop-blur-2xl shadow-[0_0_26px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 border-b border-emerald-200/10 pb-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200/70">
                      {historyTitleByLanguage[language]}
                    </span>
                    <span className="rounded-full border border-emerald-300/15 bg-emerald-300/8 px-2 py-0.5 font-mono text-[9px] text-emerald-100/55">
                      {historyMessages.length}
                    </span>
                  </div>

                  <div className="max-h-[calc(100%-2rem)] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                    {historyMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.015 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="w-full rounded-2xl border border-cyan-300/12 bg-cyan-300/6 px-3 py-2 text-left">
                            <div className="mb-1 flex items-center gap-2">
                              <Cpu className="h-3 w-3 text-cyan-300/65" />
                              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-200/60">
                                {modelDisplayName(msg.model) || planEngine}
                              </span>
                              {(msg.agentId || msg.route) && (
                                <span className="rounded border border-emerald-300/15 bg-emerald-300/8 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-[0.12em] text-emerald-200/60">
                                  {msg.agentId || msg.route}{msg.agentRoute ? ` -> ${msg.agentRoute}` : ''}
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  type="button"
                                  aria-pressed={msg.reaction === 'up'}
                                  aria-label={agentUiCopy.like}
                                  onClick={() => toggleLike(msg.id)}
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                                    msg.reaction === 'up'
                                      ? 'border-emerald-300/80 bg-emerald-500/30 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.28)]'
                                      : 'border-emerald-300/45 bg-emerald-500/15 text-emerald-200 hover:border-emerald-200/80 hover:bg-emerald-500/30 hover:text-white'
                                  }`}
                                  title={agentUiCopy.like}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Parar audio"
                                  onClick={stop}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-amber-300/65 bg-amber-400/22 text-amber-100 transition-colors hover:border-amber-100 hover:bg-amber-400/40 hover:text-white"
                                  title="Parar audio"
                                >
                                  <VolumeX className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={agentUiCopy.delete}
                                  onClick={() => deleteMessage(msg.id)}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-300/65 bg-red-500/22 text-red-100 transition-colors hover:border-red-100 hover:bg-red-500/40 hover:text-white"
                                  title={agentUiCopy.delete}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-[11px] leading-5 text-cyan-50/68">
                              {msg.imageUrl
                                ? msg.toolLabel || 'Imagen generada'
                                : msg.mascot && !msg.content
                                  ? 'Pip / Mascot'
                                  : msg.content}
                            </p>
                          </div>
                        ) : (
                          <div className="max-w-[78%] rounded-2xl border border-cyan-300/16 bg-black/45 px-3 py-2 text-[11px] leading-5 text-cyan-50/72">
                            <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-200/45">you</div>
                            <p className="max-h-10 overflow-hidden">{msg.content}</p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {msg.attachments.map((attachment) => (
                                  <span
                                    key={attachment.id}
                                    className="inline-flex max-w-[180px] items-center gap-1 rounded-lg border border-cyan-300/14 bg-cyan-300/7 px-2 py-0.5 font-mono text-[9px] text-cyan-100/58"
                                  >
                                    {attachment.mimeType === 'application/pdf' ? (
                                      <FileText className="h-3 w-3 shrink-0" />
                                    ) : (
                                      <ImageIcon className="h-3 w-3 shrink-0" />
                                    )}
                                    <span className="truncate">{attachment.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div
                className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin"
                style={{ perspective: '1400px' }}
              >
                {activeResponseMessage ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeResponseMessage.id}
                      initial={{ opacity: 0, rotateY: -360, scale: 0.86, y: 22 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
                      exit={{ opacity: 0, rotateY: 360, scale: 0.86, y: -18 }}
                      transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full origin-center"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {activeResponseMessage.mascot && !activeResponseMessage.content ? (
                        <MascotGreeting onPickTask={(task) => setMascotTask(task)} />
                      ) : activeResponseMessage.imageUrl ? (
                        <div className="rounded-2xl border border-cyan-400/30 bg-black/60 p-3 backdrop-blur-xl">
                          <img src={activeResponseMessage.imageUrl} alt={activeResponseMessage.toolLabel || 'Imagen'} className="w-full max-w-xl rounded-xl" />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <AgentResponsePanel
                              content={activeResponseMessage.content}
                              model={activeResponseMessage.model}
                              mascot={activeResponseMessage.mascot}
                              responseScale={responseScale}
                              isThinking={aiLoading}
                              onSpeak={() => {
                                const text = speechText(activeResponseMessage.content);
                                if (text) void speak(text, selectedVoiceName || undefined);
                              }}
                            />
                            {activeResponseMessage.agentCommand && (
                              <div className="mt-2 flex justify-end">
                                <a
                                  href={paseoLink}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-black/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/75 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-50"
                                >
                                  <Smartphone className="h-3.5 w-3.5" />
                                  Mascota
                                </a>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {!(activeResponseMessage.mascot && !activeResponseMessage.content) && (
                        <div className="relative z-20 mt-3 flex items-center gap-2 rounded-b-[18px] px-5 pb-3 pt-1">
                          <Cpu className="h-3 w-3 text-cyan-400/70" />
                          <span className="font-mono text-[10px] tracking-wider text-cyan-300/70">
                            {activeResponseMessage.model || planEngine}
                          </span>
                          {(activeResponseMessage.agentId || activeResponseMessage.route) && (
                            <span className="rounded border border-emerald-300/15 bg-emerald-300/8 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.12em] text-emerald-200/70">
                              {activeResponseMessage.agentId || activeResponseMessage.route}{activeResponseMessage.agentRoute ? ` -> ${activeResponseMessage.agentRoute}` : ''}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-pressed={activeResponseMessage.reaction === 'up'}
                              aria-label={agentUiCopy.like}
                              onClick={() => toggleLike(activeResponseMessage.id)}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                                activeResponseMessage.reaction === 'up'
                                  ? 'border-emerald-300/80 bg-emerald-500/30 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                                  : 'border-emerald-300/45 bg-emerald-500/15 text-emerald-200 hover:border-emerald-200/80 hover:bg-emerald-500/30 hover:text-white'
                              }`}
                              title={agentUiCopy.like}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Reproducir mensaje"
                              onClick={() => {
                                const text = speechText(activeResponseMessage.content);
                                if (text) void speak(text, selectedVoiceName || undefined);
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-200/70 bg-cyan-400 text-slate-950 transition-colors hover:bg-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                              title="Reproducir mensaje"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Parar audio"
                              onClick={stop}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-300/65 bg-amber-400/22 text-amber-100 transition-colors hover:border-amber-100 hover:bg-amber-400/40 hover:text-white"
                              title="Parar audio"
                            >
                              <VolumeX className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={agentUiCopy.delete}
                              onClick={() => deleteMessage(activeResponseMessage.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-300/65 bg-red-500/22 text-red-100 transition-colors hover:border-red-100 hover:bg-red-500/40 hover:text-white"
                              title={agentUiCopy.delete}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full items-center justify-center rounded-[22px] border border-slate-200/40 bg-slate-700/35 text-center font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_35px_rgba(0,0,0,0.25)]"
                  >
                    {aiLoading ? (
                      <div className="w-full max-w-md px-6">
                        <div className="mb-3 flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-2 text-cyan-100/85">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                            AGENT THINKING
                          </span>
                          <span className="text-emerald-200/80">TYPING...</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full border border-cyan-200/25 bg-slate-950/80">
                          <motion.div
                            className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300"
                            animate={{ x: ['-110%', '310%'] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>
                      </div>
                    ) : agentUiCopy.focusMode}
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Command Console */}
      <div
        className="absolute inset-x-0 z-20"
        style={{
          bottom: 'var(--dashboard-console-gap)',
        }}
      >
        <InlineToolsPanel open={toolsOpen} onClose={() => setToolsOpen(false)} />
        {activeAgentName && activeAgentEngine === '__legacy_project_console__' ? (
          <motion.div
            key={activeAgentName}
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-300/55 bg-black/60 backdrop-blur-2xl"
            style={{
              boxShadow: '0 0 44px rgba(34,211,238,0.34), inset 0 0 24px rgba(6,182,212,0.16)',
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent" />
            <div className="relative border-b border-cyan-300/18 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/35 bg-black/50">
                  <div className="flex h-full w-full items-center justify-center bg-black/80 text-[9px] font-mono uppercase tracking-[0.18em] text-emerald-200/70">
                    HY3
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-semibold tracking-wide text-cyan-50">
                    {activeAgentName}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/60">
                    Formulario tecnico interno
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1">
                  <Cpu className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-100/70">
                    {activeAgentEngine || planEngine}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-2xl border border-emerald-300/16 bg-emerald-300/6 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-200/70">
                    Motor configurado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-50">
                    {activeAgentEngine || planEngine}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-emerald-100/55">
                    Razonamiento multi-paso, orquestacion de agentes y ejecucion de largo recorrido.
                    Pensado para panel interno, trazabilidad y proyectos operativos.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-300/16 bg-black/25 px-2.5 py-1 text-[10px] text-emerald-100/70">
                      1M context
                    </span>
                    <span className="rounded-full border border-emerald-300/16 bg-black/25 px-2.5 py-1 text-[10px] text-emerald-100/70">
                      MoE
                    </span>
                    <span className="rounded-full border border-emerald-300/16 bg-black/25 px-2.5 py-1 text-[10px] text-emerald-100/70">
                      Agentic workflows
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-300/15 bg-black/28 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/60">
                    Perfil tecnico
                  </p>
                  <div className="mt-2 grid gap-2 text-[11px] text-cyan-50/72">
                    <p>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Modelo base para el proyecto nuevo: <span className="text-cyan-200">{activeAgentEngine || planEngine}</span></p>
                    <p>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Salida pensada para panel interno y trazabilidad operativa.</p>
                    <p>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Debe mantener respuestas directas y resumen ejecutivo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-cyan-300/12 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">Modo de OperaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n</p>
                  <h3 className="mt-1 text-sm font-semibold text-cyan-50">InstrucciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n 1 del nuevo proyecto</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeLimitEnabled((value) => !value)}
                  className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100/80 transition hover:bg-emerald-300/15"
                >
                  Time Limit
                </button>
              </div>

              <div className="mt-3 grid gap-3">
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                    Modos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OPERATION_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setOperationMode(mode)}
                        className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-all duration-200 ${
                          operationMode === mode
                            ? 'border-cyan-300/55 bg-gradient-to-r from-cyan-300/20 to-emerald-300/14 text-cyan-50 shadow-[0_0_0_1px_rgba(103,232,249,0.12),0_10px_24px_rgba(34,211,238,0.08)]'
                            : 'border-white/10 bg-white/5 text-cyan-50/72 hover:border-cyan-300/28 hover:bg-cyan-300/10 hover:text-cyan-50'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            operationMode === mode ? 'bg-cyan-200 shadow-[0_0_10px_rgba(165,243,252,0.65)]' : 'bg-white/20 group-hover:bg-cyan-200/60'
                          }`}
                        />
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                    Formato y tono
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_MODES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setStyleMode(style)}
                        className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-all duration-200 ${
                          styleMode === style
                            ? 'border-emerald-300/55 bg-gradient-to-r from-emerald-300/18 to-teal-300/14 text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.10),0_10px_24px_rgba(16,185,129,0.08)]'
                            : 'border-white/10 bg-white/5 text-emerald-50/72 hover:border-emerald-300/28 hover:bg-emerald-300/10 hover:text-emerald-50'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            styleMode === style ? 'bg-emerald-200 shadow-[0_0_10px_rgba(167,243,208,0.65)]' : 'bg-white/20 group-hover:bg-emerald-200/60'
                          }`}
                        />
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <label className="rounded-xl border border-cyan-300/16 bg-cyan-300/7 px-3 py-2">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">
                      Escribe la misiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de hoy...
                    </span>
                    <Textarea
                      value={missionToday}
                      onChange={(event) => setMissionToday(event.target.value)}
                      placeholder="Escribe la misiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de hoy..."
                      className="min-h-[100px] border-0 bg-transparent p-0 text-sm text-cyan-50 placeholder:text-cyan-100/24 focus-visible:ring-0"
                    />
                  </label>

                  <div className="space-y-3 rounded-xl border border-emerald-300/16 bg-emerald-300/6 p-3">
                    <div>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">
                        Fondos disponibilidad
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['si', 'no'] as const).map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setFundsAvailable(choice)}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                              fundsAvailable === choice
                                ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50'
                                : 'border-white/10 bg-black/20 text-emerald-100/60 hover:border-emerald-300/20 hover:bg-emerald-300/10'
                            }`}
                          >
                            {choice === 'si' ? 'Si' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {timeLimitEnabled && (
                      <label className="block rounded-xl border border-emerald-300/16 bg-black/20 px-3 py-2">
                        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200/70">
                          Seleccionar fecha
                        </span>
                        <input
                          type="date"
                          value={timeLimitDate}
                          onChange={(event) => setTimeLimitDate(event.target.value)}
                          className="w-full bg-transparent text-sm text-emerald-50 outline-none"
                        />
                      </label>
                    )}

                    {!timeLimitEnabled && (
                      <p className="text-xs leading-relaxed text-emerald-100/50">
                        PresionÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ <span className="text-emerald-200">Time Limit</span> para abrir el selector de fecha.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={saveWinnerPrompt}
                    className="rounded-full border border-fuchsia-300/25 bg-fuchsia-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-50 transition hover:bg-fuchsia-400/15"
                  >
                    Guardar Prompt Ganador
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/40">
                    Todo esto se envÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a como instrucciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n 1 del proyecto
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {metricFields.map((field, index) => (
                <motion.label
                  key={field.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12 + index * 0.08 }}
                  className="rounded-xl border border-cyan-300/16 bg-cyan-300/7 px-3 py-2"
                >
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">
                    {field.label}
                  </span>
                  <input
                    value={agentProjectForm[field.key]}
                    onChange={(event) => updateAgentProjectField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="h-8 w-full bg-transparent text-sm text-cyan-50 outline-none placeholder:text-cyan-100/24"
                  />
                </motion.label>
              ))}
            </div>

            <div className="px-3 pb-3">
              <div className="rounded-2xl border border-cyan-300/14 bg-black/28 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">Prompts Ganadores</p>
                    <h4 className="mt-1 text-sm font-semibold text-cyan-50">Historial guardado</h4>
                  </div>
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-mono text-cyan-100/70">
                    {winnerPrompts.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {winnerPrompts.length > 0 ? (
                    winnerPrompts.map((item) => (
                      <div key={item.id} className="rounded-xl border border-cyan-300/12 bg-white/5 px-3 py-2">
                        <p className="text-xs font-semibold text-cyan-50">{item.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-cyan-50/60">{item.prompt}</p>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-xs text-cyan-50/45">
                      Sin prompts guardados aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-cyan-300/14 px-3 py-2">
              <button
                type="button"
                onClick={() => setActiveAgentName(null)}
                className="rounded-xl border border-red-300/25 bg-red-400/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-100/80 transition hover:bg-red-400/14"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleAgentProjectSubmit}
                disabled={aiLoading}
                className="rounded-xl border border-cyan-300/50 bg-cyan-300/16 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 transition hover:border-emerald-200/60 hover:bg-emerald-300/14 hover:text-emerald-100"
              >
                {aiLoading ? 'Procesando' : 'Llevar metricas'}
              </button>
            </div>
          </motion.div>
        ) : (
        <motion.div
          animate={{
            scale: isFocused ? 1.004 : 1,
            boxShadow: isFocused
              ? '0 0 60px rgba(34,211,238,0.55), 0 0 24px rgba(6,182,212,0.45) inset, 0 18px 40px rgba(0,0,0,0.6)'
              : '0 0 32px rgba(34,211,238,0.30), 0 0 16px rgba(6,182,212,0.25) inset, 0 14px 28px rgba(0,0,0,0.55)',
          }}
          transition={{ duration: 0.25 }}
          className="relative mx-auto flex w-full max-w-[min(95vw,1360px)] flex-col gap-0 overflow-visible rounded-[28px]"
          style={{
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-blue-100/16 via-cyan-100/6 to-transparent" />

          {/* Status LEDs */}
          <div className="relative px-2 pt-1 pb-1">
            <div
              className="inline-flex items-center rounded-[16px] border border-blue-200/28 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_8px_18px_rgba(0,0,0,0.18)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(66,99,168,0.55) 0%, rgba(42,66,122,0.45) 48%, rgba(10,18,44,0.82) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <StatusLEDs isThinking={aiLoading} />
            </div>
          </div>

          {/* Textarea row */}
          <div
            className="eq-spectrum-box relative mx-0 my-0 rounded-[24px] border border-white/10 px-4 py-2 sm:px-5"
            onDrop={handleChatDrop}
            onDragOver={handleChatDragOver}
            style={{
              background: 'linear-gradient(180deg, rgba(12,16,34,0.48) 0%, rgba(8,10,24,0.40) 100%)',
              boxShadow: '0 10px 22px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px rgba(96,165,250,0.06)',
              backdropFilter: 'blur(18px) saturate(140%)',
              WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            }}
          >
            <div className="pointer-events-none absolute inset-[3px] rounded-[21px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
            {chatAttachments.length > 0 && (
              <div className="relative z-10 mb-2 flex flex-wrap gap-2">
                {chatAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-cyan-300/24 bg-cyan-300/8 px-2 py-1 text-cyan-50/82"
                  >
                    {attachment.mimeType === 'application/pdf' ? (
                      <FileText className="h-4 w-4 shrink-0 text-amber-200/85" />
                    ) : (
                      <ImageIcon className="h-4 w-4 shrink-0 text-cyan-200/85" />
                    )}
                    <span className="min-w-0 truncate text-[11px] font-medium">{attachment.name}</span>
                    <span className="shrink-0 font-mono text-[9px] text-cyan-100/45">{formatAttachmentSize(attachment.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeChatAttachment(attachment.id)}
                      className="shrink-0 rounded-md p-0.5 text-cyan-100/50 transition hover:bg-red-400/12 hover:text-red-200"
                      aria-label={`Quitar ${attachment.name}`}
                      title={`Quitar ${attachment.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={isMicListening && micInterim ? (inputValue ? `${inputValue} ${micInterim}` : micInterim) : inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPaste={handleChatPaste}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isMicListening ? '🎙️ Escuchando… hablá ahora' : t('chat.placeholder')}
              disabled={aiLoading}
              autoFocus
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-foreground/95 text-xl font-display placeholder:text-muted-foreground/30 leading-relaxed scrollbar-thin caret-primary overflow-y-auto text-center sm:text-left"
              style={{ minHeight: '24px', maxHeight: '120px', caretColor: 'hsl(var(--primary))', fontSize: '18px' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,.png,.jpg,.jpeg,.webp,.gif,.pdf"
              multiple
              className="hidden"
              onChange={handleChatFileChange}
            />
          </div>

          {/* Toolbar */}
          <div className="relative flex items-center justify-between px-3 py-1.5">
            <div
              className="inline-flex items-center gap-2 rounded-[16px] border border-blue-200/28 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_8px_18px_rgba(0,0,0,0.18)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(66,99,168,0.55) 0%, rgba(42,66,122,0.45) 48%, rgba(10,18,44,0.82) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setToolsOpen(v => !v)}
                title={inlineToolsCopy.panelTitle}
                className={`h-7 w-7 rounded-xl transition-all duration-300 border ${
                  toolsOpen
                    ? 'text-cyan-200 bg-cyan-400/20 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                    : 'text-cyan-300/80 bg-cyan-400/5 border-cyan-400/30 hover:bg-cyan-400/15 hover:text-cyan-200'
                }`}
              >
                <Plus className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar imagen o PDF"
                className="h-7 w-7 rounded-xl border border-cyan-400/30 bg-cyan-400/5 text-cyan-300/80 transition-all duration-300 hover:bg-cyan-400/15 hover:text-cyan-200"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Micrófono: graba y transcribe a texto al instante */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMic}
                disabled={!micSupported || aiLoading}
                title={isMicListening ? 'Detener grabación' : 'Grabar y transcribir a texto'}
                className={`relative h-7 w-7 rounded-xl transition-all duration-300 border ${
                  isMicListening
                    ? 'text-red-400 bg-red-500/15 border-red-400/70 shadow-[0_0_14px_rgba(239,68,68,0.45)]'
                    : micSupported
                      ? 'text-cyan-300/80 bg-cyan-400/5 border-cyan-400/30 hover:bg-cyan-400/15 hover:text-cyan-200'
                      : 'text-muted-foreground/30 border-muted/20'
                }`}
              >
                {isMicListening && (
                  <>
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-red-400/70"
                      animate={{ scale: [1, 1.6], opacity: [0.9, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-red-400/50"
                      animate={{ scale: [1, 2.1], opacity: [0.6, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', delay: 0.35 }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-red-500/30"
                      animate={{ opacity: [0.15, 0.45, 0.15] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </>
                )}
                <motion.span
                  className="relative"
                  animate={isMicListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={isMicListening ? { duration: 0.5, repeat: Infinity } : {}}
                >
                  <Mic className="h-4 w-4" />
                </motion.span>
              </Button>

              <div className="relative inline-flex">
                <Button
                  variant="ghost"
                  onClick={toggleSound}
                  title={soundEnabled ? 'Desactivar lectura por voz' : 'Activar lectura por voz'}
                  aria-label={soundEnabled ? 'Desactivar SOUND' : 'Activar SOUND'}
                  aria-pressed={soundEnabled}
                  className={`h-7 rounded-l-xl rounded-r-none border px-2 transition-all duration-300 ${
                    soundEnabled
                      ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                      : 'border-cyan-400/30 bg-cyan-400/5 text-cyan-300/80 hover:bg-cyan-400/15 hover:text-cyan-200'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  <span className="text-[9px] font-mono font-bold tracking-[0.12em]">SOUND</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoundMenuOpen((open) => !open)}
                  title="Elegir voz"
                  aria-label="Elegir voz"
                  className={`h-7 w-5 rounded-l-none rounded-r-xl border border-l-0 px-0 transition-all ${
                    soundEnabled
                      ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-300'
                      : 'border-cyan-400/30 bg-cyan-400/5 text-cyan-300/80'
                  }`}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {soundMenuOpen && (
                  <div className="absolute bottom-9 left-0 z-50 min-w-[220px] rounded-xl border border-cyan-300/30 bg-slate-950/95 p-1.5 shadow-[0_0_24px_rgba(34,211,238,0.22)] backdrop-blur-xl">
                    <p className="px-2 py-1 text-[9px] font-mono uppercase tracking-[0.15em] text-cyan-200/55">
                      Voces disponibles
                    </p>
                    {voiceOptions.length > 0 ? voiceOptions.map((voice) => (
                      <button
                        key={`${voice.name}-${voice.lang}`}
                        type="button"
                        onClick={() => chooseVoice(voice.name)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[10px] transition ${
                          selectedVoiceName === voice.name
                            ? 'bg-emerald-400/18 text-emerald-200'
                            : 'text-cyan-50/80 hover:bg-cyan-400/10 hover:text-cyan-100'
                        }`}
                      >
                        <span className="max-w-[170px] truncate">{voice.name}</span>
                      <span className="ml-2 font-mono text-[9px] text-cyan-200/45">
                        {voiceLanguageNames[voice.lang.slice(0, 2).toLowerCase()] || voice.lang}
                      </span>
                      </button>
                    )) : (
                      <p className="px-2 py-2 text-[10px] text-cyan-100/55">El navegador todavÃ­a no informÃ³ voces.</p>
                    )}
                  </div>
                )}
              </div>

              {SelectedInlineToolIcon && selectedInlineTool && (
                <div className="inline-flex items-center gap-1 rounded-xl border border-cyan-300/28 bg-black/18 px-2 py-1 text-cyan-100/88 shadow-[0_0_10px_rgba(34,211,238,0.12)]">
                  <SelectedInlineToolIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[110px] truncate text-[10px] font-mono uppercase tracking-[0.14em]">
                    {selectedInlineTool.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('eq:inline-tool-clear-request'))}
                    className="rounded-md p-0.5 text-cyan-100/58 transition hover:bg-cyan-300/12 hover:text-cyan-50"
                    title="Quitar herramienta"
                    aria-label="Quitar herramienta"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              disabled={(!inputValue.trim() && chatAttachments.length === 0) || aiLoading}
              className="h-8 w-8 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] disabled:opacity-30 transition-all duration-300"
            >
              {aiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>
        )}
      </div>

      <Dialog open={paseoOpen} onOpenChange={setPaseoOpen}>
        <DialogContent className="max-w-md border-cyan-300/20 bg-slate-950 text-cyan-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-50">
              <Smartphone className="h-4 w-4 text-cyan-300" />
              Paseo mÃ³vil
            </DialogTitle>
            <DialogDescription className="text-cyan-50/60">
              Escanee el cÃ³digo para abrir la mascota en el telÃ©fono con una vista vertical pensada para conversar sin distracciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-300/15 bg-white p-3">
              {paseoQr ? (
                <img
                  src={paseoQr}
                  alt="CÃ³digo QR del paseo mÃ³vil"
                  className="mx-auto h-56 w-56 rounded-xl"
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-cyan-300/25 bg-cyan-400/5 text-center text-sm text-cyan-50/55">
                  Generando cÃ³digo QR...
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-cyan-300/12 bg-black/25 p-3 text-sm leading-relaxed text-cyan-50/72">
              Este enlace abre la vista mÃ³vil segura de la mascota. Desde ahÃ­ puede escribir o dictar y continuar el mismo flujo operativo.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(paseoLink);
                    toast({ title: 'Enlace copiado', description: 'Ya puede pegarlo o compartirlo.' });
                  } catch {
                    toast({ title: 'No pude copiar', description: 'Puede usar el enlace manualmente.' });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400/18 px-4 text-cyan-50 hover:bg-cyan-400/28"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar link
              </Button>
              <Button
                type="button"
                onClick={() => window.open(paseoLink, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/5 px-4 text-cyan-50 hover:bg-white/10"
              >
                <Link2 className="h-3.5 w-3.5" />
                Abrir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MascotTaskDialog
        open={!!mascotTask}
        task={mascotTask}
        onClose={() => { setMascotTask(null); forceFocus(); }}
        onExecute={async (action, task) => {
          setMascotTask(null);
          if (action === 'schedule') {
            toast({ title: 'Programado', description: task });
            forceFocus();
            return;
          }
          if (action === 'delegate') {
            window.dispatchEvent(new CustomEvent('eq:open-squad', { detail: { task } }));
            toast({ title: 'Delegado al SQUAD', description: task });
            forceFocus();
            return;
          }
          // Execute now: send through chat
          const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: task, timestamp: new Date() };
          setMessages(prev => [...prev, userMsg]);
          forceFocus();
          try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const result = await sendMessage(task, history, activeAgentId || undefined, [], activeAgentEngine || planEngine, undefined, activeAgentSkills);
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: result.response,
              timestamp: new Date(),
              model: typeof result.meta?.effectiveModel === 'string'
                ? result.meta.effectiveModel
                : typeof result.meta?.model === 'string'
                  ? result.meta.model
                  : undefined,
              route: typeof result.meta?.route === 'string' ? result.meta.route : undefined,
              agentId: typeof result.meta?.agentId === 'string' ? result.meta.agentId : undefined,
              agentRoute: typeof result.meta?.agentRoute === 'string' ? result.meta.agentRoute : undefined,
              provider: typeof result.meta?.provider === 'string' ? result.meta.provider : undefined,
            }]);
            announceProgress(result.response, 'mascot-task');
          } catch (e) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: t('chat.error'), timestamp: new Date() }]);
          }
        }}
      />
    </div>
  );
};
