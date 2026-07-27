import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BellOff,
  ChevronUp,
  Minimize2,
  Power,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
import { emitMascotEvent, MASCOT_EVENTS } from '@/lib/mascot-events';
import type { MascotState } from '@/lib/mascot-events';
import { DynamicMascotAvatar } from './DynamicMascotAvatar';

interface MascotAssistantProps {
  state: MascotState;
  message: string;
  userName?: string | null;
  pulseKey?: number;
}

const MASCOT_SOUND_KEY = 'eq_mascot_sound_enabled';
const MASCOT_VOICE_KEY = 'eq_mascot_voice_name';
const MASCOT_DND_KEY = 'eq_mascot_dnd';
const MASCOT_VOICE_PROVIDER_KEY = 'eq_mascot_voice_provider';

const getFirstName = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] || null;
};

const getSubscriptionTier = () => {
  if (typeof window === 'undefined') return 'free';

  try {
    const raw = localStorage.getItem('eq_subscription_context');
    if (!raw) return 'free';
    const parsed = JSON.parse(raw) as { tier?: string; displayPlan?: string } | null;
    return (parsed?.tier || parsed?.displayPlan || 'free').toString().toLowerCase();
  } catch {
    return 'free';
  }
};

const stateConfig: Record<
  MascotState,
  {
    label: string;
    ringClass: string;
    badgeClass: string;
    imageClass: string;
    motionClass: string;
    accent: string;
  }
> = {
  idle: {
    label: 'LISTO',
    ringClass: 'from-cyan-400/20 via-cyan-200/10 to-transparent',
    badgeClass: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
    imageClass: 'scale-[1] saturate-100',
    motionClass: 'animate-[mascot-bob_5.4s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_36px_rgba(34,211,238,0.18)]',
  },
  welcome: {
    label: 'BIENVENIDA',
    ringClass: 'from-emerald-400/30 via-cyan-300/15 to-transparent',
    badgeClass: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
    imageClass: 'scale-[1.01]',
    motionClass: 'animate-[mascot-greet_1.1s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_44px_rgba(52,211,153,0.22)]',
  },
  thinking: {
    label: 'PENSANDO',
    ringClass: 'from-amber-300/25 via-cyan-300/10 to-transparent',
    badgeClass: 'border-amber-200/25 bg-amber-400/10 text-amber-100',
    imageClass: 'scale-[0.99] contrast-[1.02]',
    motionClass: 'animate-[mascot-think_1.6s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_42px_rgba(251,191,36,0.2)]',
  },
  suggesting: {
    label: 'PROPONIENDO',
    ringClass: 'from-fuchsia-400/30 via-cyan-300/15 to-transparent',
    badgeClass: 'border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100',
    imageClass: 'scale-[1.005]',
    motionClass: 'animate-[mascot-suggest_1.7s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_44px_rgba(232,121,249,0.2)]',
  },
  team_builder: {
    label: 'SQUAD',
    ringClass: 'from-teal-400/25 via-cyan-300/10 to-transparent',
    badgeClass: 'border-teal-300/25 bg-teal-400/10 text-teal-100',
    imageClass: 'scale-[1.005]',
    motionClass: 'animate-[mascot-bob_4.8s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_42px_rgba(45,212,191,0.18)]',
  },
  celebrating: {
    label: 'AVANCE',
    ringClass: 'from-emerald-300/35 via-cyan-300/15 to-transparent',
    badgeClass: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
    imageClass: 'scale-[1.035] saturate-125',
    motionClass: 'animate-[mascot-celebrate_0.95s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_52px_rgba(74,222,128,0.28)]',
  },
  eating: {
    label: 'RECOMPENSA',
    ringClass: 'from-lime-300/35 via-yellow-300/15 to-transparent',
    badgeClass: 'border-lime-300/25 bg-lime-400/10 text-lime-100',
    imageClass: 'scale-[1.02] saturate-110',
    motionClass: 'animate-[mascot-eat_1.2s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_48px_rgba(163,230,53,0.22)]',
  },
  alert: {
    label: 'ALERTA',
    ringClass: 'from-rose-400/30 via-red-300/15 to-transparent',
    badgeClass: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
    imageClass: 'scale-[0.99] grayscale-[0.08]',
    motionClass: 'animate-[mascot-alert_0.88s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_48px_rgba(244,63,94,0.2)]',
  },
  guide_web: {
    label: 'RUTA',
    ringClass: 'from-sky-400/25 via-cyan-300/15 to-transparent',
    badgeClass: 'border-sky-300/25 bg-sky-400/10 text-sky-100',
    imageClass: 'scale-[1.01]',
    motionClass: 'animate-[mascot-guide_1.8s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_44px_rgba(56,189,248,0.18)]',
  },
  call_by_name: {
    label: 'OPERADOR',
    ringClass: 'from-cyan-300/30 via-indigo-300/15 to-transparent',
    badgeClass: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
    imageClass: 'scale-[1.02]',
    motionClass: 'animate-[mascot-greet_1.35s_ease-in-out_infinite]',
    accent: 'shadow-[0_0_46px_rgba(34,211,238,0.24)]',
  },
};

const pickMascotVoice = (voices: SpeechSynthesisVoice[]) => {
  const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'));
  const maleHints = ['pablo', 'raul', 'juan', 'carlos', 'diego', 'jorge', 'mario', 'manuel'];
  const neutralHints = ['google español', 'es-es', 'microsoft'];

  return (
    spanishVoices.find((voice) => maleHints.some((hint) => voice.name.toLowerCase().includes(hint))) ||
    spanishVoices.find((voice) => neutralHints.some((hint) => voice.name.toLowerCase().includes(hint))) ||
    spanishVoices[0] ||
    voices[0] ||
    null
  );
};

export const MascotAssistant = ({ state, message, userName, pulseKey = 0 }: MascotAssistantProps) => {
  const config = stateConfig[state];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem(MASCOT_SOUND_KEY) !== 'false');
  const [isMuted, setIsMuted] = useState(false);
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(MASCOT_DND_KEY) === 'true');
  const [voiceProvider, setVoiceProvider] = useState<'local' | 'premium'>(() => {
    if (typeof window === 'undefined') return 'local';
    const saved = localStorage.getItem(MASCOT_VOICE_PROVIDER_KEY);
    return saved === 'premium' ? 'premium' : 'local';
  });
  const [draft, setDraft] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => localStorage.getItem(MASCOT_VOICE_KEY) || '');
  const { speak, stop, voices, isReady, isSpeaking, premiumConfigured } = useKokoroTTS();
  const spokenMessageRef = useRef<string>('');
  const subscriptionTier = useMemo(() => getSubscriptionTier(), [isHidden]);
  const premiumAllowed = subscriptionTier !== 'free';
  const premiumActive = voiceProvider === 'premium' && premiumAllowed;

  const subtitle = useMemo(() => (userName ? getFirstName(userName) || 'Operador' : 'Anfitrión operativo'), [userName]);

  const availableVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith('es') || voice.lang.toLowerCase().startsWith('en')),
    [voices],
  );
  const voiceOptions = availableVoices.length > 0 ? availableVoices : voices;

  useEffect(() => {
    if (selectedVoiceName && voices.some((voice) => voice.name === selectedVoiceName)) return;
    const fallbackVoice = pickMascotVoice(voices);
    if (fallbackVoice) {
      setSelectedVoiceName(fallbackVoice.name);
      localStorage.setItem(MASCOT_VOICE_KEY, fallbackVoice.name);
    }
  }, [selectedVoiceName, voices]);

  useEffect(() => {
    localStorage.setItem(MASCOT_SOUND_KEY, String(isEnabled));
    if (!isEnabled) {
      setIsMuted(true);
      stop();
    }
  }, [isEnabled, stop]);

  useEffect(() => {
    localStorage.setItem(MASCOT_DND_KEY, String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem(MASCOT_VOICE_PROVIDER_KEY, voiceProvider);
  }, [voiceProvider]);

  useEffect(() => {
    if (!premiumAllowed && voiceProvider === 'premium') {
      setVoiceProvider('local');
    }
  }, [premiumAllowed, voiceProvider]);

  useEffect(() => {
    if (!isExpanded || !isEnabled || isMuted || !message.trim() || !isReady) return;
    const messageKey = `${state}:${message}`;
    if (spokenMessageRef.current === messageKey) return;
    spokenMessageRef.current = messageKey;
    void speak(message, selectedVoiceName || undefined, {
      provider: premiumActive ? 'premium' : 'local',
    });
  }, [isEnabled, isExpanded, isMuted, isReady, message, premiumActive, selectedVoiceName, speak, state]);

  const handleTogglePower = () => {
    setIsEnabled((current) => {
      const next = !current;
      setIsMuted(!next);
      if (!next) stop();
      return next;
    });
    if (!isExpanded) setIsExpanded(true);
  };

  const handleToggleMute = () => {
    setIsMuted((current) => {
      const next = !current;
      if (next) stop();
      return next;
    });
    if (!isExpanded) setIsExpanded(true);
  };

  const handleToggleDoNotDisturb = () => {
    setIsHidden((current) => {
      const next = !current;
      if (next) {
        setIsExpanded(false);
        stop();
      }
      return next;
    });
  };

  const handleVoiceChange = (value: string) => {
    setSelectedVoiceName(value);
    localStorage.setItem(MASCOT_VOICE_KEY, value);
  };

  const handleSubmitPrompt = () => {
    const text = draft.trim();
    if (!text) return;

    setConversation((current) => [
      ...current,
      { role: 'user', text },
      { role: 'assistant', text: `Con gusto, ${getFirstName(userName) || 'operador'}. Tomo esto: "${text}". Puedo convertirlo en tarea, resumen, referencia o siguiente paso, según le convenga.` },
    ]);
    setDraft('');
    emitMascotEvent(MASCOT_EVENTS.THINKING, { reason: text });
  };

  return (
    isHidden && !isExpanded ? (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.92 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={() => setIsHidden(false)}
        className="pointer-events-auto fixed bottom-4 left-4 z-[70] inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-xl"
      >
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        Mascota
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] text-emerald-100">
          Mostrar
        </span>
      </motion.button>
    ) : (
    <motion.aside
      key={`${pulseKey}-${isExpanded ? 'expanded' : 'collapsed'}`}
      initial={isExpanded ? { opacity: 0, scale: 0.82, y: 24, rotate: 360 } : { opacity: 0, y: 20, scale: 0.96 }}
      animate={isExpanded ? { opacity: 1, scale: 1, y: 0, rotate: 0 } : { opacity: 1, y: 0, scale: 1 }}
      transition={isExpanded ? { duration: 0.55, ease: 'easeOut' } : { duration: 0.35, ease: 'easeOut' }}
      className={
        isExpanded
          ? 'pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-md'
          : 'pointer-events-auto fixed bottom-4 right-4 z-[70]'
      }
    >
      <motion.div
        key={isExpanded ? 'expanded' : 'collapsed'}
        className={`relative overflow-hidden rounded-[28px] border border-cyan-300/20 bg-slate-950/78 backdrop-blur-2xl ${config.accent} ${
          isExpanded ? 'w-[min(92vw,920px)] max-h-[86vh]' : 'w-[min(92vw,360px)]'
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-tr ${config.ringClass} opacity-90`} />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(135deg,rgba(255,255,255,0.18)_0,rgba(255,255,255,0.04)_14%,transparent_14%,transparent_28%,rgba(255,255,255,0.08)_28%,rgba(255,255,255,0.02)_42%,transparent_42%,transparent_100%)]" />

        <div className="relative flex flex-col">
          <DynamicMascotAvatar
            state={state}
            config={config}
            message={message}
            subtitle={subtitle}
            isExpanded={isExpanded}
            isEnabled={isEnabled}
            isMuted={isMuted}
            onToggleExpanded={() => setIsExpanded((value) => !value)}
            onTogglePower={handleTogglePower}
            onToggleMute={handleToggleMute}
          />

          {isExpanded && (
            <div className="border-t border-white/10 p-4">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/65">Mascota activa</p>
                      <h3 className="mt-1 text-lg font-semibold text-cyan-50">Panel de control</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      Reducir
                    </button>
                  </div>

                  <div className="mt-4 rounded-3xl border border-cyan-300/15 bg-slate-950/70 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                        <img
                          src={mascotImage}
                          alt="Mascota asistente de EquityLabs"
                          className={`h-full w-full object-cover object-center ${config.imageClass}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Estado actual</p>
                        <h4 className="mt-1 text-xl font-semibold text-cyan-50">{config.label}</h4>
                        <p className="mt-2 text-sm text-slate-100/85">{message}</p>
                        <p className="mt-2 text-xs text-cyan-100/45">{subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300/65">Diálogo con la mascota</p>
                        <p className="mt-1 text-[11px] text-cyan-100/45">Escriba aquí para pedir ideas, tareas, referencias o un resumen.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleDoNotDisturb}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                        >
                          <BellOff className="h-3.5 w-3.5" />
                          No molestar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (draft.trim()) handleSubmitPrompt();
                          }}
                          className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/15"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Escríbale a M: resúmame esto, propóngame tareas, avíseme un avance o pídame una mano..."
                      className="mt-2 min-h-[112px] w-full resize-none rounded-xl border border-cyan-300/15 bg-black/55 p-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35"
                    />
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/65">Diálogo</p>
                        <span className="text-[10px] text-cyan-100/35">{conversation.length} mensajes</span>
                      </div>
                      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                        {conversation.length > 0 ? (
                          conversation.slice(-6).map((item, index) => (
                            <div
                              key={`${item.role}-${index}`}
                              className={`rounded-xl border px-3 py-2 text-sm ${
                                item.role === 'user'
                                  ? 'border-white/10 bg-white/5 text-white/80'
                                  : 'border-cyan-300/15 bg-cyan-400/8 text-cyan-50'
                              }`}
                            >
                              <span className="mr-2 text-[10px] uppercase tracking-[0.18em] opacity-60">
                                {item.role === 'user' ? 'Vos' : 'M'}
                              </span>
                              {item.text}
                            </div>
                          ))
                        ) : (
                          <p className="py-4 text-center text-xs text-cyan-100/40">
                            Todavía no hemos hablado. Escriba algo y comenzamos.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePower}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                        isEnabled
                          ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-white/70'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {isEnabled ? 'Prendido' : 'Apagado'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                        isMuted
                          ? 'border-rose-300/25 bg-rose-400/10 text-rose-100'
                          : 'border-white/10 bg-white/5 text-white/70'
                      }`}
                    >
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                      {isMuted ? 'Mute' : 'Sonido'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleDoNotDisturb}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
                    >
                      <BellOff className="h-3.5 w-3.5" />
                      No molestar
                    </button>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/8 px-3 py-2 text-xs text-cyan-100/75">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isSpeaking ? 'Hablando' : isReady ? 'Voz lista' : 'Cargando voces'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/65">Voz del navegador</p>
                      <h3 className="mt-1 text-lg font-semibold text-cyan-50">Elegir una voz distinta</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (message.trim() && isEnabled && !isMuted) {
                          void speak(message, selectedVoiceName || undefined, {
                            provider: premiumActive ? 'premium' : 'local',
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/15"
                    >
                      Probar voz
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/65">Voz seleccionada</span>
                      <select
                        value={selectedVoiceName}
                        onChange={(event) => handleVoiceChange(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-cyan-300/15 bg-black/50 px-3 py-2 text-sm text-cyan-50 outline-none"
                      >
                        {voiceOptions.map((voice) => (
                          <option key={voice.name} value={voice.name} className="bg-black">
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/65">Controles rapidos</span>
                        <span className="text-[10px] text-cyan-100/35">{premiumConfigured ? 'Premium listo' : 'Premium no configurado'}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleTogglePower}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"
                        >
                          <Power className="h-3.5 w-3.5" />
                          On
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleMute}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-100"
                        >
                          <VolumeX className="h-3.5 w-3.5" />
                          Mute
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceProvider((current) => (current === 'premium' ? 'local' : 'premium'))}
                          disabled={!premiumAllowed}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors ${
                            premiumAllowed
                              ? premiumActive
                                ? 'border-cyan-300/35 bg-cyan-400/15 text-cyan-50'
                                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                              : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {premiumActive ? 'Premium ON' : 'Premium OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsExpanded(false)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          Cerrar
                        </button>
                      </div>
                      {!premiumAllowed && (
                        <p className="mt-2 text-[10px] leading-relaxed text-cyan-100/40">
                          La voz premium queda reservada para planes pagos. Hoy sigo con voz local.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/8 p-3">
                    <p className="text-xs leading-relaxed text-cyan-100/75">
                      La mascota usa una voz separada del agente principal. Si quieres, mas adelante le asignamos una voz fija por perfil para que siempre suene distinta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.aside>
    )
  );
};
