import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Mic, Activity, Zap, Cpu, Thermometer, Radio, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { modelDisplayName } from '@/lib/modelDisplay';

/* ─── HERMES OS — Consola de comandos (communication center de la landing) ───
   Montada sobre la franja negra de "esta hermes.png". HUD completo:
   reloj real, termómetros, LEDs, voz, input de comandos y botones de skills. */

interface Msg {
  id: number;
  role: 'user' | 'agent';
  text: string;
}

const WELCOME: Msg[] = [
  {
    id: 0,
    role: 'agent',
    text: 'HERMES OS en línea ✅ — Soy tu agente principal. Decime tu objetivo por voz o texto.',
  },
];

const DEFAULT_SKILLS = [
  'estrategia de negocio',
  'análisis de mercado',
  'automatización de procesos',
  'contenido y copywriting',
  'integración de APIs',
];

const clockNow = () => {
  const d = new Date();
  return {
    time: d.toLocaleTimeString('es-AR', { hour12: false }),
    date: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
};

const HermesConsole = ({ lang }: { lang: string }) => {
  const [messages, setMessages] = useState<Msg[]>(WELCOME);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [clock, setClock] = useState(clockNow);
  const [activeSkills, setActiveSkills] = useState<string[]>(DEFAULT_SKILLS);
  const [modelName, setModelName] = useState('Kimi');
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { supported: micSupported, listening, interim, toggle } = useSpeechToText({
    lang: 'es-ES',
    onCommit: (finalText) => setInput((prev) => (prev ? `${prev} ${finalText}` : finalText)),
  });

  // Reloj real
  useEffect(() => {
    const t = setInterval(() => setClock(clockNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Skills + modelo del agente activo (elegido en el carousel)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('eq_active_agent_context');
      if (raw) {
        const agent = JSON.parse(raw);
        if (Array.isArray(agent.skills) && agent.skills.length > 0) setActiveSkills(agent.skills.slice(0, 5));
        if (agent.engine) setModelName(modelDisplayName(agent.engine) || 'Kimi');
      }
    } catch { /* sin agente activo */ }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { id: idRef.current++, role: 'user', text }]);
    setSending(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('landing-chat', {
        body: { message: text },
      });
      if (fnError || !data?.reply) throw new Error(data?.error || fnError?.message || 'Sin respuesta');
      setMessages((m) => [...m, { id: idRef.current++, role: 'agent', text: data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: 'agent', text: `⚠️ ${msg} — intentá de nuevo en unos segundos.` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const insertSkill = (skill: string) => {
    setInput((prev) => (prev ? `${prev} ${skill}` : skill));
    inputRef.current?.focus();
  };

  // Valores HUD (termómetros) con leve variación
  const [load, setLoad] = useState(58);
  const [temp, setTemp] = useState(41);
  useEffect(() => {
    const t = setInterval(() => {
      setLoad((v) => Math.max(34, Math.min(88, v + (Math.random() * 14 - 7))));
      setTemp((v) => Math.max(38, Math.min(56, v + (Math.random() * 4 - 2))));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full max-w-3xl flex flex-col rounded-2xl border border-white/10 bg-[#070912]/40 backdrop-blur-md shadow-[0_0_60px_rgba(0,210,255,0.10),inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* ─── HUD BAR: HERMES OS + reloj + termómetros ─── */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          {['bg-white/25', 'bg-white/12', 'bg-white/18'].map((c, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${c}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[11px] font-black tracking-[0.22em] text-white">
            HERMES<span className="text-[#00d2ff]">OS</span>
          </span>
          <span className="rounded border border-emerald-300/25 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-emerald-300">
            <span className="inline-block h-1 w-1 rounded-full bg-emerald-400 animate-pulse mr-1 align-middle" />
            LIVE
          </span>
        </div>

        {/* Termómetros */}
        <div className="ml-auto hidden items-center gap-3 font-mono text-[9px] text-white/55 md:flex">
          <span className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-cyan-300/80" />
            LOAD
            <span className="inline-block h-1 w-12 overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                animate={{ width: `${load}%` }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </span>
            <span className="tabular-nums text-cyan-200/80">{Math.round(load)}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Thermometer className="h-3 w-3 text-fuchsia-300/80" />
            TEMP
            <span className="inline-block h-1 w-12 overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300"
                animate={{ width: `${((temp - 35) / 25) * 100}%` }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </span>
            <span className="tabular-nums text-fuchsia-200/80">{Math.round(temp)}°C</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-300/80" />
            <span className="tabular-nums text-amber-100/70">{clock.time}</span>
          </span>
        </div>

        {/* Reloj */}
        <div className="flex items-center gap-2 font-mono md:hidden">
          <Zap className="h-3 w-3 text-amber-300/80" />
          <span className="text-[11px] tabular-nums text-amber-100/80">{clock.time}</span>
        </div>
      </div>

      {/* ─── MENSAJES ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[190px] max-h-[34vh]">
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
                    ? 'bg-gradient-to-r from-[#00d2ff]/85 to-[#7b2ff7]/85 text-white rounded-br-sm'
                    : 'bg-white/[0.06] border border-white/10 text-white/90 rounded-bl-sm'
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
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-3">
                <Loader2 className="w-4 h-4 text-[#00d2ff] animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SKILLS ROW ─── */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2">
        <Radio className="h-3 w-3 text-[#00d2ff]/70" />
        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">Skills</span>
        {activeSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => insertSkill(skill)}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-2.5 py-1 text-[10px] font-semibold text-cyan-100/80 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 hover:text-white"
          >
            ⚡ {skill}
          </button>
        ))}
      </div>

      {/* ─── INPUT + VOZ ─── */}
      <form onSubmit={send} className="p-3 pt-1">
        <div className="eq-spectrum-box rounded-xl bg-[#0a0d1e]/70 backdrop-blur">
          <div className="flex items-end gap-2 p-2">
            <span className="pb-2 font-mono text-sm text-[#00d2ff]">❯</span>
            <textarea
              ref={inputRef}
              value={listening && interim ? (input ? `${input} ${interim}` : interim) : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              maxLength={600}
              placeholder={lang === 'es' ? 'Escribí o hablá tu comando…' : 'Type or speak your command…'}
              className="max-h-20 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-white placeholder-white/30 outline-none"
            />
            {micSupported && (
              <button
                type="button"
                onClick={toggle}
                title={listening ? 'Detener voz' : 'Comando de voz'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                  listening
                    ? 'border-red-400/60 bg-red-500/25 text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.5)] animate-pulse'
                    : 'border-white/15 bg-white/[0.06] text-white/70 hover:border-[#00d2ff]/50 hover:text-[#00d2ff]'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#00d2ff] via-[#8a2be2] to-[#ff007f] text-white transition disabled:opacity-40 hover:brightness-110"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            <Activity className="h-3 w-3 text-[#00d2ff]/60" />
            {modelName} · respuestas en vivo
          </span>
          <a href="/auth" className="text-[11px] font-bold text-[#00d2ff] hover:text-white transition">
            Crear cuenta gratis →
          </a>
        </div>
      </form>
    </div>
  );
};

export default HermesConsole;
