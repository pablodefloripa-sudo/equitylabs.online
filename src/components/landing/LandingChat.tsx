import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/runtime-client';

interface Msg {
  id: number;
  role: 'user' | 'agent';
  text: string;
}

const WELCOME: Msg[] = [
  {
    id: 0,
    role: 'agent',
    text: 'Hola 👋 Soy EQuityLabs AI, tu agente principal. Preguntame qué podemos construir juntos — código, automatización, integraciones, estrategia.',
  },
];

// Communication center de la landing: demo real del dashboard, sin login.
// Transparente sobre la slide final (dashboard operacional).
const LandingChat = ({ lang }: { lang: string }) => {
  const [messages, setMessages] = useState<Msg[]>(WELCOME);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setError(null);
    setMessages((m) => [...m, { id: idRef.current++, role: 'user', text }]);
    setSending(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('landing-chat', {
        body: { message: text },
      });
      if (fnError || !data?.reply) {
        throw new Error(data?.error || fnError?.message || 'Sin respuesta');
      }
      setMessages((m) => [...m, { id: idRef.current++, role: 'agent', text: data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: 'agent', text: `⚠️ ${msg} — probá de nuevo en unos segundos.` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-xl flex flex-col rounded-2xl border border-white/10 bg-[#0c0a1d]/45 backdrop-blur-md shadow-[0_0_60px_rgba(0,210,255,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00d2ff] to-[#ff007f]">
            <Bot className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-white leading-none flex items-center gap-1.5">
              EQuityLabs <span className="text-[#00d2ff]">AI</span>
              <Sparkles className="w-3 h-3 text-[#ff007f]" />
            </p>
            <p className="text-[10px] font-mono text-green-400/80 tracking-widest uppercase mt-1">Command Center · Online</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-white/40 hidden sm:block">demo sin registro</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[240px] max-h-[46vh]">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'agent' && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#00d2ff] to-[#ff007f]">
                  <Bot className="w-3 h-3 text-white" />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[#00d2ff]/90 to-[#7b2ff7]/90 text-white rounded-br-sm'
                    : 'bg-white/[0.07] border border-white/10 text-white/90 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <User className="w-3 h-3 text-white/70" />
                </span>
              )}
            </motion.div>
          ))}
          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#00d2ff] to-[#ff007f]">
                <Bot className="w-3 h-3 text-white" />
              </span>
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.07] px-4 py-3">
                <Loader2 className="w-4 h-4 text-[#00d2ff] animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input — eq-spectrum-box style */}
      <form onSubmit={send} className="p-3 pt-1">
        <div className="eq-spectrum-box rounded-xl bg-[#0c0a1d]/90 backdrop-blur">
          <div className="flex items-center gap-2 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder={lang === 'es' ? 'Escribí tu objetivo… ej: quiero automatizar mi facturación' : 'Type your goal…'}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-white/30 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#00d2ff] via-[#8a2be2] to-[#ff007f] text-white transition disabled:opacity-40 hover:brightness-110"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-mono text-white/35">{lang === 'es' ? 'Respuestas con IA en vivo' : 'Live AI responses'}</span>
          <a
            href="/auth"
            className="flex items-center gap-1 text-[11px] font-bold text-[#00d2ff] hover:text-white transition group"
          >
            Crear cuenta gratis
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </form>
    </div>
  );
};

export default LandingChat;
