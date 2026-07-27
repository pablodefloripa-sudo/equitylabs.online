import { motion } from 'framer-motion';
import { Power, Sparkles, Volume2, VolumeX } from 'lucide-react';
import mascotImage from '@/assets/mascot/assistant-dog.png';
import type { MascotState } from '@/lib/mascot-events';

type MascotAvatarConfig = {
  label: string;
  ringClass: string;
  badgeClass: string;
  imageClass: string;
  motionClass: string;
  accent: string;
};

interface DynamicMascotAvatarProps {
  state: MascotState;
  config: MascotAvatarConfig;
  message: string;
  subtitle: string;
  isExpanded: boolean;
  isEnabled: boolean;
  isMuted: boolean;
  onToggleExpanded: () => void;
  onTogglePower: () => void;
  onToggleMute: () => void;
}

const getMotion = (state: MascotState) => {
  switch (state) {
    case 'alert':
      return { x: [0, -2, 2, -2, 0], y: [0, 0, -1, 1, 0] };
    case 'eating':
      return { y: [0, -3, 0] };
    case 'thinking':
      return { y: [0, -1, 0], rotate: [0, -1.2, 1.2, 0] };
    case 'celebrating':
      return { scale: [1, 1.04, 1] };
    case 'welcome':
    case 'call_by_name':
      return { y: [0, -4, 0] };
    default:
      return { y: [0, -2, 0] };
  }
};

const getDuration = (state: MascotState) => {
  switch (state) {
    case 'alert':
      return 0.28;
    case 'eating':
      return 1.2;
    case 'thinking':
      return 1.4;
    default:
      return 2.4;
  }
};

export const DynamicMascotAvatar = ({
  state,
  config,
  message,
  subtitle,
  isExpanded,
  isEnabled,
  isMuted,
  onToggleExpanded,
  onTogglePower,
  onToggleMute,
}: DynamicMascotAvatarProps) => {
  return (
    <div className="flex items-start gap-3 p-3 transition-colors hover:bg-white/5">
      <motion.div
        animate={getMotion(state)}
        transition={{
          duration: getDuration(state),
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`relative shrink-0 ${config.motionClass}`}
      >
        <div
          className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-b from-cyan-400/18 via-transparent to-transparent blur-2xl ${
            state === 'alert' ? 'from-rose-400/28' : ''
          }`}
        />
        <div className="relative h-24 w-24 overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-950/60 md:h-28 md:w-28">
          <img
            src={mascotImage}
            alt="Mascota asistente de EquityLabs"
            className={`h-full w-full object-cover object-center ${config.imageClass}`}
          />
        </div>
      </motion.div>

      <button
        type="button"
        onClick={onToggleExpanded}
        className="min-w-0 flex-1 cursor-pointer text-left pb-1 pt-1"
      >
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/50">{subtitle}</span>
          {!isExpanded && (
            <span
              className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                isEnabled && !isMuted
                  ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                  : 'border-rose-300/25 bg-rose-400/10 text-rose-100'
              }`}
            >
              {isEnabled && !isMuted ? 'On' : 'Mute'}
            </span>
          )}
        </div>
        <p className="text-sm leading-snug text-slate-100">{message}</p>
        <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-100/40">
          <Sparkles className="h-3.5 w-3.5 text-cyan-200/55" />
          <span>{isExpanded ? 'Vista grande' : 'Tocar para abrir'}</span>
        </div>
      </button>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onTogglePower}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
            isEnabled
              ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
              : 'border-white/10 bg-white/5 text-white/70'
          }`}
        >
          <Power className="h-3.5 w-3.5" />
          Prendido
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
            isMuted
              ? 'border-rose-300/25 bg-rose-400/10 text-rose-100'
              : 'border-white/10 bg-white/5 text-white/70'
          }`}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          Mute
        </button>
      </div>
    </div>
  );
};
