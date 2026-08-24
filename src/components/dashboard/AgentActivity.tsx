import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, X, Bot, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { modelDisplayName } from '@/lib/modelDisplay';

/* Informe de actividad de agentes — seguimiento por usuario.
   Lee public.audit_logs (RLS: solo las tareas del usuario) con
   action_type = 'agent_task' registradas por la edge function ai-chat. */

interface TaskLog {
  id: string;
  created_at: string;
  details: {
    action?: string;
    agent?: string | null;
    model?: string;
    provider?: string;
    plan?: string;
    task_preview?: string;
    status?: string;
  };
}

const PLAN_LABELS: Record<string, string> = {
  FREE_30_DAYS: 'Free Trial',
  TACTICAL_25: 'Tactical $25',
  MASTERMIND_100: 'Mastermind $100',
  ENTERPRISE_500: 'Enterprise $500',
  ALLIANCE_1000: 'Alliance $1K',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

const AgentActivity = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [report, setReport] = useState<{ loading: boolean; text: string | null }>({ loading: false, text: null });

  const generateWeeklyReport = useCallback(async () => {
    setReport({ loading: true, text: null });
    try {
      let agentId: string | undefined;
      let skills: string[] = [];
      let premiumModel: string | undefined;
      try {
        const raw = localStorage.getItem('eq_active_agent_context');
        if (raw) {
          const agent = JSON.parse(raw);
          agentId = agent.id;
          skills = agent.skills || [];
          const premium = (agent.supportModels || []).find((m: { tier: string }) => m.tier === 'premium');
          premiumModel = premium?.id;
        }
      } catch { /* sin agente activo */ }

      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: 'Generá mi REPORTE SEMANAL: resumí las tareas realizadas, logros, métricas si las hay, pendientes y próximos pasos recomendados. Formato claro con secciones.',
          agentId,
          skills,
          preferredModel: premiumModel,
        },
      });
      if (fnError || data?.error) throw new Error(data?.error || fnError?.message || 'Error');
      setReport({ loading: false, text: data.response });
    } catch (err) {
      setReport({ loading: false, text: `⚠️ ${err instanceof Error ? err.message : 'Error generando reporte'}` });
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, created_at, details')
        .eq('action_type', 'agent_task')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      setLogs((data as unknown as TaskLog[]) || []);
    } catch (err) {
      console.error('AgentActivity load failed', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const modelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      const m = l.details?.model || 'unknown';
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const filtered = useMemo(
    () => (filter === 'all' ? logs : logs.filter((l) => l.details?.model === filter)),
    [logs, filter],
  );

  const modelOptions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.details?.model).filter(Boolean))) as string[],
    [logs],
  );

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[90] flex h-11 items-center gap-2 rounded-full border border-[#00d2ff]/40 bg-[#0c0a1d]/85 px-4 text-xs font-bold text-[#00d2ff] backdrop-blur-xl hover:border-[#00d2ff] hover:shadow-[0_0_20px_rgba(0,210,255,0.25)] transition"
        title="Informe de actividad de agentes"
      >
        <ClipboardList className="w-4 h-4" />
        Informe
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#0c0a1d] shadow-[0_0_60px_rgba(0,210,255,0.15)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00d2ff] to-[#ff007f]">
                    <ClipboardList className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">Informe de actividad de agentes</h3>
                    <p className="text-[11px] font-mono text-white/40">Tareas ejecutadas por tu equipo de IA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateWeeklyReport}
                    disabled={report.loading}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 text-[11px] font-bold text-amber-200 transition hover:border-amber-300/60 disabled:opacity-50"
                    title="Usa el modelo premium del agente (restringido al plan)"
                  >
                    {report.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : '📊'} Reporte semanal
                  </button>
                  <button onClick={load} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-[#00d2ff] transition" title="Actualizar">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-white transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Resumen */}
              <div className="border-b border-white/5 px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest mr-1">Modelos activos:</span>
                  {modelOptions.length === 0 && (
                    <span className="text-[11px] text-white/30">Sin tareas registradas todavía — usá el chat y aparecerán acá.</span>
                  )}
                  {Object.entries(modelCounts).map(([model, count]) => (
                    <button
                      key={model}
                      onClick={() => setFilter(filter === model ? 'all' : model)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                        filter === model
                          ? 'border-[#00d2ff] bg-[#00d2ff]/15 text-[#00d2ff]'
                          : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30'
                      }`}
                    >
                      <Bot className="w-3 h-3" />
                      {modelDisplayName(model) || 'Modelo'}
                      <span className="text-white/40">×{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabla */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bot className="mx-auto mb-3 h-8 w-8 text-white/20" />
                    <p className="text-sm text-white/40">
                      {loading ? 'Cargando…' : 'Aún no hay tareas registradas.'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-mono uppercase tracking-widest text-white/35 border-b border-white/10">
                        <th className="pb-2 pr-3">Fecha</th>
                        <th className="pb-2 pr-3">Agente</th>
                        <th className="pb-2 pr-3">Modelo</th>
                        <th className="pb-2 pr-3">Plan</th>
                        <th className="pb-2">Tarea</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l) => (
                        <tr key={l.id} className="border-b border-white/5 text-[12px]">
                          <td className="py-2.5 pr-3 font-mono text-white/50 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                          <td className="py-2.5 pr-3">
                            <span className="rounded-md border border-[#00d2ff]/25 bg-[#00d2ff]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00d2ff]">
                              {l.details?.agent || l.details?.action || 'chat'}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-white/80">{modelDisplayName(l.details?.model) || '—'}</td>
                          <td className="py-2.5 pr-3 text-white/50">{PLAN_LABELS[l.details?.plan || ''] || l.details?.plan || '—'}</td>
                          <td className="py-2.5 text-white/60 max-w-[260px] truncate">{l.details?.task_preview || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Reporte semanal */}
              {report.text && (
                <div className="mx-5 mb-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 max-h-[30vh] overflow-y-auto">
                  <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-amber-200/70">📊 Reporte semanal · modelo premium</p>
                  <div className="text-[13px] leading-relaxed text-white/85 whitespace-pre-wrap">{report.text}</div>
                </div>
              )}

              <div className="border-t border-white/10 px-5 py-2.5 text-[10px] font-mono text-white/30">
                {filtered.length} tareas · RLS: solo ves tu actividad · actualizado en vivo por ai-chat
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AgentActivity;
