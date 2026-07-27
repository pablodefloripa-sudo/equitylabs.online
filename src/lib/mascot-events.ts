export const MASCOT_EVENTS = {
  WELCOME: "eq:welcome",
  DASHBOARD_ENTERED: "eq:dashboard-entered",
  THINKING: "eq:thinking",
  TASK_SUGGESTED: "eq:task-suggested",
  PROGRESS_DETECTED: "eq:progress-detected",
  SUCCESS: "eq:success",
  ERROR: "eq:error",
  GUIDE_WEB: "eq:guide-web",
} as const;

export type MascotState =
  | "idle"
  | "welcome"
  | "thinking"
  | "suggesting"
  | "team_builder"
  | "celebrating"
  | "eating"
  | "alert"
  | "guide_web"
  | "call_by_name";

export type MascotEventPayloadMap = {
  [MASCOT_EVENTS.WELCOME]: { userName?: string; agentId?: string };
  [MASCOT_EVENTS.DASHBOARD_ENTERED]: { userName?: string; agentId?: string };
  [MASCOT_EVENTS.THINKING]: { reason?: string };
  [MASCOT_EVENTS.TASK_SUGGESTED]: {
    source?: string;
    agentName?: string;
    proposals?: string[];
    tasks?: string[];
    message?: string;
  };
  [MASCOT_EVENTS.PROGRESS_DETECTED]: {
    milestone: string;
    progress?: number;
    source?: string;
  };
  [MASCOT_EVENTS.SUCCESS]: { label?: string; rewardType?: "food" | "celebration" };
  [MASCOT_EVENTS.ERROR]: { message: string; code?: string };
  [MASCOT_EVENTS.GUIDE_WEB]: { route?: string; topic?: string };
};

export type MascotEventName = keyof MascotEventPayloadMap;

export const emitMascotEvent = <T extends MascotEventName>(
  name: T,
  detail: MascotEventPayloadMap[T],
) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const PROGRESS_KEYWORDS = [
  "hecho",
  "listo",
  "completado",
  "completa",
  "logrado",
  "avance",
  "entregado",
  "publicado",
  "enviado",
  "aprobado",
  "cerrado",
  "finalizado",
  "done",
  "completed",
  "published",
  "sent",
  "approved",
  "finished",
];

export const detectProgressMilestone = (text: string) => {
  const normalized = text.toLowerCase();
  const match = PROGRESS_KEYWORDS.find((keyword) => normalized.includes(keyword));

  if (!match) return null;

  const sentenceMatch = text.match(/[^.!?\n]+(?:[.!?]|\n|$)/);
  return sentenceMatch?.[0]?.trim() || match;
};

