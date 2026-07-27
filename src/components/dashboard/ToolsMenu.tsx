import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Image as ImageIcon, Layout, Telescope, Clapperboard, Music,
  GraduationCap, Sparkles, FileBarChart, TrendingUp, X, Loader2, Download, Copy, Check,
  BarChart3, Cat, Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MascotCreatorModal } from './MascotCreatorModal';

type ToolKey =
  | 'create_image' | 'canvas_organize' | 'deep_research' | 'create_video_brief'
  | 'create_music_brief' | 'learn' | 'prompt_engineer' | 'generate_report' | 'market_analysis'
  | 'project_metrics' | 'mascot';

interface ToolDef {
  key: ToolKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  placeholder: string;
  category: 'core' | 'equity';
  accent: string;
}

const TOOLS: ToolDef[] = [
  { key: 'create_image', label: 'Crear imagen', icon: ImageIcon, description: 'Genera imágenes con IA', placeholder: 'Describe la imagen que quieres crear...', category: 'core', accent: 'from-cyan-500/30 to-blue-500/20 border-cyan-400/40' },
  { key: 'canvas_organize', label: 'Canvas', icon: Layout, description: 'Mapa mental estructurado', placeholder: 'Pega tus notas e ideas en bruto...', category: 'core', accent: 'from-blue-500/30 to-indigo-500/20 border-blue-400/40' },
  { key: 'deep_research', label: 'Deep Research', icon: Telescope, description: 'Investigación rigurosa', placeholder: '¿Qué tema quieres investigar?', category: 'core', accent: 'from-indigo-500/30 to-purple-500/20 border-indigo-400/40' },
  { key: 'create_video_brief', label: 'Crear vídeo', icon: Clapperboard, description: 'Brief de producción', placeholder: 'Describe el video...', category: 'core', accent: 'from-purple-500/30 to-fuchsia-500/20 border-purple-400/40' },
  { key: 'create_music_brief', label: 'Crear música', icon: Music, description: 'Brief musical para IA', placeholder: 'Describe la canción...', category: 'core', accent: 'from-fuchsia-500/30 to-pink-500/20 border-fuchsia-400/40' },
  { key: 'learn', label: 'Learn', icon: GraduationCap, description: 'Ultralearning Roadmap', placeholder: '', category: 'core', accent: 'from-emerald-500/30 to-teal-500/20 border-emerald-400/40' },
  { key: 'prompt_engineer', label: 'Prompt Engineer', icon: Sparkles, description: 'Reescribe ideas como prompts óptimos', placeholder: 'Describe lo que quieres lograr...', category: 'equity', accent: 'from-yellow-500/30 to-amber-500/20 border-yellow-400/40' },
  { key: 'generate_report', label: 'Generar Reporte', icon: FileBarChart, description: 'Reporte ejecutivo', placeholder: '¿Sobre qué tema?', category: 'equity', accent: 'from-orange-500/30 to-red-500/20 border-orange-400/40' },
  { key: 'market_analysis', label: 'Análisis de Mercado', icon: TrendingUp, description: 'TAM/SAM/SOM, competidores', placeholder: 'Empresa o sector...', category: 'equity', accent: 'from-red-500/30 to-rose-500/20 border-red-400/40' },
  { key: 'project_metrics', label: 'Métricas Proyecto', icon: BarChart3, description: 'KPIs y milestones', placeholder: 'Nombre y contexto del proyecto...', category: 'equity', accent: 'from-teal-500/30 to-cyan-500/20 border-teal-400/40' },
  { key: 'mascot', label: 'Mascota IA', icon: Cat, description: 'Crea tu mascota IA personal', placeholder: '', category: 'equity', accent: 'from-pink-500/40 to-fuchsia-500/30 border-pink-400/60' },
];

interface ToolsMenuProps {
  onAfterSelect?: () => void;
  variant?: 'compact' | 'header' | 'controlled';
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export const ToolsMenu = ({ onAfterSelect, variant = 'compact', open: openProp, onOpenChange }: ToolsMenuProps) => {
  const [openState, setOpenState] = useState(false);
  const open = variant === 'controlled' ? !!openProp : openState;
  const setOpen = (v: boolean) => {
    if (variant === 'controlled') onOpenChange?.(v);
    else setOpenState(v);
  };
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [mascotCreatorOpen, setMascotCreatorOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const closeAll = () => {
    setActiveTool(null);
    setPrompt('');
    setResultText(null);
    setResultImage(null);
    setLoading(false);
  };

  const handlePick = (tool: ToolDef) => {
    setOpen(false);
    if (tool.key === 'learn') {
      window.dispatchEvent(new CustomEvent('open-ultralearning-roadmap'));
      toast({ title: 'Ultralearning Roadmap', description: 'Abriendo el roadmap...' });
      onAfterSelect?.();
      return;
    }
    if (tool.key === 'mascot') {
      setMascotCreatorOpen(true);
      onAfterSelect?.();
      return;
    }
    setActiveTool(tool);
    onAfterSelect?.();
  };

  const handleRun = async () => {
    if (!activeTool || !prompt.trim() || loading) return;
    setLoading(true);
    setResultText(null);
    setResultImage(null);

    window.dispatchEvent(new CustomEvent('eq:tool-user-prompt', {
      detail: { tool: activeTool.label, prompt: prompt.trim() }
    }));

    try {
      if (activeTool.key === 'create_image') {
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { prompt: prompt.trim() },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        window.dispatchEvent(new CustomEvent('eq:tool-result', {
          detail: { tool: activeTool.label, model: data.model || 'image-generation', imageUrl: data.imageUrl }
        }));
      } else {
        const { data, error } = await supabase.functions.invoke('tools-ai', {
          body: { tool: activeTool.key, prompt: prompt.trim() },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        window.dispatchEvent(new CustomEvent('eq:tool-result', {
          detail: { tool: activeTool.label, model: data.model || 'qwen/qwen3-vl-8b-thinking', content: data.content }
        }));
      }
      closeAll();
      onAfterSelect?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resultText) {
      navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const a = document.createElement('a');
      a.href = resultImage;
      a.download = `equitylabs-${Date.now()}.png`;
      a.click();
    } else if (resultText && activeTool) {
      const blob = new Blob([resultText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTool.key}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'controlled' ? null : variant === 'header' ? (
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-100 border border-cyan-400/40 hover:border-cyan-300/70 hover:shadow-[0_0_20px_hsl(180_100%_50%/0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <Wrench className="w-4 h-4" />
          <span className="font-display text-xs font-semibold tracking-wide">Herramientas</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          title="Herramientas"
          className="h-9 w-9 rounded-full text-cyan-300/80 bg-cyan-400/5 border border-cyan-400/30 hover:text-cyan-200 hover:bg-cyan-400/10"
        >
          <Plus className="w-5 h-5" />
        </Button>
      )}

      {/* Big Tools Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-[90vw] max-w-[1400px] max-h-[88vh] rounded-3xl overflow-hidden flex flex-col relative bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-black/95 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_0_80px_rgba(34,211,238,0.25)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                      <Wrench className="w-5 h-5 text-cyan-200" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">Centro de Herramientas</h2>
                      <p className="text-xs text-muted-foreground/70 font-mono">Selecciona una herramienta para potenciar tu workflow</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Tools grid */}
                <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/60 mb-3">Core</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {TOOLS.filter(t => t.category === 'core').map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.key}
                          onClick={() => handlePick(t)}
                          className={`group relative text-left p-5 rounded-2xl bg-gradient-to-br ${t.accent} backdrop-blur-md hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all border`}
                        >
                          <Icon className="w-7 h-7 text-white/90 mb-3" />
                          <h3 className="text-sm font-bold text-white mb-1">{t.label}</h3>
                          <p className="text-[11px] text-white/60 leading-snug">{t.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-pink-300/60 mb-3">EQuityLabs Pro</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {TOOLS.filter(t => t.category === 'equity').map(t => {
                      const Icon = t.icon;
                      const isMascot = t.key === 'mascot';
                      return (
                        <button
                          key={t.key}
                          onClick={() => handlePick(t)}
                          className={`group relative text-left p-5 rounded-2xl bg-gradient-to-br ${t.accent} backdrop-blur-md hover:scale-[1.03] transition-all border ${
                            isMascot ? 'hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] ring-1 ring-pink-400/30' : 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                          }`}
                        >
                          <Icon className={`w-7 h-7 mb-3 ${isMascot ? 'text-pink-200' : 'text-white/90'}`} />
                          <h3 className="text-sm font-bold text-white mb-1">{t.label}</h3>
                          <p className="text-[11px] text-white/60 leading-snug">{t.description}</p>
                          {isMascot && (
                            <span className="absolute top-2 right-2 text-[8px] font-mono uppercase tracking-widest text-pink-200 bg-pink-500/20 border border-pink-400/40 rounded px-1.5 py-0.5">New</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tool Execution Modal */}
      <Dialog open={!!activeTool} onOpenChange={(v) => { if (!v) closeAll(); }}>
        <DialogContent className="max-w-2xl bg-black/95 border-white/10 backdrop-blur-2xl">
          {activeTool && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <activeTool.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{activeTool.label}</h2>
                  <p className="text-xs text-muted-foreground/70">{activeTool.description}</p>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTool.placeholder}
                rows={4}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-primary/50 transition-all disabled:opacity-50"
              />

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeAll} disabled={loading}>Cancelar</Button>
                <Button
                  onClick={handleRun}
                  disabled={!prompt.trim() || loading}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                >
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>) : 'Ejecutar'}
                </Button>
              </div>

              {(resultText || resultImage) && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60">Resultado</p>
                    <div className="flex gap-1">
                      {resultText && (
                        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                          {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2 text-xs">
                        <Download className="w-3 h-3 mr-1" />Descargar
                      </Button>
                    </div>
                  </div>
                  {resultImage && (
                    <img src={resultImage} alt="Generada" className="w-full rounded-xl border border-white/10" />
                  )}
                  {resultText && (
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin bg-white/5 rounded-xl p-4 text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                      {resultText}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MascotCreatorModal open={mascotCreatorOpen} onClose={() => setMascotCreatorOpen(false)} />
    </>
  );
};
