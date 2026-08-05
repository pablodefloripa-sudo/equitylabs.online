import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAIChat } from '@/hooks/useAIChat';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { saveArchiveSession } from '@/integrations/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import mascotImage from '@/assets/mascot/assistant-dog.png';
import { Bot, Eye, EyeOff } from 'lucide-react';

const MASCOT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const RESUME_SESSION_KEY = 'eq_resume_session';

const getFirstName = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] || null;
};

export const MascotaPaseo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentName = searchParams.get('agent') || 'Mascota';
  const { user } = useAuth();
  const { sendMessage, isLoading } = useAIChat();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState('Hola. Estoy listo para recibir una instrucción breve y convertirla en acción.');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([]);
  const [showMascot, setShowMascot] = useState(true);

  const userName = useMemo(
    () => getFirstName(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email) || 'operador',
    [user],
  );

  const { isListening, transcript, isSupported, toggleListening } = useVoiceCommands({
    onCommand: (command) => {
      const cleaned = command.trim();
      if (!cleaned) return;
      setDraft(cleaned);
      promptRef.current?.focus();
    },
  });

  useEffect(() => {
    if (isListening) {
      setDraft(transcript);
    }
  }, [isListening, transcript]);

  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isLoading) return;

    setDraft('');
    setReply('Pensando...');
    setConversation((current) => [
      ...current,
      { role: 'user', content: text, timestamp: new Date().toISOString() },
    ]);

    try {
      const history = conversation.map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const result = await sendMessage(text, history, 'mascota', [], MASCOT_MODEL);
      setReply(result.response);
      setConversation((current) => [
        ...current,
        { role: 'assistant', content: result.response, timestamp: new Date().toISOString() },
      ]);
    } catch {
      const fallback = 'No pude responder ahora mismo. Intente de nuevo en unos segundos.';
      setReply(fallback);
      setConversation((current) => [
        ...current,
        { role: 'assistant', content: fallback, timestamp: new Date().toISOString() },
      ]);
    }
  };

  const handleBack = () => {
    try {
      if (user) {
        void saveArchiveSession({
          userId: user.id,
          projectId: `mascota-paseo-${agentName}`,
          projectName: `Mascota ${agentName}`,
          messages: conversation.map((item) => ({
            role: item.role,
            content: item.content,
            timestamp: item.timestamp,
            mascot: true,
          })),
          context: {
            activeAgent: {
              id: 'mascota',
              name: agentName,
              engine: MASCOT_MODEL,
              tasks: [],
            },
            source: 'mascota-paseo',
            userName,
          },
          source: 'mascota-paseo',
        });
      }

      const payload = {
        messages: conversation,
        context: {
          activeAgent: {
            id: 'mascota',
            name: agentName,
            engine: MASCOT_MODEL,
            tasks: [],
          },
          source: 'mascota-paseo',
          userName,
        },
      };
      sessionStorage.setItem(RESUME_SESSION_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('eq:resume-session', { detail: payload }));
      window.dispatchEvent(new CustomEvent('eq:focus-console'));
    } catch {
      // ignore persistence failures
    }
    navigate('/dashboard');
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),rgba(2,6,23,0.98)_60%)] p-2 text-cyan-50 sm:p-3">
      <div className="mx-auto flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] border border-cyan-300/15 bg-slate-950/88 shadow-[0_0_46px_rgba(34,211,238,0.16)] backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMascot((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100"
            >
              {showMascot ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showMascot ? 'Ocultar' : 'Mostrar'}
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold text-cyan-50">{agentName}</p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
          <motion.section
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex flex-1 flex-col overflow-hidden rounded-[26px] border border-cyan-300/14 bg-black/35 p-3"
          >
            {showMascot ? (
              <div className="relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),rgba(0,0,0,0.45))] aspect-[16/10] sm:aspect-[16/9]">
                <motion.img
                  src={mascotImage}
                  alt="Mascota asistente"
                  className="h-full w-full object-cover object-center"
                  animate={{ y: [0, -6, 0], scale: [1, 1.015, 1] }}
                  transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.18)_100%)]" />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-[24px] border border-cyan-300/12 bg-black/25 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/55">Mascota oculta</p>
                  <p className="mt-1 text-xs text-cyan-50/60">Puede volver a llamarla cuando quiera.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setShowMascot(true);
                    promptRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400/18 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50 hover:bg-cyan-400/28"
                >
                  <Bot className="h-3.5 w-3.5" />
                  Mascota
                </Button>
              </div>
            )}

            <div className="mt-3 rounded-[20px] border border-cyan-300/12 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                <Sparkles className="h-3.5 w-3.5" />
                Mensaje de la mascota
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-cyan-50/80">
                {reply}
              </p>
            </div>
          </motion.section>

          <section className="rounded-[26px] border border-cyan-300/14 bg-slate-950/64 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">Prompt</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowMascot(true);
                    promptRef.current?.focus();
                  }}
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50 hover:bg-cyan-400/20"
                >
                  <Bot className="h-3.5 w-3.5" />
                  Mascota
                </Button>
                <button
                  type="button"
                  onClick={() => void toggleListening()}
                  disabled={!isSupported}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                    isListening
                      ? 'border-rose-300/45 bg-rose-400/15 text-rose-100'
                      : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  Voice
                </button>
              </div>
            </div>

            <Textarea
              ref={promptRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={`Escribile a ${agentName}...`}
              className="mt-2 h-[88px] resize-none overflow-hidden border border-cyan-300/12 bg-black/30 p-3 text-sm text-cyan-50 placeholder:text-cyan-100/30 focus-visible:ring-0"
            />

            <div className="mt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={!draft.trim() || isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400/18 px-4 text-cyan-50 hover:bg-cyan-400/28"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar
              </Button>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default MascotaPaseo;
