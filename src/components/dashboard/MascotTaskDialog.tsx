import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Clock, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface MascotTaskDialogProps {
  open: boolean;
  task: string | null;
  onClose: () => void;
  onExecute: (action: 'now' | 'schedule' | 'delegate', task: string) => void;
}

export const MascotTaskDialog = ({ open, task, onClose, onExecute }: MascotTaskDialogProps) => {
  const { language } = useLanguage();
  type Lang = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
  const normalizedLanguage = language.toLowerCase();
  const lang = (['es','en','pt','fr','de','it','zh','ja'].includes(normalizedLanguage) ? normalizedLanguage : 'en') as Lang;

  const t: Record<Lang, { title: string; intro: string; now: string; schedule: string; delegate: string; nowDesc: string; schDesc: string; delDesc: string }> = {
    es: { title: 'Pip propone esta tarea', intro: 'Selecciona cómo quieres ejecutarla:', now: 'Ejecutar ahora', schedule: 'Programar', delegate: 'Delegar al SQUAD', nowDesc: 'El agente activo procesará la tarea inmediatamente', schDesc: 'Añadir al planificador para más tarde', delDesc: 'Asignar a un agente especializado del SQUAD' },
    en: { title: 'Pip suggests this task', intro: 'Choose how to execute it:', now: 'Run now', schedule: 'Schedule', delegate: 'Delegate to SQUAD', nowDesc: 'Active agent will process the task immediately', schDesc: 'Add to planner for later', delDesc: 'Assign to a specialized SQUAD agent' },
    pt: { title: 'Pip sugere esta tarefa', intro: 'Escolha como executá-la:', now: 'Executar agora', schedule: 'Agendar', delegate: 'Delegar ao SQUAD', nowDesc: 'O agente ativo processará agora', schDesc: 'Adicionar ao planejador', delDesc: 'Atribuir a um agente especializado' },
    fr: { title: 'Pip propose cette tâche', intro: 'Choisissez l\'exécution :', now: 'Exécuter', schedule: 'Planifier', delegate: 'Déléguer au SQUAD', nowDesc: 'L\'agent actif traitera maintenant', schDesc: 'Ajouter au planificateur', delDesc: 'Assigner à un agent spécialisé' },
    de: { title: 'Pip schlägt diese Aufgabe vor', intro: 'Ausführung wählen:', now: 'Jetzt ausführen', schedule: 'Planen', delegate: 'An SQUAD delegieren', nowDesc: 'Aktiver Agent verarbeitet sofort', schDesc: 'Zum Planer hinzufügen', delDesc: 'Spezialisten zuweisen' },
    it: { title: 'Pip propone questa attività', intro: 'Scegli come eseguirla:', now: 'Esegui ora', schedule: 'Pianifica', delegate: 'Delega allo SQUAD', nowDesc: 'L\'agente attivo elaborerà ora', schDesc: 'Aggiungi al pianificatore', delDesc: 'Assegna a un agente specializzato' },
    zh: { title: 'Pip 建议此任务', intro: '选择执行方式：', now: '立即执行', schedule: '计划', delegate: '委派给 SQUAD', nowDesc: '当前代理立即处理', schDesc: '添加到计划', delDesc: '分配给专业代理' },
    ja: { title: 'Pipがタスクを提案', intro: '実行方法を選択：', now: '今すぐ実行', schedule: 'スケジュール', delegate: 'SQUADに委任', nowDesc: 'アクティブエージェントが即時処理', schDesc: 'プランナーに追加', delDesc: '専門エージェントに割当' },
  };
  const c = t[lang];

  return (
    <AnimatePresence>
      {open && task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-cyber-pink w-full max-w-xl rounded-2xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-pink-300/80 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🐶</span>
                <h3 className="text-sm font-semibold text-cyan-200 tracking-wide">{c.title}</h3>
              </div>

              <div className="mt-3 rounded-xl border border-cyan-400/30 bg-black/40 px-4 py-3">
                <p className="text-[13px] text-foreground/90 leading-relaxed">{task}</p>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">{c.intro}</p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'now' as const, icon: Zap, label: c.now, desc: c.nowDesc, color: 'emerald' },
                  { id: 'schedule' as const, icon: Clock, label: c.schedule, desc: c.schDesc, color: 'cyan' },
                  { id: 'delegate' as const, icon: Users, label: c.delegate, desc: c.delDesc, color: 'violet' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onExecute(opt.id, task)}
                    className="group text-left rounded-xl border border-white/10 hover:border-cyan-400/60 bg-white/5 hover:bg-cyan-400/10 p-3 transition-all"
                  >
                    <opt.icon className="w-4 h-4 text-cyan-300 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-[12px] font-semibold text-foreground/90">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
