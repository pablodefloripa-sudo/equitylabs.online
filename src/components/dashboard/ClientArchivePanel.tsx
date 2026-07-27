import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Clock3,
  Database,
  FileText,
  FolderOpen,
  Globe,
  History,
  Loader2,
  MessagesSquare,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';
const SUBSCRIPTION_STORAGE_KEY = 'eq_subscription_context';
const RUNTIME_HEALTH_KEY = 'eq_runtime_health_v1';

type SessionRow = {
  project_id: string;
  project_name: string;
  content: string;
  created_at: string;
  role: string;
  model_used: string | null;
};

type ArchiveSession = {
  project_id: string;
  project_name: string;
  message_count: number;
  updated_at: string;
  last_message: string;
  models: string[];
  context?: unknown;
};

type ArchiveDocument = {
  id: string;
  name: string;
  type: string;
  created_at: string;
  file_url: string | null;
  content: string | null;
};

type ActiveAgentContext = {
  name?: string;
  engine?: string;
};

type SubscriptionContext = {
  displayPlan?: string;
  tier?: string;
};

type RuntimeHealth = {
  updatedAt?: string;
};

interface ClientArchivePanelProps {
  isOpen: boolean;
  onOpenHistory?: () => void;
  onOpenAssets?: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const isSessionContextRow = (row: SessionRow) =>
  row.role === 'system' && row.content.startsWith('EQ_SESSION_CONTEXT:');

const parseSessionContext = (rows: SessionRow[]) => {
  const contextRow = rows.find((row) => isSessionContextRow(row));
  if (!contextRow) return undefined;
  try {
    return JSON.parse(contextRow.content.slice('EQ_SESSION_CONTEXT:'.length)).context;
  } catch {
    return undefined;
  }
};

export function ClientArchivePanel({ isOpen, onOpenHistory, onOpenAssets }: ClientArchivePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ArchiveSession[]>([]);
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAgent, setActiveAgent] = useState<ActiveAgentContext | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionContext | null>(null);
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealth | null>(null);
  const [integrationsConnected, setIntegrationsConnected] = useState('0/4');

  const loadLocalContext = useCallback(() => {
    setActiveAgent(readJson<ActiveAgentContext | null>(ACTIVE_AGENT_STORAGE_KEY, null));
    setSubscription(readJson<SubscriptionContext | null>(SUBSCRIPTION_STORAGE_KEY, null));
    setRuntimeHealth(readJson<RuntimeHealth | null>(RUNTIME_HEALTH_KEY, null));
  }, []);

  const loadArchive = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [chatResult, docsResult, integrationsResult] = await Promise.all([
        supabase
          .from('chat_history')
          .select('project_id, project_name, content, created_at, role, model_used')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('user_documents')
          .select('id, name, type, file_url, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('user_integrations')
          .select('provider, is_connected')
          .eq('user_id', user.id),
      ]);

      if (chatResult.error) throw chatResult.error;
      if (docsResult.error) throw docsResult.error;
      if (integrationsResult.error) throw integrationsResult.error;

      const rows = (chatResult.data || []) as SessionRow[];
      const docs = (docsResult.data || []) as ArchiveDocument[];
      const connectedCount = (integrationsResult.data || []).reduce(
        (count, row) => count + (row.is_connected ? 1 : 0),
        0,
      );

      const grouped = new Map<string, ArchiveSession>();
      let messageCount = 0;

      for (const row of rows) {
        if (isSessionContextRow(row)) continue;
        if (row.role === 'user' || row.role === 'assistant') {
          messageCount += 1;
        }

        const sessionId = row.project_id || 'default';
        if (!grouped.has(sessionId)) {
          grouped.set(sessionId, {
            project_id: sessionId,
            project_name: row.project_name || 'Chat Session',
            message_count: 1,
            updated_at: row.created_at,
            last_message: row.content,
            models: row.model_used ? [row.model_used] : [],
          });
        } else {
          const current = grouped.get(sessionId)!;
          current.message_count += 1;
          current.last_message = current.last_message || row.content;
          current.updated_at = current.updated_at < row.created_at ? row.created_at : current.updated_at;
          if (row.model_used && !current.models.includes(row.model_used)) {
            current.models.push(row.model_used);
          }
        }
      }

      const nextSessions = Array.from(grouped.values())
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((session) => ({
          ...session,
          context: parseSessionContext(rows.filter((row) => (row.project_id || 'default') === session.project_id)),
        }));

      setSessions(nextSessions);
      setDocuments(docs);
      setTotalMessages(messageCount);
      setIntegrationsConnected(`${connectedCount}/4`);
      loadLocalContext();

      const lastChat = rows[0]?.created_at || null;
      const lastDoc = docs[0]?.created_at || null;
      if (!lastChat && !lastDoc) {
        setLastActivityAt(null);
      } else if (!lastDoc) {
        setLastActivityAt(lastChat);
      } else if (!lastChat) {
        setLastActivityAt(lastDoc);
      } else {
        setLastActivityAt(lastChat > lastDoc ? lastChat : lastDoc);
      }
    } catch (error: any) {
      toast({
        title: 'Archive load failed',
        description: error?.message || 'Could not read saved sessions and documents.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [loadLocalContext, toast, user]);

  useEffect(() => {
    if (!isOpen) return;
    loadArchive();
    loadLocalContext();
  }, [isOpen, loadArchive, loadLocalContext]);

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      [
        session.project_name,
        session.last_message,
        session.updated_at,
        session.project_id,
        session.models.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, sessions]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) =>
      [doc.name, doc.type, doc.content || '', doc.created_at].join(' ').toLowerCase().includes(query),
    );
  }, [documents, searchQuery]);

  const archiveMetrics = useMemo(
    () => [
      { label: 'Sesiones guardadas', value: sessions.length.toString(), icon: History },
      { label: 'Mensajes', value: totalMessages.toString(), icon: MessagesSquare },
      { label: 'Documentos', value: documents.length.toString(), icon: FileText },
      { label: 'Agente activo', value: activeAgent?.name || 'Sin seleccionar', icon: Bot },
      { label: 'Plan', value: subscription?.displayPlan || subscription?.tier || 'FREE', icon: ShieldCheck },
      { label: 'Integraciones', value: integrationsConnected, icon: Globe },
      { label: 'Heartbeat', value: runtimeHealth?.updatedAt ? formatDate(runtimeHealth.updatedAt) : 'Sin registro', icon: Clock3 },
      { label: 'Ultima actividad', value: lastActivityAt ? formatDate(lastActivityAt) : 'Sin datos', icon: Clock3 },
    ],
    [
      activeAgent?.name,
      documents.length,
      integrationsConnected,
      lastActivityAt,
      runtimeHealth?.updatedAt,
      sessions.length,
      subscription?.displayPlan,
      subscription?.tier,
      totalMessages,
    ],
  );

  const resumeSession = async (session: ArchiveSession) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, role, content, created_at, model_used')
        .eq('user_id', user.id)
        .eq('project_id', session.project_id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const rows = (data || []) as Array<{
        id: string;
        role: string;
        content: string;
        created_at: string;
        model_used: string | null;
      }>;

      const context = parseSessionContext(
        rows.map((row) => ({
          project_id: session.project_id,
          project_name: session.project_name,
          content: row.content,
          created_at: row.created_at,
          role: row.role,
          model_used: row.model_used,
        })),
      );

      const messages = rows
        .filter((row) => row.role === 'user' || row.role === 'assistant')
        .map((row) => ({
          id: row.id,
          role: row.role as 'user' | 'assistant',
          content: row.content,
          timestamp: row.created_at,
          model: row.model_used || undefined,
        }));

      sessionStorage.setItem(
        'eq_resume_session',
        JSON.stringify({
          project_id: session.project_id,
          project_name: session.project_name,
          messages,
          context,
        }),
      );
      window.dispatchEvent(new CustomEvent('eq:resume-session', { detail: { project_id: session.project_id, messages, context } }));
      toast({ title: 'Sesion reactivada', description: `${session.project_name} cargada en el dashboard.` });
    } catch (error: any) {
      toast({
        title: 'No se pudo reactivar',
        description: error?.message || 'Could not resume the saved session.',
        variant: 'destructive',
      });
    }
  };

  const openDocument = (doc: ArchiveDocument) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank', 'noopener,noreferrer');
      return;
    }
    toast({
      title: 'Documento guardado',
      description: `${doc.name} no tiene URL publica, pero queda registrado en el archivo.`,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-cyan-400/15 px-4 py-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/65">Archivero del cliente</p>
          <h2 className="mt-1 text-lg font-semibold text-cyan-50">Metricas, interacciones y documentos guardados</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadArchive}
            className="rounded-full border border-cyan-300/24 bg-cyan-300/8 px-3 text-xs text-cyan-100 hover:bg-cyan-300/12"
          >
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
            Refrescar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/80 hover:bg-white/10"
          >
            <Search className="mr-1 h-3.5 w-3.5" />
            Ver historial
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/65">Filtro global</p>
                <h3 className="mt-1 text-sm font-semibold text-cyan-50">Buscar por proyecto, documento o fecha</h3>
              </div>
              <div className="w-full lg:max-w-md">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Proyecto, archivo, modelo, fecha..."
                  className="border-cyan-300/20 bg-black/40 text-cyan-50 placeholder:text-cyan-100/35"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {archiveMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-2xl border border-cyan-300/16 bg-cyan-300/8 p-4">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em]">{metric.label}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-cyan-50">{metric.value}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Interacciones guardadas</h3>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-cyan-300/15 px-4 py-8 text-center text-sm text-cyan-100/55">
                  No hay sesiones que coincidan con tu busqueda.
                </p>
              ) : (
                filteredSessions.map((session) => (
                  <motion.div
                    key={session.project_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-cyan-300/12 bg-cyan-300/7 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-cyan-50">{session.project_name}</p>
                        <p className="mt-1 text-xs text-cyan-100/55">
                          {session.message_count} mensajes - {formatDate(session.updated_at)}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-cyan-100/60">{session.last_message}</p>
                        {session.models.length > 0 ? (
                          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-cyan-300/65">
                            {session.models.join(' - ')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => resumeSession(session)}
                          className="rounded-full bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/25"
                        >
                          <Play className="mr-1 h-3.5 w-3.5" />
                          Retomar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Documentos guardados</h3>
            </div>
            <div className="space-y-2">
              {filteredDocuments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-cyan-300/15 px-4 py-8 text-center text-sm text-cyan-100/55">
                  No hay documentos que coincidan con tu busqueda.
                </p>
              ) : (
                filteredDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => openDocument(doc)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/7 p-3 text-left transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-cyan-200" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-cyan-50">{doc.name}</p>
                      <p className="mt-1 text-xs text-cyan-100/55">
                        {doc.type} - {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-cyan-200/70" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Rutas de reactivacion</h3>
            </div>
            <div className="space-y-3 text-sm text-cyan-100/65">
              <p>1. Abrir una sesion guardada para continuar donde se interrumpio.</p>
              <p>2. Abrir documentos para revisar archivos cargados o enlaces persistidos.</p>
              <p>3. Ir al historial completo si queres detalle fino de mensajes y modelos usados.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onOpenAssets}
                className="rounded-full border border-cyan-300/24 bg-cyan-300/8 text-xs text-cyan-100 hover:bg-cyan-300/12"
              >
                Ver archivos
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onOpenHistory}
                className="rounded-full border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10"
              >
                Ver historial
              </Button>
            </div>
          </div>

          <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/7 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Estado resumido</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-cyan-100/65">
              Este archivo centraliza el cliente: conversaciones, documentos, pasos retomables y puntos de reingreso.
              Desde aqui ya no se abre un flujo vacio, sino una ficha real del trabajo guardado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
